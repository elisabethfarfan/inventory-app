package com.inventory.backend.config;

import com.inventory.backend.entity.AppUser;
import com.inventory.backend.entity.Role;
import com.inventory.backend.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner crearAdministrador(
            AppUserRepository repository,
            PasswordEncoder encoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password) {

        return args -> {
            if (repository.count() == 0) {
                AppUser admin = new AppUser();
                admin.setUsername(username);
                admin.setPassword(encoder.encode(password));
                admin.setFullName("Administrador");
                admin.setRole(Role.ADMIN);
                repository.save(admin);
                System.out.println("Usuario administrador creado: " + username);
            }
        };
    }
}