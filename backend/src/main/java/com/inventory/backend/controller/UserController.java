package com.inventory.backend.controller;

import com.inventory.backend.dto.UserCreateRequest;
import com.inventory.backend.dto.UserResponse;
import com.inventory.backend.dto.UserUpdateRequest;
import com.inventory.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> listar() {
        return userService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse crear(@Valid @RequestBody UserCreateRequest request) {
        return userService.crear(request);
    }

    @PutMapping("/{id}")
    public UserResponse actualizar(@PathVariable Long id,
                                   @Valid @RequestBody UserUpdateRequest request,
                                   Authentication authentication) {
        return userService.actualizar(id, request, authentication.getName());
    }
}