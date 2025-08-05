package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ChangeStatusLog;
import com.farmovo.backend.models.ImportTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ChangeStatusLogRepository extends JpaRepository<ChangeStatusLog, Long>,
        JpaSpecificationExecutor<ChangeStatusLog> {
} 