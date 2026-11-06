package com.inventory.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "open_containers")
public class OpenContainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    // Lo que queda, en baldes: 0.75000 = tres cuartos
    @Column(nullable = false, precision = 7, scale = 5)
    private BigDecimal remaining;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContainerStatus status = ContainerStatus.ABIERTO;

    @Column(nullable = false, length = 50)
    private String openedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime openedAt;

    private LocalDateTime closedAt;

    @Column(length = 200)
    private String note;

    @PrePersist
    protected void onCreate() {
        openedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public BigDecimal getRemaining() { return remaining; }
    public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }
    public ContainerStatus getStatus() { return status; }
    public void setStatus(ContainerStatus status) { this.status = status; }
    public String getOpenedBy() { return openedBy; }
    public void setOpenedBy(String openedBy) { this.openedBy = openedBy; }
    public LocalDateTime getOpenedAt() { return openedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}