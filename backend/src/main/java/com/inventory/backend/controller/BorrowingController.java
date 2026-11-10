package com.inventory.backend.controller;

import com.inventory.backend.dto.BorrowingCloseRequest;
import com.inventory.backend.dto.BorrowingResponse;
import com.inventory.backend.dto.PartnerDebt;
import com.inventory.backend.entity.BorrowingStatus;
import com.inventory.backend.service.BorrowingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrowings")
@PreAuthorize("hasRole('ADMIN')")
public class BorrowingController {

    private final BorrowingService service;

    public BorrowingController(BorrowingService service) {
        this.service = service;
    }

    @GetMapping
    public List<BorrowingResponse> listar(@RequestParam(required = false) BorrowingStatus status) {
        return service.listar(status);
    }

    @GetMapping("/debts")
    public List<PartnerDebt> deudas() {
        return service.deudas();
    }

    @PostMapping("/{id}/pay")
    public BorrowingResponse pagar(@PathVariable Long id,
                                   @Valid @RequestBody(required = false) BorrowingCloseRequest request) {
        return service.pagar(id, request);
    }

    @PostMapping("/{id}/return")
    public BorrowingResponse devolver(@PathVariable Long id,
                                      @Valid @RequestBody(required = false) BorrowingCloseRequest request) {
        return service.devolver(id, request);
    }
}