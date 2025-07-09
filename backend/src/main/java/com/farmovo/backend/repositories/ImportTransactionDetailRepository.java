package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ImportTransactionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImportTransactionDetailRepository extends JpaRepository<ImportTransactionDetail, Long> {
    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.product.id = :productId AND i.remainQuantity > 0")
    List<ImportTransactionDetail> findByProductIdAndRemain(@Param("productId") Long productId);

    @Query("SELECT i.product.id, SUM(i.remainQuantity) FROM ImportTransactionDetail i GROUP BY i.product.id")
    List<Object[]> getRemainByProduct();

    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.expireDate BETWEEN :now AND :soon")
    List<ImportTransactionDetail> findExpiringLots(@Param("now") java.time.LocalDateTime now, @Param("soon") java.time.LocalDateTime soon);
    List<ImportTransactionDetail> findByProductId(Long productId);
}
