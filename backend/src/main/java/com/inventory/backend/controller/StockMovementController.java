
package com.inventory.backend.controller;

import com.inventory.backend.entity.StockMovement;
import com.inventory.backend.repository.StockMovementRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementRepository movementRepository;

    public StockMovementController(
            StockMovementRepository movementRepository) {
        this.movementRepository = movementRepository;
    }

    @GetMapping("/product/{productId}")
    public List<StockMovement> listarPorProducto(
            @PathVariable Long productId) {

        return movementRepository
                .findByProductIdOrderByCreatedAtDesc(productId);
    }

    @GetMapping
    public List<StockMovement> listarTodos() {
        return movementRepository.findTop200ByOrderByCreatedAtDesc();
    }
    }
