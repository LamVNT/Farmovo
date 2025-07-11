package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ImportTransactionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImportTransactionDetailRepository extends JpaRepository<ImportTransactionDetail, Long> {
    List<ImportTransactionDetail> findByProductId(Long productId);

    @Query("SELECT d FROM ImportTransactionDetail d " +
            "JOIN d.importTransaction t " +
            "WHERE d.product.id = :productId " +
            "AND t.status = 'COMPLETE' " +
            "AND d.remainQuantity > 0")
    List<ImportTransactionDetail> findCompletedDetailsWithQuantityByProductId(@Param("productId") Long productId);

}
