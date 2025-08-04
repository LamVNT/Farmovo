package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.ChangeStatusLogFilterRequestDTO;
import com.farmovo.backend.dto.request.PageResponse;
import com.farmovo.backend.dto.response.ChangeStatusLogResponseDTO;
import com.farmovo.backend.dto.response.SourceEntityInfo;
import com.farmovo.backend.mapper.ChangeStatusLogMapper;
import com.farmovo.backend.models.ChangeStatusLog;
import com.farmovo.backend.services.ChangeStatusLogService;
import com.farmovo.backend.services.SourceEntityResolverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChangeStatusLogControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ChangeStatusLogMapper mapper;
    @Mock
    private ChangeStatusLogService changeStatusLogService;
    @Mock
    private SourceEntityResolverService sourceEntityResolverService;

    @InjectMocks
    private ChangeStatusLogController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testSearchLogs() throws Exception {
        ChangeStatusLogFilterRequestDTO filter = new ChangeStatusLogFilterRequestDTO();
        Page<ChangeStatusLog> page = new PageImpl<>(Collections.emptyList());
        when(changeStatusLogService.getAllLogs(any(), any(Pageable.class))).thenReturn(page);
        when(mapper.toDto(any(ChangeStatusLog.class))).thenReturn(new ChangeStatusLogResponseDTO());

        mockMvc.perform(post("/api/change-statuslog/list-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetById() throws Exception {
        ChangeStatusLogResponseDTO dto = new ChangeStatusLogResponseDTO();
        when(changeStatusLogService.getChangeStatusLogById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/change-statuslog/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetSourceEntity() throws Exception {
        ChangeStatusLogResponseDTO logDto = new ChangeStatusLogResponseDTO();
        logDto.setModelName("Order");
        logDto.setModelID(1L);
        when(changeStatusLogService.getChangeStatusLogById(1L)).thenReturn(logDto);

        SourceEntityInfo info = new SourceEntityInfo();
        when(sourceEntityResolverService.resolveSourceEntity("Order", 1L)).thenReturn(info);

        mockMvc.perform(get("/api/change-statuslog/1/source"))
                .andExpect(status().isOk());
    }
}