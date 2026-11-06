package com.inventory.backend.dto;

import com.inventory.backend.entity.AppUser;
import com.inventory.backend.entity.Role;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        Role role,
        Boolean active,
        LocalDateTime createdAt
) {
    public static UserResponse from(AppUser u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(),
                u.getRole(), u.getActive(), u.getCreatedAt());
    }
}