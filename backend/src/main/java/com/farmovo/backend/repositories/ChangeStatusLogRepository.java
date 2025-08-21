package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ChangeStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ChangeStatusLogRepository extends JpaRepository<ChangeStatusLog, Long>,
        JpaSpecificationExecutor<ChangeStatusLog> {
    List<ChangeStatusLog> findByModelNameIgnoreCaseAndModelIDOrderByCreatedAtDesc(String modelName, Long modelID);
    
    // Lấy bản ghi mới nhất cho mỗi mã nguồn
    @Query("SELECT csl FROM ChangeStatusLog csl WHERE csl.id IN (" +
           "SELECT MAX(csl2.id) FROM ChangeStatusLog csl2 GROUP BY csl2.modelName, csl2.modelID)")
    List<ChangeStatusLog> findLatestLogsForEachSource();
    
    // Lấy bản ghi mới nhất cho mỗi mã nguồn theo modelName
    @Query("SELECT csl FROM ChangeStatusLog csl WHERE csl.modelName = ?1 AND csl.id IN (" +
           "SELECT MAX(csl2.id) FROM ChangeStatusLog csl2 WHERE csl2.modelName = ?1 GROUP BY csl2.modelID)")
    List<ChangeStatusLog> findLatestLogsForEachSourceByModel(String modelName);
} 