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

    @Query("SELECT FUNCTION('DATE', s.saleDate) as date, SUM(s.totalAmount) FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to GROUP BY FUNCTION('DATE', s.saleDate) ORDER BY date")
    List<Object[]> getRevenueByDay(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    @Query("SELECT FUNCTION('YEAR', s.saleDate) as year, FUNCTION('MONTH', s.saleDate) as month, SUM(s.totalAmount) FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to GROUP BY year, month ORDER BY year, month")
    List<Object[]> getRevenueByMonth(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    @Query("SELECT FUNCTION('YEAR', s.saleDate) as year, SUM(s.totalAmount) FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to GROUP BY year ORDER BY year")
    List<Object[]> getRevenueByYear(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);

    // Thống kê khách hàng top theo doanh thu
    @Query("SELECT s.customer.name, SUM(s.totalAmount) as totalAmount, COUNT(s.id) as orderCount FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.saleDate BETWEEN :from AND :to GROUP BY s.customer.id, s.customer.name ORDER BY totalAmount DESC")
    List<Object[]> getTopCustomers(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to, org.springframework.data.domain.Pageable pageable);

    // Truy vấn max số thứ tự hiện có cho mã PCBxxxxxx
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(name, 4) AS BIGINT)), 0) FROM sale_transactions WHERE name LIKE 'PCB%'", nativeQuery = true)
    Long getMaxPcbSequence();

    @Query("SELECT s FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.deletedBy IS NULL ORDER BY s.saleDate DESC")
    List<SaleTransaction> findRecentSales(org.springframework.data.domain.Pageable pageable);

    // PCB linkage helpers
    boolean existsByStocktakeId(Long stocktakeId);
    long countByStocktakeId(Long stocktakeId);
    long countByStocktakeIdAndStatus(Long stocktakeId, SaleTransactionStatus status);
}

