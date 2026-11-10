package com.inventory.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.inventory.backend.entity.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SaleResponse(
        Long id,
        String customerName,
        PaymentMethod paymentMethod,
        String note,
        BigDecimal total,
        SaleStatus status,
        String soldBy,
        LocalDateTime createdAt,
        String cancelledBy,
        LocalDateTime cancelledAt,
        String cancelReason,
        BigDecimal totalDiscount,
        BigDecimal totalProfit,      // solo ADMIN
        List<Item> items
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Item(
            Long productId,
            String productCode,
            String productName,
            Integer quantity,
            String fractionLabel,
            Long containerId,
            String externalFrom,         // tienda de origen, si fue prestado
            BigDecimal listPrice,
            BigDecimal minPrice,
            BigDecimal unitPrice,
            BigDecimal discountPerUnit,
            BigDecimal discountPercent,
            String discountReason,
            BigDecimal subtotal,
            BigDecimal cost,             // solo ADMIN
            BigDecimal profit            // solo ADMIN
    ) {}

    public static SaleResponse from(Sale s, boolean admin) {
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;
        boolean hayCosto = false;

        List<Item> items = new ArrayList<>();
        for (SaleItem i : s.getItems()) {
            BigDecimal list = i.getListPrice() != null ? i.getListPrice() : i.getUnitPrice();
            BigDecimal disc = list.subtract(i.getUnitPrice()).max(BigDecimal.ZERO);
            BigDecimal pct = list.signum() == 0 ? BigDecimal.ZERO
                    : disc.multiply(BigDecimal.valueOf(100))
                          .divide(list, 2, RoundingMode.HALF_UP);

            totalDiscount = totalDiscount.add(disc.multiply(BigDecimal.valueOf(i.getQuantity())));

            BigDecimal cost = null;
            BigDecimal profit = null;
            if (admin && i.getCost() != null) {
                cost = i.getCost();
                profit = i.getUnitPrice().subtract(cost)
                        .multiply(BigDecimal.valueOf(i.getQuantity()));
                totalProfit = totalProfit.add(profit);
                hayCosto = true;
            }

            items.add(new Item(
                    i.getProduct().getId(), i.getProduct().getCode(),
                    i.getProduct().getName(), i.getQuantity(),
                    i.getFraction() != null ? i.getFraction().getLabel() : null,
                    i.getContainerId(),
                    i.getExternalPartnerName(),
                    list, i.getMinPrice(), i.getUnitPrice(), disc, pct,
                    i.getDiscountReason(), i.getSubtotal(), cost, profit));
        }

        return new SaleResponse(s.getId(), s.getCustomerName(), s.getPaymentMethod(),
                s.getNote(), s.getTotal(), s.getStatus(), s.getSoldBy(), s.getCreatedAt(),
                s.getCancelledBy(), s.getCancelledAt(), s.getCancelReason(),
                totalDiscount, (admin && hayCosto) ? totalProfit : null, items);
    }
}