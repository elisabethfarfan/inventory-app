package com.inventory.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelSaleRequest(
        @NotBlank(message = "El motivo de la anulación es obligatorio")
        @Size(max = 200, message = "El motivo no puede superar 200 caracteres")
        String reason
) {}