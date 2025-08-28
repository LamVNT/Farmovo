package com.farmovo.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.exceptions.GlobalExceptionHandler;
import com.farmovo.backend.services.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    private CategoryRequestDto validRequestDto;
    private CategoryResponseDto validResponseDto;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Setup test data
        validRequestDto = new CategoryRequestDto("Category A", "Desc A");
        validResponseDto = new CategoryResponseDto(1L, "Category A", "Desc A", LocalDateTime.now(), null);
    }

    @Test
    void getAllCategories_shouldReturnList() throws Exception {
        when(categoryService.getAllActiveCategories()).thenReturn(List.of(validResponseDto));
        
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void createCategory_shouldReturnCreated() throws Exception {
        when(categoryService.createCategory(any(CategoryRequestDto.class))).thenReturn(validResponseDto);
        
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void createCategory_withEmptyName_shouldReturnBadRequest() throws Exception {
        CategoryRequestDto invalidRequest = new CategoryRequestDto("", "desc");
        
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCategory_withTooLongDescription_shouldReturnBadRequest() throws Exception {
        String longDesc = "a".repeat(256);
        CategoryRequestDto invalidRequest = new CategoryRequestDto("A", longDesc);
        
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateCategory_shouldReturnUpdated() throws Exception {
        when(categoryService.updateCategory(eq(1L), any(CategoryRequestDto.class))).thenReturn(validResponseDto);
        
        mockMvc.perform(put("/api/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void updateCategory_notFound_shouldReturnNotFound() throws Exception {
        when(categoryService.updateCategory(eq(999L), any(CategoryRequestDto.class)))
                .thenThrow(new com.farmovo.backend.exceptions.CategoryNotFoundException("Category not found"));
        
        mockMvc.perform(put("/api/categories/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteCategory_shouldReturnNoContent() throws Exception {
        doNothing().when(categoryService).deleteCategory(1L, false);
        
        mockMvc.perform(delete("/api/categories/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCategory_notFound_shouldReturnNotFound() throws Exception {
        doThrow(new com.farmovo.backend.exceptions.CategoryNotFoundException("Category not found"))
                .when(categoryService).deleteCategory(999L, false);
        
        mockMvc.perform(delete("/api/categories/999"))
                .andExpect(status().isNotFound());
    }
}