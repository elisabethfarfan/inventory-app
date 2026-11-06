package com.inventory.backend.controller;

import com.inventory.backend.dto.ProductRequest;
import com.inventory.backend.dto.ProductResponse;
import com.inventory.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> listarProductos() {
        return productService.listarProductos();
    }

    @GetMapping("/{id}")
    public ProductResponse buscarProductoPorId(@PathVariable Long id) {
        return productService.buscarProductoPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse registrarProducto(@Valid @RequestBody ProductRequest request) {
        return productService.registrarProducto(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return productService.actualizarProducto(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse cambiarEstado(
            @PathVariable Long id,
            @RequestParam boolean value) {
        return productService.cambiarEstado(id, value);
    }
}