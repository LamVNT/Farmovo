package com.farmovo.backend.repositories;

import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.SaleTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface SaleTransactionRepository extends JpaRepository<SaleTransaction, Long>, JpaSpecificationExecutor<SaleTransaction> {
    Optional<SaleTransaction> findTopByOrderByIdDesc();

    @Query("SELECT s FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.deletedBy IS NULL")
    List<SaleTransaction> findAllSaleActive();

    @Query("SELECT s FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.deletedBy IS NULL AND s.store.id = :storeId")
    List<SaleTransaction> findAllSaleActiveByStore(@Param("storeId") Long storeId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM SaleTransaction s WHERE s.deletedAt IS NULL")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.store.id = :storeId")
    BigDecimal sumTotalAmountByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT COUNT(s) FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.store.id = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);

    // Use native Postgres DATE() to group by day
    @Query(value = "SELECT DATE(sale_date) AS date, COALESCE(SUM(total_amount), 0) AS total " +
            "FROM sale_transactions " +
            "WHERE deleted_at IS NULL AND sale_date BETWEEN :from AND :to " +
            "GROUP BY DATE(sale_date) ORDER BY date", nativeQuery = true)
    List<Object[]> getRevenueByDay(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    // Use native Postgres EXTRACT for month grouping
    @Query(value = "SELECT EXTRACT(YEAR FROM sale_date) AS year, EXTRACT(MONTH FROM sale_date) AS month, COALESCE(SUM(total_amount), 0) AS total " +
            "FROM sale_transactions " +
            "WHERE deleted_at IS NULL AND sale_date BETWEEN :from AND :to " +
            "GROUP BY year, month ORDER BY year, month", nativeQuery = true)
    List<Object[]> getRevenueByMonth(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    // Use native Postgres EXTRACT for year grouping
    @Query(value = "SELECT EXTRACT(YEAR FROM sale_date) AS year, COALESCE(SUM(total_amount), 0) AS total " +
            "FROM sale_transactions " +
            "WHERE deleted_at IS NULL AND sale_date BETWEEN :from AND :to " +
            "GROUP BY year ORDER BY year", nativeQuery = true)
    List<Object[]> getRevenueByYear(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    // Store-specific revenue queries
    @Query(value = "SELECT DATE(sale_date) AS date, COALESCE(SUM(total_amount), 0) AS total " +
            "FROM sale_transactions " +
            "WHERE deleted_at IS NULL AND sale_date BETWEEN :from AND :to AND store_id = :storeId " +
            "GROUP BY DATE(sale_date) ORDER BY date", nativeQuery = true)
    List<Object[]> getRevenueByDayAndStore(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, @Param("storeId") Long storeId);

    @Query(value = "SELECT EXTRACT(YEAR FROM sale_date) AS year, EXTRACT(MONTH FROM sale_date) AS month, COALESCE(SUM(total_amount), 0) AS total " +
            "FROM sale_transactions " +
            "WHERE deleted_at IS NULL AND sale_date BETWEEN :from AND :to AND store_id = :storeId " +
            "GROUP BY year, month ORDER BY year, month", nativeQuery = true)
    List<Object[]> getRevenueByMonthAndStore(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, @Param("storeId") Long storeId);

    @Query(value = "SELECT EXTRACT(YEAR FROM sale_date) AS year, COALESCE(SUM(total_amount), 0) AS total " +
            "FROM sale_transactions " +
            "WHERE deleted_at IS NULL AND sale_date BETWEEN :from AND :to AND store_id = :storeId " +
            "GROUP BY year ORDER BY year", nativeQuery = true)
    List<Object[]> getRevenueByYearAndStore(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, @Param("storeId") Long storeId);

    // Thống kê khách hàng top theo doanh thu
    @Query("SELECT s.customer.name, SUM(s.totalAmount) as totalAmount, COUNT(s.id) as orderCount FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to GROUP BY s.customer.id, s.customer.name ORDER BY totalAmount DESC")
    List<Object[]> getTopCustomers(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT s.customer.name, SUM(s.totalAmount) as totalAmount, COUNT(s.id) as orderCount FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to AND s.store.id = :storeId GROUP BY s.customer.id, s.customer.name ORDER BY totalAmount DESC")
    List<Object[]> getTopCustomersByStore(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, @Param("storeId") Long storeId, org.springframework.data.domain.Pageable pageable);

    // Truy vấn max số thứ tự hiện có cho mã PCBxxxxxx
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(name, 4) AS BIGINT)), 0) FROM sale_transactions WHERE name LIKE 'PCB%'", nativeQuery = true)
    Long getMaxPcbSequence();

    @Query("SELECT s FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.deletedBy IS NULL ORDER BY s.createdAt DESC")
    List<SaleTransaction> findRecentSales(org.springframework.data.domain.Pageable pageable);

    // PCB linkage helpers
    boolean existsByStocktakeId(Long stocktakeId);
    long countByStocktakeId(Long stocktakeId);
    long countByStocktakeIdAndStatus(Long stocktakeId, SaleTransactionStatus status);
    
    // Thêm method để lấy PCB theo stocktakeId
    List<SaleTransaction> findByStocktakeId(Long stocktakeId);

    // ✅ Thêm method để load customer và store cùng với sale transaction
    @Query("SELECT s FROM SaleTransaction s LEFT JOIN FETCH s.customer LEFT JOIN FETCH s.store WHERE s.id = :id")
    Optional<SaleTransaction> findByIdWithCustomerAndStore(@Param("id") Long id);

    // ✅ New: fetch active sales in a date range
    @Query("SELECT s FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to")
    List<SaleTransaction> findAllSaleActiveBetween(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);
}

