package com.inventory.backend.service;

import com.inventory.backend.dto.LoginRequest;
import com.inventory.backend.dto.LoginResponse;
import com.inventory.backend.entity.AppUser;
import com.inventory.backend.exception.InvalidCredentialsException;
import com.inventory.backend.repository.AppUserRepository;
import com.inventory.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AppUserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        AppUser user = userRepository.findByUsername(request.username().trim())
                .filter(AppUser::getActive)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Usuario o contraseña incorrectos"));

        return new LoginResponse(
                jwtService.generateToken(user),
                user.getUsername(),
                user.getFullName(),
                user.getRole());
    }
}