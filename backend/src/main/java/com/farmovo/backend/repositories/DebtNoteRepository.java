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
    @Query("""
        SELECT COALESCE(SUM(
            CASE
                WHEN d.debtType = '+' THEN COALESCE(d.debtAmount, 0.0)
                WHEN d.debtType = '-' THEN -COALESCE(d.debtAmount, 0.0)
                ELSE 0.0
            END
        ), 0.0)
        FROM DebtNote d
        WHERE d.customer.id = :customerId AND d.deletedAt IS NULL
    """)
    BigDecimal calculateTotalDebtByCustomerId(@Param("customerId") Long customerId);

    Page<DebtNote> findByCustomerIdAndDeletedAtIsNull(Long customerId, Pageable pageable);
}