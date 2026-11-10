package com.inventory.backend.dto;

import jakarta.validation.constraints.Size;

public record BorrowingCloseRequest(
        @Size(max = 300, message = "La nota no puede superar 300 caracteres")
        String note
) {}