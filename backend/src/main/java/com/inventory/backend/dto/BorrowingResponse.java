package com.inventory.backend.dto;

import com.inventory.backend.entity.Borrowing;
import com.inventory.backend.entity.BorrowingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BorrowingResponse(
        Long id,
        Long partnerId,
        String partnerName,
        Long productId,
        String productCode,
        String productName,
        Integer quantity,
        BigDecimal unitCost,
        BigDecimal total,
        BorrowingStatus status,
        Long saleId,
        String registeredBy,
        LocalDateTime createdAt,
        String closedBy,
        LocalDateTime closedAt,
        String note
) {
    public static BorrowingResponse from(Borrowing b) {
        return new BorrowingResponse(
                b.getId(), b.getPartner().getId(), b.getPartner().getName(),
                b.getProduct().getId(), b.getProduct().getCode(), b.getProduct().getName(),
                b.getQuantity(), b.getUnitCost(), b.total(), b.getStatus(), b.getSaleId(),
                b.getRegisteredBy(), b.getCreatedAt(), b.getClosedBy(), b.getClosedAt(), b.getNote());
    }
}