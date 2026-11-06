package com.inventory.backend.service;

import com.inventory.backend.dto.UserCreateRequest;
import com.inventory.backend.dto.UserResponse;
import com.inventory.backend.dto.UserUpdateRequest;
import com.inventory.backend.entity.AppUser;
import com.inventory.backend.entity.Role;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final AppUserRepository repository;
    private final PasswordEncoder encoder;

    public UserService(AppUserRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listar() {
        return repository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse crear(UserCreateRequest request) {
        String username = request.username().trim();

        if (repository.existsByUsername(username)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese nombre");
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setFullName(request.fullName().trim());
        user.setPassword(encoder.encode(request.password()));
        user.setRole(request.role());

        return UserResponse.from(repository.save(user));
    }

    @Transactional
    public UserResponse actualizar(Long id, UserUpdateRequest request, String usuarioActual) {
        AppUser user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con ID: " + id));

        boolean esUnoMismo = user.getUsername().equals(usuarioActual);

        if (esUnoMismo && (!request.active() || request.role() != Role.ADMIN)) {
            throw new IllegalArgumentException(
                    "No puedes desactivarte ni quitarte el rol de administrador");
        }

        // No dejar el sistema sin administradores activos
        boolean dejaDeSerAdminActivo = user.getRole() == Role.ADMIN && user.getActive()
                && (request.role() != Role.ADMIN || !request.active());
        if (dejaDeSerAdminActivo
                && repository.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw new IllegalArgumentException(
                    "Debe quedar al menos un administrador activo");
        }

        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setActive(request.active());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(encoder.encode(request.password()));
        }

        return UserResponse.from(user);
    }
}