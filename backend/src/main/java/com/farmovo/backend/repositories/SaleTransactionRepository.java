package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.SaleTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SaleTransactionRepository extends JpaRepository<SaleTransaction, Long> {
    Optional<SaleTransaction> findTopByOrderByIdDesc();

    @Query("SELECT s FROM SaleTransaction s WHERE s.deletedAt IS NULL AND s.deletedBy IS NULL")
    List<SaleTransaction> findAllSaleActive();
}

