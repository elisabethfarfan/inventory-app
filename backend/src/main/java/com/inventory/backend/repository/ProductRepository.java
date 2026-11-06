package com.inventory.backend.repository;

import com.inventory.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByCode(String code);

    boolean existsByBarcode(String barcode);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByBarcodeAndIdNot(String barcode, Long id);
}