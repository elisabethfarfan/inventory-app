package com.inventory.backend.service;

import com.inventory.backend.dto.PartnerRequest;
import com.inventory.backend.dto.PartnerResponse;
import com.inventory.backend.entity.Partner;
import com.inventory.backend.exception.ResourceNotFoundException;
import com.inventory.backend.repository.PartnerRepository;
import com.inventory.backend.security.CurrentUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;

@Service
public class PartnerService {

    private final PartnerRepository repository;

    public PartnerService(PartnerRepository repository) {
        this.repository = repository;
    }

    // "Ferretería  López" y "ferreteria lopez" dan la misma clave
    static String normalizar(String s) {
        String sinTildes = Normalizer.normalize(s.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase().replaceAll("\\s+", " ");
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> listar(boolean todas) {
        List<Partner> l = (todas && CurrentUser.isAdmin())
                ? repository.findAllByOrderByNameAsc()
                : repository.findByActiveTrueOrderByNameAsc();
        return l.stream().map(PartnerResponse::from).toList();
    }

    // Si ya existe una tienda con ese nombre, devuelve la existente
    @Transactional
    public PartnerResponse crear(PartnerRequest r) {
        String nombre = r.name().trim().replaceAll("\\s+", " ");
        String clave = normalizar(nombre);

        Partner existente = repository.findByNormalizedName(clave).orElse(null);
        if (existente != null) {
            if (!existente.getActive()) {
                throw new IllegalArgumentException(
                        "La tienda \"" + existente.getName() + "\" existe pero está desactivada");
            }
            return PartnerResponse.from(existente);
        }

        Partner p = new Partner();
        p.setName(nombre);
        p.setNormalizedName(clave);
        p.setPhone(limpiar(r.phone()));
        p.setCreatedBy(usuario());
        return PartnerResponse.from(repository.save(p));
    }

    @Transactional
    public PartnerResponse actualizar(Long id, PartnerRequest r) {
        Partner p = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tienda no encontrada: " + id));

        String nombre = r.name().trim().replaceAll("\\s+", " ");
        String clave = normalizar(nombre);
        if (repository.existsByNormalizedNameAndIdNot(clave, id)) {
            throw new IllegalArgumentException("Ya existe otra tienda con ese nombre");
        }

        p.setName(nombre);
        p.setNormalizedName(clave);
        p.setPhone(limpiar(r.phone()));
        if (r.active() != null) p.setActive(r.active());
        return PartnerResponse.from(p);
    }

    private String limpiar(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private String usuario() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null ? a.getName() : "desconocido";
    }
}