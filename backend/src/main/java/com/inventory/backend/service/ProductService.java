package com.inventory.backend.service;

import com.inventory.backend.dto.FractionPriceRequest;
import com.inventory.backend.dto.ProductRequest;
import com.inventory.backend.dto.ProductResponse;
import com.inventory.backend.entity.Fraction;
import com.inventory.backend.entity.Product;
import com.inventory.backend.entity.ProductFractionPrice;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listarProductos() {
        boolean admin = CurrentUser.isAdmin();
        return productRepository.findAll().stream()
                .map(p -> ProductResponse.from(p, admin))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse buscarProductoPorId(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con ID: " + id));
        return ProductResponse.from(product, CurrentUser.isAdmin());
    }

    @Transactional
    public ProductResponse registrarProducto(ProductRequest request) {
        String code = request.code().trim();
        String barcode = limpiar(request.barcode());

        if (productRepository.existsByCode(code)) {
            throw new IllegalArgumentException(
                    "Ya existe un producto con el código: " + code);
        }
        if (barcode != null && productRepository.existsByBarcode(barcode)) {
            throw new IllegalArgumentException(
                    "Ya existe un producto con ese código de barras");
        }

        Product product = new Product();
        aplicar(product, request, code, barcode);
        if (request.active() != null) {
            product.setActive(request.active());
        }

        return ProductResponse.from(productRepository.save(product), true);
    }

    @Transactional
    public ProductResponse actualizarProducto(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con ID: " + id));

        String code = request.code().trim();
        String barcode = limpiar(request.barcode());

        if (productRepository.existsByCodeAndIdNot(code, id)) {
            throw new IllegalArgumentException(
                    "Ya existe otro producto con el código: " + code);
        }
        if (barcode != null && productRepository.existsByBarcodeAndIdNot(barcode, id)) {
            throw new IllegalArgumentException(
                    "Ya existe otro producto con ese código de barras");
        }

        aplicar(product, request, code, barcode);
        if (request.active() != null) {
            product.setActive(request.active());
        }

        return ProductResponse.from(product, true);
    }

    @Transactional
    public ProductResponse cambiarEstado(Long id, boolean active) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con ID: " + id));
        product.setActive(active);
        return ProductResponse.from(product, true);
    }

    private void aplicar(Product p, ProductRequest r, String code, String barcode) {
        if (r.minPrice() != null && r.minPrice().compareTo(r.price()) > 0) {
            throw new IllegalArgumentException(
                    "El precio mínimo no puede ser mayor que el precio de lista");
        }

        p.setCode(code);
        p.setName(r.name().trim());
        p.setDescription(limpiar(r.description()));
        p.setBarcode(barcode);
        p.setCost(r.cost());
        p.setPrice(r.price());
        p.setMinPrice(r.minPrice());
        aplicarFracciones(p, r);
    }

    private void aplicarFracciones(Product p, ProductRequest r) {
        boolean fraccionable = Boolean.TRUE.equals(r.fractionable());
        p.setFractionable(fraccionable);

        List<FractionPriceRequest> pedidas =
                (fraccionable && r.fractions() != null) ? r.fractions() : List.of();

        if (fraccionable && pedidas.isEmpty()) {
            throw new IllegalArgumentException(
                    "Un producto fraccionable necesita al menos un precio por fracción");
        }

        Set<Fraction> vistas = new HashSet<>();
        for (FractionPriceRequest f : pedidas) {
            if (!vistas.add(f.fraction())) {
                throw new IllegalArgumentException(
                        "La fracción " + f.fraction().getLabel() + " está repetida");
            }
            if (f.minPrice() != null && f.minPrice().compareTo(f.listPrice()) > 0) {
                throw new IllegalArgumentException(
                        "El mínimo de " + f.fraction().getLabel()
                                + " no puede ser mayor que su precio de lista");
            }
        }

        // Quita las que ya no vienen, actualiza las existentes y agrega las nuevas
        p.getFractionPrices().removeIf(e -> !vistas.contains(e.getFraction()));

        for (FractionPriceRequest f : pedidas) {
            ProductFractionPrice entry = p.getFractionPrices().stream()
                    .filter(x -> x.getFraction() == f.fraction())
                    .findFirst()
                    .orElse(null);

            if (entry == null) {
                entry = new ProductFractionPrice();
                entry.setProduct(p);
                entry.setFraction(f.fraction());
                p.getFractionPrices().add(entry);
            }
            entry.setListPrice(f.listPrice());
            entry.setMinPrice(f.minPrice());
        }
    }

    private String limpiar(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}