package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.mapper.CategoryMapper;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.repositories.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Captor
    private ArgumentCaptor<Category> categoryCaptor;

    private CategoryRequestDto validRequestDto;
    private CategoryResponseDto validResponseDto;
    private Category validCategory;
    private Category existingCategory;

    @BeforeEach
    void setup() {
        // Setup test data
        validRequestDto = new CategoryRequestDto("Category A", "Desc A");
        validResponseDto = new CategoryResponseDto(1L, "Category A", "Desc A", LocalDateTime.now(), null);
        
        validCategory = new Category();
        validCategory.setId(1L);
        validCategory.setCategoryName("Category A");
        validCategory.setCategoryDescription("Desc A");
        
        existingCategory = new Category();
        existingCategory.setId(1L);
        existingCategory.setCategoryName("Old");
        existingCategory.setCategoryDescription("Old Desc");
    }

    @Test
    void testCreateCategorySuccess() {
        when(categoryMapper.toEntity(validRequestDto)).thenReturn(validCategory);
        when(categoryRepository.save(any(Category.class))).thenReturn(validCategory);
        when(categoryMapper.toResponseDto(validCategory)).thenReturn(validResponseDto);

        CategoryResponseDto result = categoryService.createCategory(validRequestDto);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Category A");
        verify(categoryMapper).toEntity(validRequestDto);
        verify(categoryRepository).save(categoryCaptor.capture());
        assertThat(categoryCaptor.getValue().getCategoryName()).isEqualTo("Category A");
        verify(categoryMapper).toResponseDto(validCategory);
    }

    @Test
    void testCreateCategory_DuplicateName_ThrowsValidationException() {
        when(categoryRepository.findByCategoryName(validRequestDto.getName())).thenReturn(Optional.of(validCategory));
        
        assertThatThrownBy(() -> categoryService.createCategory(validRequestDto))
                .isInstanceOf(com.farmovo.backend.exceptions.ValidationException.class)
                .hasMessageContaining("Tên danh mục đã tồn tại");
    }

    @Test
    void testCreateCategory_EmptyName_ThrowsValidationException() {
        CategoryRequestDto invalid = new CategoryRequestDto("", "desc");
        
        assertThatThrownBy(() -> categoryService.createCategory(invalid))
                .isInstanceOf(com.farmovo.backend.exceptions.ValidationException.class)
                .hasMessageContaining("Category name cannot be empty");
    }

    @Test
    void testCreateCategory_TooLongDescription_ThrowsValidationException() {
        String longDesc = "a".repeat(256);
        CategoryRequestDto invalid = new CategoryRequestDto("A", longDesc);
        
        assertThatThrownBy(() -> categoryService.createCategory(invalid))
                .isInstanceOf(com.farmovo.backend.exceptions.ValidationException.class)
                .hasMessageContaining("Description too long");
    }

    @Test
    void testUpdateCategorySuccess() {
        Long id = 1L;
        when(categoryRepository.findById(id)).thenReturn(Optional.of(existingCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(validCategory);
        when(categoryMapper.toResponseDto(validCategory)).thenReturn(validResponseDto);

        CategoryResponseDto result = categoryService.updateCategory(id, validRequestDto);

        assertThat(result.getName()).isEqualTo("Category A");
        assertThat(result.getDescription()).isEqualTo("Desc A");
        verify(categoryRepository).findById(id);
        verify(categoryRepository).save(categoryCaptor.capture());
        assertThat(categoryCaptor.getValue().getCategoryName()).isEqualTo("Category A");
        verify(categoryMapper).toResponseDto(validCategory);
    }

    @Test
    void testUpdateCategory_NotFound_ThrowsCategoryNotFoundException() {
        when(categoryRepository.findById(2L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> categoryService.updateCategory(2L, validRequestDto))
                .isInstanceOf(com.farmovo.backend.exceptions.CategoryNotFoundException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void testUpdateCategory_DuplicateName_ThrowsValidationException() {
        Long id = 1L;
        when(categoryRepository.findById(id)).thenReturn(Optional.of(existingCategory));
        when(categoryRepository.findByCategoryName(validRequestDto.getName())).thenReturn(Optional.of(validCategory));
        
        assertThatThrownBy(() -> categoryService.updateCategory(id, validRequestDto))
                .isInstanceOf(com.farmovo.backend.exceptions.ValidationException.class)
                .hasMessageContaining("Tên danh mục đã tồn tại");
    }

    @Test
    void testDeleteCategorySuccess() {
        Long id = 1L;
        when(categoryRepository.findById(id)).thenReturn(Optional.of(existingCategory));

        categoryService.deleteCategory(id, false);

        verify(categoryRepository).delete(existingCategory);
    }

    @Test
    void testDeleteCategory_NotFound_ThrowsCategoryNotFoundException() {
        when(categoryRepository.findById(2L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> categoryService.deleteCategory(2L, false))
                .isInstanceOf(com.farmovo.backend.exceptions.CategoryNotFoundException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void testGetAllActiveCategories() {
        Category c1 = new Category();
        c1.setId(1L);
        c1.setCategoryName("A");
        Category c2 = new Category();
        c2.setId(2L);
        c2.setCategoryName("B");

        CategoryResponseDto dto1 = new CategoryResponseDto(1L, "A", "desc", LocalDateTime.now(), null);
        CategoryResponseDto dto2 = new CategoryResponseDto(2L, "B", "desc", LocalDateTime.now(), null);

        when(categoryRepository.findAll()).thenReturn(List.of(c1, c2));
        when(categoryMapper.toResponseDto(c1)).thenReturn(dto1);
        when(categoryMapper.toResponseDto(c2)).thenReturn(dto2);

        List<CategoryResponseDto> result = categoryService.getAllActiveCategories();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("A");
        assertThat(result.get(1).getName()).isEqualTo("B");
    }
}