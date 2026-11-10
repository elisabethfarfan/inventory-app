package com.inventory.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ContainerAdjustRequest(
        @NotNull(message = "El nuevo contenido es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false,
                message = "El contenido debe ser mayor que cero (para vaciarlo, dalo de baja)")
        @DecimalMax(value = "1.0", message = "El contenido no puede superar un balde")
        BigDecimal remaining,

        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 200, message = "El motivo no puede superar 200 caracteres")
        String reason
) {}