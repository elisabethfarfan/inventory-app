package com.inventory.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank(message = "El código del producto es obligatorio")
        @Size(max = 50, message = "El código no puede superar 50 caracteres")
        String code,

        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
        String name,

        @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
        String description,

        @Size(max = 100, message = "El código de barras no puede superar 100 caracteres")
        String barcode,

        @DecimalMin(value = "0.0", inclusive = false, message = "El costo debe ser mayor que cero")
        BigDecimal cost,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor que cero")
        BigDecimal price,

        @DecimalMin(value = "0.0", inclusive = false, message = "El precio mínimo debe ser mayor que cero")
        BigDecimal minPrice,

        Boolean active,

        Boolean fractionable,

        @Valid
        List<FractionPriceRequest> fractions
) {}