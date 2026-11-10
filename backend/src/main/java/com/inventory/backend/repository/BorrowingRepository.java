package com.inventory.backend.repository;

import com.inventory.backend.entity.Borrowing;
import com.inventory.backend.entity.BorrowingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BorrowingRepository extends JpaRepository<Borrowing, Long> {

    @EntityGraph(attributePaths = {"partner", "product"})
    List<Borrowing> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"partner", "product"})
    List<Borrowing> findByStatusOrderByCreatedAtDesc(BorrowingStatus status);

    @EntityGraph(attributePaths = {"partner", "product"})
    List<Borrowing> findBySaleId(Long saleId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Borrowing b WHERE b.id = :id")
    Optional<Borrowing> findForUpdateById(@Param("id") Long id);
}