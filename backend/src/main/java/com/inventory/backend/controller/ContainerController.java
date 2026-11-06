package com.inventory.backend.controller;

import com.inventory.backend.dto.ContainerResponse;
import com.inventory.backend.dto.ContainerSummary;
import com.inventory.backend.service.ContainerService;
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
}