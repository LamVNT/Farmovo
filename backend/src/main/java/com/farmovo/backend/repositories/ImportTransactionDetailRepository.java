package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ImportTransactionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import com.farmovo.backend.models.ImportTransactionStatus;

@Repository
public interface ImportTransactionDetailRepository extends JpaRepository<ImportTransactionDetail, Long> {
    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.product.id = :productId AND i.remainQuantity > 0")
    List<ImportTransactionDetail> findByProductIdAndRemain(@Param("productId") Long productId);

    @Query("SELECT i.product.id, SUM(i.remainQuantity) FROM ImportTransactionDetail i GROUP BY i.product.id")
    List<Object[]> getRemainByProduct();

    @Query("SELECT i.product.id, SUM(i.remainQuantity) FROM ImportTransactionDetail i WHERE i.product.store.id = :storeId GROUP BY i.product.id")
    List<Object[]> getRemainByProductByStore(@Param("storeId") Long storeId);

    // Lấy remain theo product chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT i.product.id, SUM(i.remainQuantity) FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status GROUP BY i.product.id")
    List<Object[]> getRemainByProductCompleted(@Param("status") ImportTransactionStatus status);

    @Query("SELECT i.product.id, SUM(i.remainQuantity) FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND i.product.store.id = :storeId GROUP BY i.product.id")
    List<Object[]> getRemainByProductCompletedByStore(@Param("status") ImportTransactionStatus status, @Param("storeId") Long storeId);

    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.expireDate BETWEEN :now AND :soon")
    List<ImportTransactionDetail> findExpiringLots(@Param("now") java.time.LocalDateTime now, @Param("soon") java.time.LocalDateTime soon);

    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.product.store.id = :storeId AND i.expireDate BETWEEN :now AND :soon")
    List<ImportTransactionDetail> findExpiringLotsByStore(@Param("storeId") Long storeId, @Param("now") java.time.LocalDateTime now, @Param("soon") java.time.LocalDateTime soon);

    // Lấy expiring lots chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT i FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.expireDate BETWEEN :now AND :soon AND t.status = :status")
    List<ImportTransactionDetail> findExpiringLotsCompleted(@Param("now") java.time.LocalDateTime now, @Param("soon") java.time.LocalDateTime soon, @Param("status") ImportTransactionStatus status);

    @Query("SELECT i FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.product.store.id = :storeId AND i.expireDate BETWEEN :now AND :soon AND t.status = :status")
    List<ImportTransactionDetail> findExpiringLotsCompletedByStore(@Param("storeId") Long storeId, @Param("now") java.time.LocalDateTime now, @Param("soon") java.time.LocalDateTime soon, @Param("status") ImportTransactionStatus status);

    List<ImportTransactionDetail> findByProductId(Long productId);

    @Query("SELECT d FROM ImportTransactionDetail d " +
            "JOIN d.importTransaction t " +
            "WHERE d.product.id = :productId " +
            "AND t.status = 'COMPLETE' " +
            "AND d.remainQuantity > 0")
    List<ImportTransactionDetail> findCompletedDetailsWithQuantityByProductId(@Param("productId") Long productId);


    // Lấy tất cả ImportTransactionDetail có remainQuantity > 0
    List<ImportTransactionDetail> findByRemainQuantityGreaterThan(Integer remainQuantity);

    // Lấy ImportTransactionDetail có remainQuantity > 0 và ImportTransaction có status cụ thể
    @Query("SELECT d FROM ImportTransactionDetail d JOIN d.importTransaction t WHERE d.remainQuantity > :remainQuantity AND t.status = :status")
    List<ImportTransactionDetail> findByRemainQuantityGreaterThanAndImportTransactionStatus(@Param("remainQuantity") Integer remainQuantity, @Param("status") ImportTransactionStatus status);

    // Lấy ImportTransactionDetail theo productId và có remainQuantity > 0
    List<ImportTransactionDetail> findByProductIdAndRemainQuantityGreaterThan(Long productId, Integer remainQuantity);

    // Lấy ImportTransactionDetail theo productId và có remainQuantity > 0 chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT i FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.product.id = :productId AND i.remainQuantity > :remainQuantity AND t.status = :status")
    List<ImportTransactionDetail> findByProductIdAndRemainQuantityGreaterThanCompleted(@Param("productId") Long productId, @Param("remainQuantity") Integer remainQuantity, @Param("status") ImportTransactionStatus status);

    // Tìm lô theo tên chính xác
    ImportTransactionDetail findByName(String name);

    // Tìm nhiều lô theo danh sách tên
    List<ImportTransactionDetail> findByNameIn(List<String> names);

    // === CÁC QUERY MỚI CHO STOCKTAKE ===

    // Lấy tất cả zones_id có sản phẩm còn tồn kho (remainQuantity > 0)
    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findAllZoneIdsWithProducts();

    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.product.store.id = :storeId AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findAllZoneIdsWithProductsByStore(@Param("storeId") Long storeId);

