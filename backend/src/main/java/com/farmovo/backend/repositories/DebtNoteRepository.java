package com.farmovo.backend.repositories;

import com.farmovo.backend.models.DebtNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface DebtNoteRepository extends JpaRepository<DebtNote, Long> {

    @Query("SELECT SUM(d.debtAmount) FROM DebtNote d WHERE d.customer.id = :customerId AND d.deletedAt IS NULL")
    BigDecimal calculateTotalDebtByCustomerId(Long customerId);
}