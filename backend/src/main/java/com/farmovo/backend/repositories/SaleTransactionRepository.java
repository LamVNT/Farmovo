package com.farmovo.backend.repositories;

import com.farmovo.backend.models.SaleTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleTransactionRepository extends JpaRepository<SaleTransaction, Long> {
}

