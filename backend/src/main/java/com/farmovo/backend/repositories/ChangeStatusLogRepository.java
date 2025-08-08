package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ChangeStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface ChangeStatusLogRepository extends JpaRepository<ChangeStatusLog, Long>,
        JpaSpecificationExecutor<ChangeStatusLog> {
    List<ChangeStatusLog> findByModelNameIgnoreCaseAndModelIDOrderByCreatedAtDesc(String modelName, Long modelID);
} 