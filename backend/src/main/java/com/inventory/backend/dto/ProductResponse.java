package com.inventory.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.inventory.backend.entity.Fraction;
import com.inventory.backend.entity.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProductResponse(
        Long id,
        String code,
        String name,
        String description,
        String barcode,
        BigDecimal price,
        BigDecimal minPrice,
        Boolean active,
        LocalDateTime createdAt,
        Boolean fractionable,
        List<FractionPrice> fractions,
        BigDecimal cost,            // solo ADMIN
        BigDecimal profitPerUnit,   // solo ADMIN
        BigDecimal marginPercent    // solo ADMIN
) {
    public record FractionPrice(
            Fraction fraction,
            String label,
            BigDecimal value,
            BigDecimal listPrice,
            BigDecimal minPrice
    ) {}

    public static ProductResponse from(Product p, boolean admin) {
        BigDecimal cost = null;
        BigDecimal profit = null;
        BigDecimal margin = null;

        if (admin && p.getCost() != null) {
            cost = p.getCost();
            profit = p.getPrice().subtract(cost);
            margin = profit.multiply(BigDecimal.valueOf(100))
                    .divide(cost, 2, RoundingMode.HALF_UP);
        }

        List<FractionPrice> fractions = p.getFractionPrices().stream()
                .sorted((a, b) -> a.getFraction().getValue()
                        .compareTo(b.getFraction().getValue()))
                .map(f -> new FractionPrice(
                        f.getFraction(), f.getFraction().getLabel(),
                        f.getFraction().getValue(), f.getListPrice(), f.floorPrice()))
                .toList();

        return new ProductResponse(
                p.getId(), p.getCode(), p.getName(), p.getDescription(),
                p.getBarcode(), p.getPrice(), p.getMinPrice(), p.getActive(),
                p.getCreatedAt(), p.getFractionable(), fractions,
                cost, profit, margin);
    }
}