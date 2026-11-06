package com.inventory.backend.dto;

import com.inventory.backend.entity.Role;

public record LoginResponse(
        String token,
        String username,
        String fullName,
        Role role
) {}