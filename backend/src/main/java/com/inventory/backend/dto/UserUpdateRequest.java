package com.inventory.backend.dto;

import com.inventory.backend.entity.Role;
import jakarta.validation.constraints.*;

public record UserUpdateRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String fullName,

        @NotNull(message = "El rol es obligatorio")
        Role role,

        @NotNull(message = "El estado es obligatorio")
        Boolean active,

        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        String password
) {}