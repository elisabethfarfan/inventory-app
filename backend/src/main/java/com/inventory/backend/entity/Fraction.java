package com.inventory.backend.entity;

import java.math.BigDecimal;

public enum Fraction {
    TREINTAIDOSAVO("1/32", new BigDecimal("0.03125")),
    DIECISEISAVO("1/16", new BigDecimal("0.06250")),
    OCTAVO("1/8", new BigDecimal("0.12500")),
    CUARTO("1/4", new BigDecimal("0.25000")),
    MEDIO("1/2", new BigDecimal("0.50000"));

    private final String label;
    private final BigDecimal value;

    Fraction(String label, BigDecimal value) {
        this.label = label;
        this.value = value;
    }

    public String getLabel() { return label; }
    public BigDecimal getValue() { return value; }
}