package com.farmovo.backend.repositories;

import com.farmovo.backend.models.DebtNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface DebtNoteRepository extends JpaRepository<DebtNote, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<DebtNote> {

    Page<DebtNote> findByCustomerIdAndDeletedAtIsNull(Long customerId, Pageable pageable);
}