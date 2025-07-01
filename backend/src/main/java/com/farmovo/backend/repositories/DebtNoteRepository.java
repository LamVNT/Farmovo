package com.farmovo.backend.repositories;

import com.farmovo.backend.models.DebtNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebtNoteRepository extends JpaRepository<DebtNote, Long> {

    // Find all non-deleted debt notes
    @Query("SELECT d FROM DebtNote d WHERE d.deletedAt IS NULL")
    List<DebtNote> findAllActive();

    // Find all non-deleted debt notes by customer ID
    @Query("SELECT d FROM DebtNote d WHERE d.customer.id = :customerId AND d.deletedAt IS NULL")
    List<DebtNote> findByCustomerIdAndActive(Long customerId);

    // Find all non-deleted debt notes by store ID
    @Query("SELECT d FROM DebtNote d WHERE d.store.id = :storeId AND d.deletedAt IS NULL")
    List<DebtNote> findByStoreIdAndActive(Long storeId);

    // Find a non-deleted debt note by ID
    @Query("SELECT d FROM DebtNote d WHERE d.id = :id AND d.deletedAt IS NULL")
    DebtNote findByIdAndActive(Long id);
}