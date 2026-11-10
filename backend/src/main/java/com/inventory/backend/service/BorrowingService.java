package com.inventory.backend.service;

import com.inventory.backend.dto.BorrowingCloseRequest;
import com.inventory.backend.dto.BorrowingResponse;
import com.inventory.backend.dto.PartnerDebt;
import com.inventory.backend.entity.Borrowing;
import com.inventory.backend.entity.BorrowingStatus;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.BorrowingRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BorrowingService {

    private final BorrowingRepository repository;

    public BorrowingService(BorrowingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<BorrowingResponse> listar(BorrowingStatus status) {
        List<Borrowing> l = (status == null)
                ? repository.findAllByOrderByCreatedAtDesc()
                : repository.findByStatusOrderByCreatedAtDesc(status);
        return l.stream().map(BorrowingResponse::from).toList();
    }

    // Lo que debes a cada tienda (solo pendientes)
    @Transactional(readOnly = true)
    public List<PartnerDebt> deudas() {
        Map<Long, PartnerDebt> mapa = new LinkedHashMap<>();
        for (Borrowing b : repository.findByStatusOrderByCreatedAtDesc(BorrowingStatus.PENDIENTE)) {
            PartnerDebt actual = mapa.get(b.getPartner().getId());
            BigDecimal monto = (actual == null ? BigDecimal.ZERO : actual.pendingAmount()).add(b.total());
            int cantidad = (actual == null ? 0 : actual.pendingCount()) + 1;
            mapa.put(b.getPartner().getId(), new PartnerDebt(
                    b.getPartner().getId(), b.getPartner().getName(),
                    b.getPartner().getPhone(), cantidad, monto));
        }
        return List.copyOf(mapa.values());
    }

    // Se cierra pagando dinero a la tienda
    @Transactional
    public BorrowingResponse pagar(Long id, BorrowingCloseRequest r) {
        return cerrar(id, BorrowingStatus.PAGADO, r);
    }

    // Se cierra devolviendo producto a la tienda
    @Transactional
    public BorrowingResponse devolver(Long id, BorrowingCloseRequest r) {
        return cerrar(id, BorrowingStatus.DEVUELTO, r);
    }

    private BorrowingResponse cerrar(Long id, BorrowingStatus nuevo, BorrowingCloseRequest r) {
        Borrowing b = repository.findForUpdateById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Préstamo no encontrado: " + id));

        if (b.getStatus() != BorrowingStatus.PENDIENTE) {
            throw new IllegalArgumentException(
                    "El préstamo #" + id + " ya está " + b.getStatus().name().toLowerCase());
        }

        b.setStatus(nuevo);
        b.setClosedBy(usuario());
        b.setClosedAt(LocalDateTime.now());
        if (r != null && r.note() != null && !r.note().isBlank()) {
            b.setNote(r.note().trim());
        }
        return BorrowingResponse.from(b);
    }

    private String usuario() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null ? a.getName() : "desconocido";
    }
}