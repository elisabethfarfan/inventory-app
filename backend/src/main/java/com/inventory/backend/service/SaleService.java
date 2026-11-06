package com.inventory.backend.service;

import com.inventory.backend.dto.SaleItemRequest;
import com.inventory.backend.dto.SaleRequest;
import com.inventory.backend.dto.SaleResponse;
import com.inventory.backend.entity.*;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.OpenContainerRepository;
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
import java.util.List;
import java.util.Set;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final OpenContainerRepository containerRepository;
    private final StockService stockService;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       OpenContainerRepository containerRepository,
                       StockService stockService) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.containerRepository = containerRepository;
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
            String clave = line.productId() + "-" + line.fraction();
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

        for (SaleItemRequest line : lines) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Producto no encontrado: " + line.productId()));

            BigDecimal unitPrice = line.unitPrice().setScale(2, RoundingMode.HALF_UP);

            BigDecimal listPrice;
            BigDecimal floor;
            BigDecimal cost = product.getCost();
            Fraction fraction = line.fraction();

            if (fraction != null) {
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
                throw new IllegalArgumentException(
                        "El precio mínimo de " + product.getName()
                                + (fraction != null ? " (" + fraction.getLabel() + ")" : "")
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
            sale.addItem(item);

            total = total.add(subtotal);
        }

        sale.setTotal(total);
        Sale saved = saleRepository.save(sale);

        // Descuenta del inventario. Si algo falla, se revierte toda la venta.
        for (SaleItem item : saved.getItems()) {
            if (item.getFraction() == null) {
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
            // Usa el balde abierto más antiguo que alcance
            container = usables.get(0);
            container.setRemaining(container.getRemaining().subtract(needed));
        } else {
            // Ninguno alcanza: abre uno nuevo (baja 1 del stock cerrado)
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