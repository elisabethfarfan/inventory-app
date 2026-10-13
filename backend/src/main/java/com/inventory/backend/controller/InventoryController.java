package com.inventory.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InventoryController {

    @GetMapping("/api/health")
    public String health() {
        return "El backend de inventario funciona correctamente";
    }
}
