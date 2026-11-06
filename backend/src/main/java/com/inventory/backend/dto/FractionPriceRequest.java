package com.inventory.backend.dto;

import com.inventory.backend.entity.Fraction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FractionPriceRequest(
        @NotNull(message = "La fracción es obligatoria")
        Fraction fraction,

        @NotNull(message = "El precio de la fracción es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El precio de la fracción debe ser mayor que cero")
        BigDecimal listPrice,

        @DecimalMin(value = "0.0", inclusive = false, message = "El mínimo de la fracción debe ser mayor que cero")
        BigDecimal minPrice
) {}