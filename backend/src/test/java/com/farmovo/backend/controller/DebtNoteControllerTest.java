package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.exceptions.GlobalExceptionHandler;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.impl.S3Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DebtNoteControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DebtNoteService debtNoteService;

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private DebtNoteController debtNoteController;

    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(debtNoteController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/debt/admin/customer/{customerId}/debt-notes - success")
    void testGetDebtNotes() throws Exception {
        DebtNoteResponseDto dto = new DebtNoteResponseDto(1L, 1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "", 2L, LocalDateTime.now(), 1L, null, null, null);
        Page<DebtNoteResponseDto> page = new PageImpl<>(List.of(dto));
        Mockito.when(debtNoteService.searchDebtNotes(eq(1L), any(), any(), any(), any(), any(), eq(0), eq(10)))
                .thenReturn(page);

        mockMvc.perform(get("/api/debt/admin/customer/1/debt-notes")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    @DisplayName("GET /api/debt/admin/customer/{customerId}/debt-notes - service throws")
    void testGetDebtNotes_ServiceThrows() throws Exception {
        Mockito.when(debtNoteService.searchDebtNotes(anyLong(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("fail"));
        mockMvc.perform(get("/api/debt/admin/customer/1/debt-notes"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred: fail"));
    }

    @Test
    @DisplayName("POST /api/debt/admin/debt-note - success")
    void testAddDebtNote() throws Exception {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "", 2L);
        DebtNoteResponseDto responseDto = new DebtNoteResponseDto(1L, 1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "", 2L, LocalDateTime.now(), 1L, null, null, null);

        Mockito.when(debtNoteService.addDebtNote(any(DebtNoteRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/debt/admin/debt-note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @DisplayName("POST /api/debt/admin/debt-note - invalid input")
    void testAddDebtNote_InvalidInput() throws Exception {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto();
        Mockito.when(debtNoteService.addDebtNote(any(DebtNoteRequestDto.class))).thenThrow(new IllegalArgumentException("Invalid"));
        mockMvc.perform(post("/api/debt/admin/debt-note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("PUT /api/debt/admin/debt-note/{debtId} - success")
    void testUpdateDebtNote() throws Exception {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "", 2L);
        DebtNoteResponseDto responseDto = new DebtNoteResponseDto(1L, 1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "", 2L, LocalDateTime.now(), 1L, null, null, null);

        Mockito.when(debtNoteService.updateDebtNote(eq(1L), any(DebtNoteRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/debt/admin/debt-note/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @DisplayName("PUT /api/debt/admin/debt-note/{debtId} - not found")
    void testUpdateDebtNote_NotFound() throws Exception {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto();
        Mockito.when(debtNoteService.updateDebtNote(eq(1L), any(DebtNoteRequestDto.class))).thenThrow(new IllegalArgumentException("Not found"));
        mockMvc.perform(put("/api/debt/admin/debt-note/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("GET /api/debt/admin/customer/{customerId}/total-debt - success")
    void testGetTotalDebt() throws Exception {
        Mockito.when(debtNoteService.getTotalDebtByCustomerId(1L)).thenReturn(new BigDecimal("123"));

        mockMvc.perform(get("/api/debt/admin/customer/1/total-debt"))
                .andExpect(status().isOk())
                .andExpect(content().string("123"));
    }

    @Test
    @DisplayName("GET /api/debt/admin/customer/{customerId}/total-debt - service throws")
    void testGetTotalDebt_ServiceThrows() throws Exception {
        Mockito.when(debtNoteService.getTotalDebtByCustomerId(1L)).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(get("/api/debt/admin/customer/1/total-debt"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred: fail"));
    }

    @Test
    @DisplayName("POST /api/debt/admin/upload-evidence - success")
    void testUploadEvidence() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "test".getBytes());
        Mockito.when(s3Service.uploadEvidence(any())).thenReturn("key123");

        mockMvc.perform(multipart("/api/debt/admin/upload-evidence").file(file))
                .andExpect(status().isOk())
                .andExpect(content().string("key123"));
    }

    @Test
    @DisplayName("POST /api/debt/admin/upload-evidence - fail")
    void testUploadEvidence_Fail() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "test".getBytes());
        Mockito.when(s3Service.uploadEvidence(any())).thenThrow(new IOException("fail"));
        mockMvc.perform(multipart("/api/debt/admin/upload-evidence").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/debt/admin/presigned-evidence - success")
    void testGetPresignedEvidence() throws Exception {
        Mockito.when(s3Service.generatePresignedUrl("key123")).thenReturn("http://presigned-url");

        mockMvc.perform(get("/api/debt/admin/presigned-evidence").param("key", "key123"))
                .andExpect(status().isOk())
                .andExpect(content().string("http://presigned-url"));
    }

    @Test
    @DisplayName("GET /api/debt/admin/presigned-evidence - fail")
    void testGetPresignedEvidence_Fail() throws Exception {
        Mockito.when(s3Service.generatePresignedUrl(anyString())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(get("/api/debt/admin/presigned-evidence").param("key", "key123"))
                .andExpect(status().isBadRequest());
    }
}