package com.inventory.backend.dto;

import com.inventory.backend.entity.Fraction;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SaleItemRequest(
        @NotNull(message = "El producto es obligatorio")
        Long productId,

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser mayor que cero")
        Integer quantity,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor que cero")
        BigDecimal unitPrice,

        @Size(max = 200, message = "El motivo no puede superar 200 caracteres")
        String discountReason,

        // null = balde/unidad entera
        Fraction fraction,

        // Si viene, el producto se consigue en esa tienda (no sale de tu stock)
        Long partnerId,

        @DecimalMin(value = "0.0", inclusive = false, message = "El costo de la tienda debe ser mayor que cero")
        BigDecimal externalCost
) {}