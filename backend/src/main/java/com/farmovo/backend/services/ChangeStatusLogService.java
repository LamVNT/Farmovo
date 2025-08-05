package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.ChangeStatusLogFilterRequestDTO;
import com.farmovo.backend.dto.response.ChangeStatusLogResponseDTO;
import com.farmovo.backend.models.ChangeStatusLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChangeStatusLogService {
    void logStatusChange(String modelName, Long modelId, String previousStatus,
                         String nextStatus, String description);
    Page<ChangeStatusLog> getAllLogs(ChangeStatusLogFilterRequestDTO filterRequest, Pageable pageable);

    ChangeStatusLogResponseDTO getChangeStatusLogById(Long id);
} 