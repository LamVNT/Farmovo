package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.ChangeStatusLogFilterRequestDTO;
import com.farmovo.backend.dto.request.ChangeStatusLogByModelRequestDTO;
import com.farmovo.backend.dto.request.PageResponse;
import com.farmovo.backend.dto.response.ChangeStatusLogResponseDTO;
import com.farmovo.backend.dto.response.SourceEntityInfo;
import com.farmovo.backend.mapper.ChangeStatusLogMapper;
import com.farmovo.backend.models.ChangeStatusLog;
import com.farmovo.backend.services.ChangeStatusLogService;
import com.farmovo.backend.services.SourceEntityResolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/change-statuslog")
public class ChangeStatusLogController {

    private final ChangeStatusLogMapper mapper;
    private final ChangeStatusLogService changeStatusLogService;
    private final SourceEntityResolverService sourceEntityResolverService;

    @PostMapping("/list-all")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<PageResponse<ChangeStatusLogResponseDTO>> searchLogs(
            @RequestBody ChangeStatusLogFilterRequestDTO filterRequest,
            Pageable pageable) {
        Page<ChangeStatusLog> entityPage = changeStatusLogService.getAllLogs(filterRequest, pageable);
        Page<ChangeStatusLogResponseDTO> dtoPage = entityPage.map(mapper::toDto);
        return ResponseEntity.ok(PageResponse.fromPage(dtoPage));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<ChangeStatusLogResponseDTO> getById(@PathVariable Long id) {
        ChangeStatusLogResponseDTO dto = changeStatusLogService.getChangeStatusLogById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/source")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<SourceEntityInfo> getSourceEntity(@PathVariable Long id) {
        ChangeStatusLogResponseDTO log = changeStatusLogService.getChangeStatusLogById(id);
        SourceEntityInfo sourceInfo = sourceEntityResolverService.resolveSourceEntity(
                log.getModelName(), log.getModelID());
        return ResponseEntity.ok(sourceInfo);
    }

    @PostMapping("/by-model")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<List<ChangeStatusLogResponseDTO>> getByModel(
            @RequestBody ChangeStatusLogByModelRequestDTO request) {
        List<ChangeStatusLogResponseDTO> logs = changeStatusLogService.getLogsByModel(request.getModelName(), request.getModelId());
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/latest-each-source")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<List<ChangeStatusLogResponseDTO>> getLatestLogsForEachSource() {
        List<ChangeStatusLogResponseDTO> logs = changeStatusLogService.getLatestLogsForEachSource();
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/latest-each-source/{modelName}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<List<ChangeStatusLogResponseDTO>> getLatestLogsForEachSourceByModel(
            @PathVariable String modelName) {
        List<ChangeStatusLogResponseDTO> logs = changeStatusLogService.getLatestLogsForEachSourceByModel(modelName);
        return ResponseEntity.ok(logs);
    }
}

