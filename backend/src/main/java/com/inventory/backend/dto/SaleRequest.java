package com.inventory.backend.dto;

import com.inventory.backend.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record SaleRequest(
        @Size(max = 100, message = "El nombre del cliente no puede superar 100 caracteres")
        String customerName,

        @NotNull(message = "El método de pago es obligatorio")
        PaymentMethod paymentMethod,

        @Size(max = 300, message = "La nota no puede superar 300 caracteres")
        String note,

        @NotEmpty(message = "La venta debe tener al menos un producto")
        @Valid
        List<SaleItemRequest> items
) {}