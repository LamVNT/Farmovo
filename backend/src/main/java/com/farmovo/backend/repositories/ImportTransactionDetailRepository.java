package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ImportTransactionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT d FROM ImportTransactionDetail d " +
            "JOIN d.importTransaction t " +
            "WHERE d.product.id = :productId " +
            "AND t.status = 'COMPLETE' " +
            "AND d.remainQuantity > 0")
    List<ImportTransactionDetail> findCompletedDetailsWithQuantityByProductId(@Param("productId") Long productId);


    // Lấy tất cả ImportTransactionDetail có remainQuantity > 0
    List<ImportTransactionDetail> findByRemainQuantityGreaterThan(Integer remainQuantity);

    // Lấy ImportTransactionDetail theo productId và có remainQuantity > 0
    List<ImportTransactionDetail> findByProductIdAndRemainQuantityGreaterThan(Long productId, Integer remainQuantity);

    // === CÁC QUERY MỚI CHO STOCKTAKE ===

    // Lấy tất cả zones_id có sản phẩm còn tồn kho (remainQuantity > 0)
    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findAllZoneIdsWithProducts();

    // Lấy tất cả ImportTransactionDetail theo zoneId (tìm trong JSON zones_id)
    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.zones_id LIKE %:zoneId%")
    List<ImportTransactionDetail> findByZoneId(@Param("zoneId") String zoneId);

    // Lấy tất cả zones_id của một sản phẩm cụ thể
    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i WHERE i.product.id = :productId AND i.remainQuantity > 0 AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findZoneIdsByProductId(@Param("productId") Long productId);

    // Lấy tất cả sản phẩm có trong một zone cụ thể
    @Query("SELECT DISTINCT i.product.id FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.zones_id LIKE %:zoneId%")
    List<Long> findProductIdsByZoneId(@Param("zoneId") String zoneId);

    // Lấy chi tiết ImportTransactionDetail theo zoneId
    @Query("SELECT i.id, i.product.id, i.product.productName, i.remainQuantity, i.zones_id, i.expireDate FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.zones_id LIKE %:zoneId%")
    List<Object[]> findDetailsByZoneId(@Param("zoneId") String zoneId);
}