    // Lấy tất cả zones_id có sản phẩm còn tồn kho chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findAllZoneIdsWithProductsCompleted(@Param("status") ImportTransactionStatus status);

    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND i.product.store.id = :storeId AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findAllZoneIdsWithProductsCompletedByStore(@Param("status") ImportTransactionStatus status, @Param("storeId") Long storeId);

    // Lấy tất cả ImportTransactionDetail theo zoneId (tìm trong JSON zones_id)
    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<ImportTransactionDetail> findByZoneId(@Param("zoneId") String zoneId);

    @Query("SELECT i FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.product.store.id = :storeId AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<ImportTransactionDetail> findByZoneIdAndStore(@Param("zoneId") String zoneId, @Param("storeId") Long storeId);

    // Lấy theo zoneId chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT i FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<ImportTransactionDetail> findByZoneIdCompleted(@Param("zoneId") String zoneId, @Param("status") ImportTransactionStatus status);

    @Query("SELECT i FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND i.product.store.id = :storeId AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<ImportTransactionDetail> findByZoneIdCompletedByStore(@Param("zoneId") String zoneId, @Param("status") ImportTransactionStatus status, @Param("storeId") Long storeId);

    // Lấy tất cả zones_id của một sản phẩm cụ thể
    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i WHERE i.product.id = :productId AND i.remainQuantity > 0 AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findZoneIdsByProductId(@Param("productId") Long productId);

    // Lấy tất cả zones_id của một sản phẩm cụ thể chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT DISTINCT i.zones_id FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.product.id = :productId AND i.remainQuantity > 0 AND t.status = :status AND i.zones_id IS NOT NULL AND i.zones_id != ''")
    List<String> findZoneIdsByProductIdCompleted(@Param("productId") Long productId, @Param("status") ImportTransactionStatus status);

    // Lấy tất cả sản phẩm có trong một zone cụ thể
    @Query("SELECT DISTINCT i.product.id FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<Long> findProductIdsByZoneId(@Param("zoneId") String zoneId);

    // Lấy tất cả sản phẩm có trong một zone cụ thể chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT DISTINCT i.product.id FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<Long> findProductIdsByZoneIdCompleted(@Param("zoneId") String zoneId, @Param("status") ImportTransactionStatus status);

    // Lấy chi tiết ImportTransactionDetail theo zoneId
    @Query("SELECT i.id, i.product.id, i.product.productName, i.remainQuantity, i.zones_id, i.expireDate FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<Object[]> findDetailsByZoneId(@Param("zoneId") String zoneId);

    // Lấy chi tiết theo zoneId chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT i.id, i.product.id, i.product.productName, i.remainQuantity, i.zones_id, i.expireDate FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND CONCAT(',', i.zones_id, ',') LIKE CONCAT('%,', :zoneId, ',%')")
    List<Object[]> findDetailsByZoneIdCompleted(@Param("zoneId") String zoneId, @Param("status") ImportTransactionStatus status);

    @Query("SELECT i.product.category.categoryName, SUM(i.remainQuantity) FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 GROUP BY i.product.category.categoryName")
    List<Object[]> getStockByCategory();

    @Query("SELECT i.product.category.categoryName, SUM(i.remainQuantity) FROM ImportTransactionDetail i WHERE i.remainQuantity > 0 AND i.product.store.id = :storeId GROUP BY i.product.category.categoryName")
    List<Object[]> getStockByCategoryByStore(@Param("storeId") Long storeId);

    // Lấy stock theo category chỉ từ các phiếu nhập đã hoàn thành (COMPLETE status)
    @Query("SELECT i.product.category.categoryName, SUM(i.remainQuantity) FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status GROUP BY i.product.category.categoryName")
    List<Object[]> getStockByCategoryCompleted(@Param("status") ImportTransactionStatus status);

    @Query("SELECT i.product.category.categoryName, SUM(i.remainQuantity) FROM ImportTransactionDetail i JOIN i.importTransaction t WHERE i.remainQuantity > 0 AND t.status = :status AND i.product.store.id = :storeId GROUP BY i.product.category.categoryName")
    List<Object[]> getStockByCategoryCompletedByStore(@Param("status") ImportTransactionStatus status, @Param("storeId") Long storeId);

    @Query("SELECT d.product.productName, d.product.category.categoryName, SUM(d.remainQuantity) as totalQty " +
            "FROM ImportTransactionDetail d " +
            "WHERE d.importTransaction.importDate BETWEEN :from AND :to " +
            "GROUP BY d.product.id, d.product.productName, d.product.category.categoryName " +
            "ORDER BY totalQty DESC")
    List<Object[]> getTopProducts(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, org.springframework.data.domain.Pageable pageable);
}
