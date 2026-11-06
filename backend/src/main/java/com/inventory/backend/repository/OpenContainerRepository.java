package com.inventory.backend.repository;

import com.inventory.backend.entity.ContainerStatus;
import com.inventory.backend.entity.OpenContainer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface OpenContainerRepository extends JpaRepository<OpenContainer, Long> {

    List<OpenContainer> findByStatusOrderByOpenedAtAsc(ContainerStatus status);

    // Baldes abiertos con suficiente contenido, el más antiguo primero
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c FROM OpenContainer c
            WHERE c.product.id = :productId
              AND c.status = com.inventory.backend.entity.ContainerStatus.ABIERTO
              AND c.remaining >= :amount
            ORDER BY c.openedAt ASC
            """)
    List<OpenContainer> findUsable(@Param("productId") Long productId,
                                   @Param("amount") BigDecimal amount);
}