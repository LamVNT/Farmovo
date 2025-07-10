package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ImportTransactionDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImportTransactionDetailRepository extends JpaRepository<ImportTransactionDetail, Long> {
    List<ImportTransactionDetail> findByProductId(Long productId);
    
    // Lấy tất cả ImportTransactionDetail có remainQuantity > 0
    List<ImportTransactionDetail> findByRemainQuantityGreaterThan(Integer remainQuantity);
    
    // Lấy ImportTransactionDetail theo productId và có remainQuantity > 0
    List<ImportTransactionDetail> findByProductIdAndRemainQuantityGreaterThan(Long productId, Integer remainQuantity);
}
