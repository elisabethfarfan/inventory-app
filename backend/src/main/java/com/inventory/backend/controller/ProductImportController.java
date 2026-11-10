package com.inventory.backend.controller;

import com.inventory.backend.dto.ImportResult;
import com.inventory.backend.service.ProductImportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products/import")
@PreAuthorize("hasRole('ADMIN')")
public class ProductImportController {

    private final ProductImportService service;

    public ProductImportController(ProductImportService service) {
        this.service = service;
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> plantilla() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"plantilla-productos.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(service.plantilla());
    }

    // dryRun=true: solo valida y muestra errores, no guarda
    @PostMapping
    public ImportResult importar(@RequestParam("file") MultipartFile file,
                                 @RequestParam(defaultValue = "false") boolean dryRun) {
        return service.importar(file, dryRun);
    }
}