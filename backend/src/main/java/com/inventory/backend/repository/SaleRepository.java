package com.inventory.backend.repository;

import com.inventory.backend.entity.Sale;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    // Filtros opcionales: vendedor y rango de fechas (desde incluido, hasta excluido)
    @EntityGraph(attributePaths = {"items", "items.product"})
    @Query("""
            SELECT DISTINCT s FROM Sale s
            WHERE (:seller IS NULL OR s.soldBy = :seller)
              AND s.createdAt >= :from
              AND s.createdAt < :to
            ORDER BY s.createdAt DESC
            """)
    List<Sale> search(@Param("seller") String seller,
                      @Param("from") LocalDateTime from,
                      @Param("to") LocalDateTime to);

    @EntityGraph(attributePaths = {"items", "items.product"})
    java.util.Optional<Sale> findWithItemsById(Long id);
}