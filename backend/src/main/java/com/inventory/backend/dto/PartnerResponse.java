package com.inventory.backend.dto;

import com.inventory.backend.entity.Partner;

public record PartnerResponse(Long id, String name, String phone, Boolean active) {
    public static PartnerResponse from(Partner p) {
        return new PartnerResponse(p.getId(), p.getName(), p.getPhone(), p.getActive());
    }
}