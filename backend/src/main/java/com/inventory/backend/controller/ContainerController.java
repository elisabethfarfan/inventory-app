package com.inventory.backend.controller;

import com.inventory.backend.dto.ContainerAdjustRequest;
import com.inventory.backend.dto.ContainerResponse;
import com.inventory.backend.dto.ContainerSummary;
import com.inventory.backend.dto.ContainerWriteOffRequest;
import com.inventory.backend.service.ContainerService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/containers")
public class ContainerController {

    private final ContainerService containerService;

    public ContainerController(ContainerService containerService) {
        this.containerService = containerService;
    }

    @GetMapping
    public List<ContainerResponse> listar() {
        return containerService.listarAbiertos();
    }

    @GetMapping("/summary")
    public List<ContainerSummary> resumen() {
        return containerService.resumen();
    }

    @PatchMapping("/{id}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ContainerResponse ajustar(@PathVariable Long id,
                                     @Valid @RequestBody ContainerAdjustRequest request) {
        return containerService.ajustar(id, request);
    }

    @PostMapping("/{id}/write-off")
    @PreAuthorize("hasRole('ADMIN')")
    public ContainerResponse baja(@PathVariable Long id,
                                  @Valid @RequestBody ContainerWriteOffRequest request) {
        return containerService.darDeBaja(id, request);
    }
}