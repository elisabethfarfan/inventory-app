package com.inventory.backend.dto;

import com.inventory.backend.entity.OpenContainer;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContainerResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        BigDecimal remaining,
        String openedBy,
        LocalDateTime openedAt
) {
    public static ContainerResponse from(OpenContainer c) {
        return new ContainerResponse(
                c.getId(), c.getProduct().getId(), c.getProduct().getCode(),
                c.getProduct().getName(), c.getRemaining(), c.getOpenedBy(), c.getOpenedAt());
    }
}