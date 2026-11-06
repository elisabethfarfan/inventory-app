package com.inventory.backend.controller;

import com.inventory.backend.dto.SaleRequest;
import com.inventory.backend.dto.SaleResponse;
import com.inventory.backend.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SaleResponse registrar(@Valid @RequestBody SaleRequest request) {
        return saleService.registrar(request);
    }

    @GetMapping
    public List<SaleResponse> listar(
            @RequestParam(required = false) String seller,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return saleService.listar(seller, from, to);
    }

    @GetMapping("/{id}")
    public SaleResponse buscar(@PathVariable Long id) {
        return saleService.buscar(id);
    }
}