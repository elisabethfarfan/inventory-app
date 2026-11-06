package com.inventory.backend.service;

import com.inventory.backend.entity.Product;
import com.inventory.backend.entity.Stock;
import com.inventory.backend.entity.StockMovement;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.StockMovementRepository;
import com.inventory.backend.repository.StockRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StockService {

    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;

    public StockService(
            StockRepository stockRepository,
            ProductRepository productRepository,
            StockMovementRepository movementRepository) {
        this.stockRepository = stockRepository;
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public Stock registrarEntrada(Long productId, int cantidad) {
        validarCantidad(cantidad);

        Product product = buscarProducto(productId);
        validarProductoActivo(product);

        Stock stock = stockRepository.findByProductId(productId)
                .orElseGet(() -> {
                    Stock nuevoStock = new Stock();
                    nuevoStock.setProduct(product);
                    nuevoStock.setQuantity(0);
                    nuevoStock.setMinimumStock(5);
                    return nuevoStock;
                });

        int stockAnterior = stock.getQuantity();
        int stockNuevo = stockAnterior + cantidad;

        stock.setQuantity(stockNuevo);
        Stock stockGuardado = stockRepository.save(stock);

        registrarMovimiento(
                product, "ENTRADA", cantidad, stockAnterior, stockNuevo, null, null);

        return stockGuardado;
    }

    // Salida manual (sin venta asociada)
    @Transactional
    public Stock registrarSalida(Long productId, int cantidad) {
        return registrarSalida(productId, cantidad, null, null);
    }

    // Salida asociada a una venta
    @Transactional
    public Stock registrarSalida(Long productId, int cantidad, Long saleId) {
        return registrarSalida(productId, cantidad, saleId, null);
    }

    // Salida asociada a una venta y, opcionalmente, a un balde abierto
    @Transactional
    public Stock registrarSalida(Long productId, int cantidad, Long saleId, Long containerId) {
        validarCantidad(cantidad);

        // Bloquea la fila de stock mientras dura la transacción
        Stock stock = stockRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El producto todavía no tiene stock registrado"));

        Product product = stock.getProduct();
        validarProductoActivo(product);

        int stockAnterior = stock.getQuantity();

        if (stockAnterior < cantidad) {
            throw new IllegalArgumentException(
                    "Stock insuficiente. Cantidad disponible: "
                            + stockAnterior);
        }

        int stockNuevo = stockAnterior - cantidad;

        stock.setQuantity(stockNuevo);
        Stock stockGuardado = stockRepository.save(stock);

        registrarMovimiento(
                product, "SALIDA", cantidad, stockAnterior, stockNuevo, saleId, containerId);

        return stockGuardado;
    }

    // Abrir un balde: baja 1 del stock cerrado
    @Transactional
    public Stock abrirBalde(Long productId, Long saleId, Long containerId) {
        return registrarSalida(productId, 1, saleId, containerId);
    }

    @Transactional(readOnly = true)
    public Stock consultarStock(Long productId) {
        return stockRepository.findByProductId(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El producto todavía no tiene stock registrado"));
    }

    @Transactional(readOnly = true)
    public List<Stock> listarStockBajo() {
        return stockRepository.findStockBajo();
    }

    @Transactional(readOnly = true)
    public List<Stock> listarTodo() {
        return stockRepository.findAll();
    }

    private Product buscarProducto(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado: " + productId));
    }

    private void validarCantidad(int cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException(
                    "La cantidad debe ser mayor que cero");
        }
    }

    private void validarProductoActivo(Product product) {
        if (!product.getActive()) {
            throw new IllegalArgumentException(
                    "No se puede mover stock de un producto inactivo");
        }
    }

    // El usuario sale del token JWT (lo carga JwtAuthFilter)
    private String usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null)
                ? auth.getName()
                : "desconocido";
    }

    private void registrarMovimiento(
            Product product,
            String tipo,
            int cantidad,
            int stockAnterior,
            int stockNuevo,
            Long saleId,
            Long containerId) {

        StockMovement movimiento = new StockMovement();
        movimiento.setProduct(product);
        movimiento.setType(tipo);
        movimiento.setQuantity(cantidad);
        movimiento.setPreviousStock(stockAnterior);
        movimiento.setNewStock(stockNuevo);
        movimiento.setRegisteredBy(usuarioActual());
        movimiento.setSaleId(saleId);
        movimiento.setContainerId(containerId);

        movementRepository.save(movimiento);
    }
}