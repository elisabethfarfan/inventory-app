package com.inventory.backend.dto;

import java.util.List;

public record ImportResult(
        boolean dryRun,
        int totalRows,
        int validRows,
        int created,
        List<ImportRowError> errors
) {}