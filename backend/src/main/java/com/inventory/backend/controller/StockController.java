
package com.inventory.backend.controller;

import com.inventory.backend.entity.Stock;
import com.inventory.backend.service.StockService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @PostMapping("/{productId}/entrada")
    public Stock registrarEntrada(
            @PathVariable Long productId,
            @RequestParam int cantidad) {

        return stockService.registrarEntrada(productId, cantidad);
    }

    @PostMapping("/{productId}/salida")
    public Stock registrarSalida(
            @PathVariable Long productId,
            @RequestParam int cantidad) {

        return stockService.registrarSalida(productId, cantidad);
    }

    @GetMapping("/{productId}")
    public Stock consultarStock(@PathVariable Long productId) {
        return stockService.consultarStock(productId);
    }

    
    @GetMapping("/alertas")
    public java.util.List<Stock> listarStockBajo() {
        return stockService.listarStockBajo();
    }

    @GetMapping
    public java.util.List<Stock> listarTodo() {
        return stockService.listarTodo();
    }

}
