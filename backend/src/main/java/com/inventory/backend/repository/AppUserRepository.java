package com.inventory.backend.repository;

import com.inventory.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.inventory.backend.entity.Role;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);

    long countByRoleAndActiveTrue(Role role);
}