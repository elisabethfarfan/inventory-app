package com.inventory.backend.dto;

import java.math.BigDecimal;

public record PartnerDebt(
        Long partnerId,
        String partnerName,
        String phone,
        int pendingCount,
        BigDecimal pendingAmount
) {}