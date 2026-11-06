package com.inventory.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_fraction_prices",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "fraction"}))
public class ProductFractionPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Fraction fraction;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal listPrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal minPrice;

    // Piso efectivo: si no hay mínimo, el precio de lista
    public BigDecimal floorPrice() {
        return minPrice != null ? minPrice : listPrice;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public Fraction getFraction() { return fraction; }
    public void setFraction(Fraction fraction) { this.fraction = fraction; }
    public BigDecimal getListPrice() { return listPrice; }
    public void setListPrice(BigDecimal listPrice) { this.listPrice = listPrice; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
}