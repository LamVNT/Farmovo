package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.store")
    List<Product> findAllWithCategoryAndStore();

    @Query("SELECT p FROM Product p WHERE p.category IS NULL OR p.store IS NULL")
    List<Product> findProductsWithoutCategoryOrStore();

}
