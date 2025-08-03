package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.impl.S3Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DebtNoteController.class, excludeAutoConfiguration = {org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class DebtNoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DebtNoteService debtNoteService;

    @MockBean
    private S3Service s3Service;

    

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/debt/admin/customer/{customerId}/debt-notes - success")
    void testGetDebtNotes() throws Exception {
        DebtNoteResponseDto dto = new DebtNoteResponseDto(1L, 1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "", 2L, LocalDateTime.now(), 1L, null, null, null);
        Page<DebtNoteResponseDto> page = new PageImpl<>(List.of(dto));
        Mockito.when(debtNoteService.getDebtNotesPage(eq(1L), eq(0), eq(10))).thenReturn(page);

        mockMvc.perform(get("/api/debt/admin/customer/1/debt-notes")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1L));
    }

    @Test
    @DisplayName("GET /api/debt/admin/customer/{customerId}/debt-notes - service throws")
    void testGetDebtNotes_ServiceThrows() throws Exception {
        Mockito.when(debtNoteService.getDebtNotesPage(anyLong(), anyInt(), anyInt())).thenThrow(new RuntimeException("fail"));
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