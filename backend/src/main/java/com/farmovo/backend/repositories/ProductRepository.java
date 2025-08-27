package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.store ORDER BY p.createdAt DESC, p.updatedAt DESC")
    List<Product> findAllWithCategoryAndStore();

    @Query("SELECT p FROM Product p WHERE p.category IS NULL OR p.store IS NULL")
    List<Product> findProductsWithoutCategoryOrStore();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.store.id = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);

    // Kiểm tra tên sản phẩm tồn tại (không phân biệt hoa thường) trong cùng store và category
    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) = LOWER(:productName) AND p.store.id = :storeId AND p.category.id = :categoryId")
    Optional<Product> findByProductNameAndStoreAndCategoryIgnoreCase(
        @Param("productName") String productName, 
        @Param("storeId") Long storeId, 
        @Param("categoryId") Long categoryId
    );

    // Kiểm tra tên sản phẩm tồn tại khi cập nhật (loại trừ sản phẩm hiện tại)
    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) = LOWER(:productName) AND p.store.id = :storeId AND p.category.id = :categoryId AND p.id != :excludeId")
    Optional<Product> findByProductNameAndStoreAndCategoryIgnoreCaseExcludingId(
        @Param("productName") String productName, 
        @Param("storeId") Long storeId, 
        @Param("categoryId") Long categoryId,
        @Param("excludeId") Long excludeId
    );

    // Kiểm tra tên sản phẩm tồn tại chỉ trong cùng store (cho Owner - không cần kiểm tra category)
    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) = LOWER(:productName) AND p.store.id = :storeId")
    Optional<Product> findByProductNameAndStoreIgnoreCase(
        @Param("productName") String productName, 
        @Param("storeId") Long storeId
    );

    // Kiểm tra tên sản phẩm tồn tại khi cập nhật chỉ trong cùng store (cho Owner)
    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) = LOWER(:productName) AND p.store.id = :storeId AND p.id != :excludeId")
    Optional<Product> findByProductNameAndStoreIgnoreCaseExcludingId(
        @Param("productName") String productName, 
        @Param("storeId") Long storeId,
        @Param("excludeId") Long excludeId
    );

}
