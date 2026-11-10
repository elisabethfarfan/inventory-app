package com.inventory.backend.controller;

import com.inventory.backend.dto.PartnerRequest;
import com.inventory.backend.dto.PartnerResponse;
import com.inventory.backend.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partners")
public class PartnerController {

    private final PartnerService service;

    public PartnerController(PartnerService service) {
        this.service = service;
    }

    // Todos ven las activas; el admin puede pedir todas con ?all=true
    @GetMapping
    public List<PartnerResponse> listar(@RequestParam(defaultValue = "false") boolean all) {
        return service.listar(all);
    }

    // El operador puede crear una tienda al vuelo
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PartnerResponse crear(@Valid @RequestBody PartnerRequest request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PartnerResponse actualizar(@PathVariable Long id,
                                      @Valid @RequestBody PartnerRequest request) {
        return service.actualizar(id, request);
    }
}