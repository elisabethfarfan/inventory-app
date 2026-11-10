package com.inventory.backend.service;

import com.inventory.backend.dto.CancelSaleRequest;
import com.inventory.backend.dto.SaleItemRequest;
import com.inventory.backend.dto.SaleRequest;
import com.inventory.backend.dto.SaleResponse;
import com.inventory.backend.entity.*;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.BorrowingRepository;
import com.inventory.backend.repository.OpenContainerRepository;
import com.inventory.backend.repository.PartnerRepository;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.SaleRepository;
import com.inventory.backend.security.CurrentUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final OpenContainerRepository containerRepository;
    private final PartnerRepository partnerRepository;
    private final BorrowingRepository borrowingRepository;
    private final StockService stockService;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       OpenContainerRepository containerRepository,
                       PartnerRepository partnerRepository,
                       BorrowingRepository borrowingRepository,
                       StockService stockService) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.containerRepository = containerRepository;
        this.partnerRepository = partnerRepository;
        this.borrowingRepository = borrowingRepository;
        this.stockService = stockService;
    }

    @Transactional
    public SaleResponse registrar(SaleRequest request) {
        boolean admin = CurrentUser.isAdmin();
        String usuario = usuarioActual();

        // Orden por producto: evita bloqueos cruzados entre ventas simultáneas
        List<SaleItemRequest> lines = request.items().stream()
                .sorted(Comparator.comparing(SaleItemRequest::productId))
                .toList();

        Set<String> vistos = new HashSet<>();
        for (SaleItemRequest line : lines) {
            String clave = line.productId() + "-" + line.fraction() + "-" + line.partnerId();
            if (!vistos.add(clave)) {
                throw new IllegalArgumentException(
                        "El producto " + line.productId()
                                + " aparece repetido con la misma presentación; suma las cantidades");
            }
        }

        Sale sale = new Sale();
        sale.setCustomerName(blankToNull(request.customerName()));
        sale.setPaymentMethod(request.paymentMethod());
        sale.setNote(blankToNull(request.note()));
        sale.setSoldBy(usuario);

        BigDecimal total = BigDecimal.ZERO;
        Map<SaleItem, Partner> externas = new IdentityHashMap<>();

        for (SaleItemRequest line : lines) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Producto no encontrado: " + line.productId()));

            BigDecimal unitPrice = line.unitPrice().setScale(2, RoundingMode.HALF_UP);

            BigDecimal listPrice;
            BigDecimal floor;
            BigDecimal cost = product.getCost();
            Fraction fraction = line.fraction();
            Partner partner = null;

            if (line.partnerId() != null) {
                // Producto conseguido en otra tienda
                if (fraction != null) {
                    throw new IllegalArgumentException(
                            "Un producto de otra tienda no se puede vender fraccionado");
                }
                if (line.externalCost() == null) {
                    throw new IllegalArgumentException(
                            "Indica el costo que te cobra la tienda por " + product.getName());
                }
                if (!Boolean.TRUE.equals(product.getActive())) {
                    throw new IllegalArgumentException(
                            "No se puede vender un producto inactivo: " + product.getName());
                }
                partner = partnerRepository.findById(line.partnerId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Tienda no encontrada: " + line.partnerId()));
                if (!partner.getActive()) {
                    throw new IllegalArgumentException(
                            "La tienda \"" + partner.getName() + "\" está desactivada");
                }
                cost = line.externalCost().setScale(2, RoundingMode.HALF_UP);
                listPrice = product.getPrice();
                floor = cost; // no se puede vender por debajo de lo que debes
            } else if (fraction != null) {
                if (!Boolean.TRUE.equals(product.getFractionable())) {
                    throw new IllegalArgumentException(
                            product.getName() + " no se vende fraccionado");
                }
                ProductFractionPrice fp = product.getFractionPrices().stream()
                        .filter(x -> x.getFraction() == line.fraction())
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException(
                                product.getName() + " no tiene precio para "
                                        + line.fraction().getLabel()));
                listPrice = fp.getListPrice();
                floor = fp.floorPrice();
                if (cost != null) {
                    cost = cost.multiply(fraction.getValue())
                            .setScale(2, RoundingMode.HALF_UP);
                }
            } else {
                listPrice = product.getPrice();
                floor = product.floorPrice();
            }

            if (!admin && unitPrice.compareTo(floor) < 0) {
                String detalle = partner != null ? " (costo de la tienda)"
                        : (fraction != null ? " (" + fraction.getLabel() + ")" : "");
                throw new IllegalArgumentException(
                        "El precio mínimo de " + product.getName() + detalle
                                + " es S/ " + floor.setScale(2, RoundingMode.HALF_UP));
            }

            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(line.quantity()));

            SaleItem item = new SaleItem();
            item.setProduct(product);
            item.setQuantity(line.quantity());
            item.setListPrice(listPrice);
            item.setMinPrice(floor);
            item.setCost(cost);
            item.setUnitPrice(unitPrice);
            item.setFraction(fraction);
            item.setDiscountReason(blankToNull(line.discountReason()));
            item.setSubtotal(subtotal);
            if (partner != null) {
                item.setExternalPartnerName(partner.getName());
                externas.put(item, partner);
            }
            sale.addItem(item);

            total = total.add(subtotal);
        }

        sale.setTotal(total);
        Sale saved = saleRepository.save(sale);

        // Descuenta del inventario propio o registra la deuda con la tienda.
        // Si algo falla, se revierte toda la venta.
        for (SaleItem item : saved.getItems()) {
            Partner partner = externas.get(item);
            if (partner != null) {
                Borrowing b = new Borrowing();
                b.setPartner(partner);
                b.setProduct(item.getProduct());
                b.setQuantity(item.getQuantity());
                b.setUnitCost(item.getCost());
                b.setSaleId(saved.getId());
                b.setRegisteredBy(usuario);
                b = borrowingRepository.save(b);
                item.setBorrowingId(b.getId());
            } else if (item.getFraction() == null) {
                stockService.registrarSalida(
                        item.getProduct().getId(), item.getQuantity(), saved.getId());
            } else {
                descontarFraccion(item, saved.getId(), usuario);
            }
        }

        return SaleResponse.from(saved, admin);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> listar(String vendedor, LocalDate desde, LocalDate hasta) {
        boolean admin = CurrentUser.isAdmin();

        // El operador solo ve lo suyo, sin importar lo que pida
        String seller = admin ? blankToNull(vendedor) : usuarioActual();

        LocalDate d = desde != null ? desde : LocalDate.now().minusDays(30);
        LocalDate h = hasta != null ? hasta : LocalDate.now();
        if (h.isBefore(d)) {
            throw new IllegalArgumentException(
                    "La fecha final no puede ser anterior a la inicial");
        }

        return saleRepository.search(seller, d.atStartOfDay(), h.plusDays(1).atStartOfDay())
                .stream()
                .map(s -> SaleResponse.from(s, admin))
                .toList();
    }

    @Transactional(readOnly = true)
    public SaleResponse buscar(Long id) {
        boolean admin = CurrentUser.isAdmin();
        Sale sale = saleRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Venta no encontrada: " + id));

        if (!admin && !sale.getSoldBy().equals(usuarioActual())) {
            throw new AccessDeniedException("No tienes permiso para ver esta venta");
        }
        return SaleResponse.from(sale, admin);
    }

    @Transactional
    public SaleResponse anular(Long id, CancelSaleRequest request) {
        Sale sale = saleRepository.findForUpdateById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada: " + id));

        if (sale.getStatus() == SaleStatus.ANULADA) {
            throw new IllegalArgumentException("La venta #" + id + " ya está anulada");
        }

        // Una deuda ya pagada o devuelta no se puede deshacer sola
        List<Borrowing> deudas = borrowingRepository.findBySaleId(id);
        for (Borrowing b : deudas) {
            if (b.getStatus() == BorrowingStatus.PAGADO || b.getStatus() == BorrowingStatus.DEVUELTO) {
                throw new IllegalArgumentException(
                        "No se puede anular: el préstamo #" + b.getId() + " con "
                                + b.getPartner().getName() + " ya fue "
                                + b.getStatus().name().toLowerCase()
                                + ". Resuélvelo con la tienda primero");
            }
        }

        for (SaleItem item : sale.getItems()) {
            if (item.getBorrowingId() != null) {
                continue; // no tocó tu stock
            }
            if (item.getFraction() == null) {
                stockService.reponer(item.getProduct().getId(), item.getQuantity(), sale.getId());
            } else {
                devolverAlBalde(item);
            }
        }

        for (Borrowing b : deudas) {
            if (b.getStatus() == BorrowingStatus.PENDIENTE) {
                b.setStatus(BorrowingStatus.CANCELADO);
                b.setClosedBy(usuarioActual());
                b.setClosedAt(LocalDateTime.now());
                b.setNote("Venta #" + id + " anulada");
            }
        }

        sale.setStatus(SaleStatus.ANULADA);
        sale.setCancelledBy(usuarioActual());
        sale.setCancelledAt(LocalDateTime.now());
        sale.setCancelReason(request.reason().trim());

        return SaleResponse.from(sale, true);
    }

    private void devolverAlBalde(SaleItem item) {
        BigDecimal amount = item.getFraction().getValue()
                .multiply(BigDecimal.valueOf(item.getQuantity()));

        if (item.getContainerId() == null) {
            throw new IllegalStateException("La línea fraccionada no tiene balde asociado");
        }

        OpenContainer container = containerRepository.findForUpdateById(item.getContainerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Balde no encontrado: " + item.getContainerId()));

        if (container.getStatus() == ContainerStatus.BAJA) {
            throw new IllegalArgumentException(
                    "El balde #" + container.getId()
                            + " fue dado de baja; no se puede devolver el contenido");
        }

        BigDecimal nuevo = container.getRemaining().add(amount);
        if (nuevo.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException(
                    "El balde #" + container.getId()
                            + " excedería su capacidad; revisa los ajustes");
        }

        container.setRemaining(nuevo);
        if (container.getStatus() == ContainerStatus.VACIO) {
            container.setStatus(ContainerStatus.ABIERTO);
            container.setClosedAt(null);
        }
    }

    private void descontarFraccion(SaleItem item, Long saleId, String usuario) {
        Product product = item.getProduct();
        BigDecimal needed = item.getFraction().getValue()
                .multiply(BigDecimal.valueOf(item.getQuantity()));

        if (needed.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException(
                    "Más de un balde completo: vende " + product.getName()
                            + " como balde entero");
        }

        List<OpenContainer> usables =
                containerRepository.findUsable(product.getId(), needed);

        OpenContainer container;
        if (!usables.isEmpty()) {
            container = usables.get(0);
            container.setRemaining(container.getRemaining().subtract(needed));
        } else {
            container = new OpenContainer();
            container.setProduct(product);
            container.setRemaining(BigDecimal.ONE.subtract(needed));
            container.setOpenedBy(usuario);
            container = containerRepository.save(container);
            stockService.abrirBalde(product.getId(), saleId, container.getId());
        }

        if (container.getRemaining().signum() == 0) {
            container.setStatus(ContainerStatus.VACIO);
            container.setClosedAt(LocalDateTime.now());
        }

        item.setContainerId(container.getId());
    }

    private String usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "desconocido";
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}