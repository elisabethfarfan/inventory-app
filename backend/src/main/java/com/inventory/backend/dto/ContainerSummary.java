package com.inventory.backend.dto;

import java.math.BigDecimal;

public record ContainerSummary(
        Long productId,
        String productCode,
        String productName,
        int closedStock,           // baldes cerrados
        int openCount,             // baldes abiertos
        BigDecimal openRemaining   // suma de lo que queda en los abiertos
) {}