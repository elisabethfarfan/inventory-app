package com.inventory.backend.repository;

import com.inventory.backend.entity.Partner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartnerRepository extends JpaRepository<Partner, Long> {

    Optional<Partner> findByNormalizedName(String normalizedName);

    boolean existsByNormalizedNameAndIdNot(String normalizedName, Long id);

    List<Partner> findByActiveTrueOrderByNameAsc();

    List<Partner> findAllByOrderByNameAsc();
}