package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.ChangeStatusLogFilterRequestDTO;
import com.farmovo.backend.dto.response.ChangeStatusLogResponseDTO;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.mapper.ChangeStatusLogMapper;
import com.farmovo.backend.models.ChangeStatusLog;
import com.farmovo.backend.repositories.ChangeStatusLogRepository;
import com.farmovo.backend.services.ChangeStatusLogService;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.specification.ChangeStatusLogSpecification;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChangeStatusLogServiceImpl implements ChangeStatusLogService {

    private static final Logger log = LogManager.getLogger(ChangeStatusLogServiceImpl.class);
    private final ChangeStatusLogRepository repository;
    private final ChangeStatusLogMapper changeStatusLogMapper;
    private final JwtUtils jwtUtils;
    private final HttpServletRequest request;

    @Override
    public void logStatusChange(String modelName, Long modelId, String previousStatus, String nextStatus, String description) {
        log.info("Logging status change for modelName={}, modelId={}, from={} to={}", modelName, modelId, previousStatus, nextStatus);

        ChangeStatusLog logEntity = new ChangeStatusLog();
        logEntity.setModelName(modelName);
        logEntity.setModelID(modelId);
        logEntity.setPreviousStatus(previousStatus);
        logEntity.setNextStatus(nextStatus);
        logEntity.setDescription(description);

        String token = jwtUtils.getJwtFromHeader(request);
        if (token == null) {
            token = jwtUtils.getJwtFromCookies(request);
        }

        Long userId = null;
        if (token != null && jwtUtils.validateJwtToken(token)) {
            userId = jwtUtils.getUserIdFromJwtToken(token);
        }

        logEntity.setCreatedBy(userId);
        log.info("User ID performing the change: {}", userId);

        repository.save(logEntity);
        log.info("ChangeStatusLog saved successfully for modelId={}", modelId);
    }

    @Override
    public Page<ChangeStatusLog> getAllLogs(ChangeStatusLogFilterRequestDTO filterRequest, Pageable pageable) {
        log.info("Fetching all ChangeStatusLogs with filters: {}", filterRequest);
        Specification<ChangeStatusLog> spec = ChangeStatusLogSpecification.build(filterRequest);
        Page<ChangeStatusLog> result = repository.findAll(spec, pageable);
        log.info("Found {} logs", result.getTotalElements());
        return result;
    }

    @Override
    public ChangeStatusLogResponseDTO getChangeStatusLogById(Long id) {
        log.info("Fetching ChangeStatusLog by ID: {}", id);
        ChangeStatusLog entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ChangeStatusLog not found with ID: {}", id);
                    return new ResourceNotFoundException("ChangeStatusLog not found with id: " + id);
                });
        log.info("Found ChangeStatusLog: {}", entity);
        return changeStatusLogMapper.toDto(entity);
    }
} 