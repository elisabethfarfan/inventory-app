package com.inventory.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El código del producto es obligatorio")
    @Size(max = 50, message = "El código no puede superar 50 caracteres")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(unique = true, length = 100)
    private String barcode;

    // Costo de compra: nunca se serializa desde la entidad
    @JsonIgnore
    @DecimalMin(value = "0.0", inclusive = false,
            message = "El costo debe ser mayor que cero")
    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    // Precio de lista
    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false,
            message = "El precio debe ser mayor que cero")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Piso de venta (si es null, el piso es el precio de lista)
    @DecimalMin(value = "0.0", inclusive = false,
            message = "El precio mínimo debe ser mayor que cero")
    @Column(precision = 12, scale = 2)
    private BigDecimal minPrice;

    @Column(nullable = false)
    private Boolean active = true;

    // Se vende por fracciones (pinturas, etc.)
    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean fractionable = false;

    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductFractionPrice> fractionPrices = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Product() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();

        if (active == null) {
            active = true;
        }
        if (fractionable == null) {
            fractionable = false;
        }
    }

    public BigDecimal floorPrice() {
        return minPrice != null ? minPrice : price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Boolean getFractionable() { return fractionable; }
    public void setFractionable(Boolean fractionable) { this.fractionable = fractionable; }

    public List<ProductFractionPrice> getFractionPrices() { return fractionPrices; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}