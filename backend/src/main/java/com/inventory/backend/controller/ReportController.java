package com.inventory.backend.controller;

import com.inventory.backend.security.CurrentUser;
import com.inventory.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/profit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> ganancias(
            @RequestParam(defaultValue = "day") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return file(reportService.gananciasExcel(period, from, to), "ganancias-" + period + ".xlsx");
    }

    // Operador: sin costo ni ganancia. Admin: completo.
    @GetMapping("/products")
    public ResponseEntity<byte[]> productos() {
        return file(reportService.productosExcel(CurrentUser.isAdmin()), "productos.xlsx");
    }

    private ResponseEntity<byte[]> file(byte[] data, String name) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                .contentType(XLSX)
                .body(data);
    }
}