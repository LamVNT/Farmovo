package com.farmovo.backend.repositories;

import com.farmovo.backend.models.DebtNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface DebtNoteRepository extends JpaRepository<DebtNote, Long> {

    // Query riêng cho import (debtType = '+', tính tăng nợ)
    @Query("""
        SELECT COALESCE(SUM(COALESCE(d.debtAmount, 0.0)), 0.0)
        FROM DebtNote d
        WHERE d.customer.id = :customerId AND d.debtType = '+' AND d.deletedAt IS NULL
    """)
    BigDecimal getTotalImportDebtByCustomerId(@Param("customerId") Long customerId);

    // Query riêng cho sale (debtType = '-', tính giảm nợ, dùng dấu trừ nếu cần)
    @Query("""
        SELECT COALESCE(SUM(COALESCE(d.debtAmount, 0.0)), 0.0)
        FROM DebtNote d
        WHERE d.customer.id = :customerId AND d.debtType = '-' AND d.deletedAt IS NULL
    """)
    BigDecimal getTotalSaleDebtByCustomerId(@Param("customerId") Long customerId);

    // Nếu cần tổng hợp, tính ở service: total = import + sale

    Page<DebtNote> findByCustomerIdAndDeletedAtIsNull(Long customerId, Pageable pageable);
}