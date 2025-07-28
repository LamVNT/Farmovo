package com.farmovo.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.services.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CategoryControllerTest {
    private MockMvc mockMvc;
    private CategoryService categoryService;
    private ObjectMapper objectMapper;
    private CategoryController categoryController;

    @BeforeEach
    void setup() {
        categoryService = Mockito.mock(CategoryService.class);
        objectMapper = new ObjectMapper();
        categoryController = new CategoryController(categoryService);
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController).build();
    }

    @Test
    void getAllCategories_shouldReturnList() throws Exception {
        CategoryResponseDto dto = new CategoryResponseDto(1L, "A", "desc", null, null);
        Mockito.when(categoryService.getAllActiveCategories()).thenReturn(List.of(dto));
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void createCategory_shouldReturnCreated() throws Exception {
        CategoryRequestDto req = new CategoryRequestDto("A", "desc");
        CategoryResponseDto dto = new CategoryResponseDto(1L, "A", "desc", null, null);
        Mockito.when(categoryService.createCategory(Mockito.any(CategoryRequestDto.class))).thenReturn(dto);
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void createCategory_withEmptyName_shouldReturnBadRequest() throws Exception {
        CategoryRequestDto req = new CategoryRequestDto("", "desc");
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCategory_withTooLongDescription_shouldReturnBadRequest() throws Exception {
        String longDesc = "a".repeat(256);
        CategoryRequestDto req = new CategoryRequestDto("A", longDesc);
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateCategory_shouldReturnUpdated() throws Exception {
        CategoryRequestDto req = new CategoryRequestDto("A", "desc");
        CategoryResponseDto dto = new CategoryResponseDto(1L, "A", "desc", null, null);
        Mockito.when(categoryService.updateCategory(Mockito.eq(1L), Mockito.any(CategoryRequestDto.class))).thenReturn(dto);
        mockMvc.perform(put("/api/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void updateCategory_notFound_shouldReturnNotFound() throws Exception {
        CategoryRequestDto req = new CategoryRequestDto("A", "desc");
        Mockito.when(categoryService.updateCategory(Mockito.eq(999L), Mockito.any(CategoryRequestDto.class)))
                .thenThrow(new com.farmovo.backend.exceptions.CategoryNotFoundException("Category not found"));
        mockMvc.perform(put("/api/categories/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteCategory_shouldReturnNoContent() throws Exception {
        Mockito.doNothing().when(categoryService).deleteCategory(1L);
        mockMvc.perform(delete("/api/categories/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCategory_notFound_shouldReturnNotFound() throws Exception {
        Mockito.doThrow(new com.farmovo.backend.exceptions.CategoryNotFoundException("Category not found"))
                .when(categoryService).deleteCategory(999L);
        mockMvc.perform(delete("/api/categories/999"))
                .andExpect(status().isNotFound());
    }
}