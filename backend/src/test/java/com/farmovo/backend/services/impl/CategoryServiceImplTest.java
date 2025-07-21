package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.mapper.CategoryMapper;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.repositories.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private CategoryRequestDto requestDto;
    private Category category;
    private Category savedCategory;
    private CategoryResponseDto responseDto;

    @BeforeEach
    void setup() {
        requestDto = new CategoryRequestDto("Category A", "Desc A");

        category = new Category();
        category.setId(1L);
        category.setCategoryName("Category A");
        category.setCategoryDescription("Desc A");

        savedCategory = new Category();
        savedCategory.setId(1L);
        savedCategory.setCategoryName("Category A");
        savedCategory.setCategoryDescription("Desc A");
        savedCategory.setCreatedAt(LocalDateTime.of(2024, 1, 1, 10, 0));

        responseDto = new CategoryResponseDto(
                1L,
                "Category A",
                "Desc A",
                LocalDateTime.of(2024, 1, 1, 10, 0),
                null
        );
    }

    @Test
    void testCreateCategorySuccess() {
        Mockito.when(categoryMapper.toEntity(requestDto)).thenReturn(category);
        Mockito.when(categoryRepository.save(Mockito.any(Category.class))).thenReturn(savedCategory);
        Mockito.when(categoryMapper.toResponseDto(savedCategory)).thenReturn(responseDto);

        CategoryResponseDto result = categoryService.createCategory(requestDto);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Category A");

        Mockito.verify(categoryMapper).toEntity(requestDto);
        Mockito.verify(categoryRepository).save(Mockito.any(Category.class));
        Mockito.verify(categoryMapper).toResponseDto(savedCategory);
    }

    @Test
    void testUpdateCategorySuccess() {
        Long id = 1L;
        Category existing = new Category();
        existing.setId(id);
        existing.setCategoryName("Old");
        existing.setCategoryDescription("Old Desc");

        Mockito.when(categoryRepository.findById(id)).thenReturn(Optional.of(existing));
        Mockito.when(categoryRepository.save(Mockito.any(Category.class))).thenReturn(savedCategory);
        Mockito.when(categoryMapper.toResponseDto(savedCategory)).thenReturn(responseDto);

        CategoryResponseDto result = categoryService.updateCategory(id, requestDto);

        assertThat(result.getName()).isEqualTo("Category A");
        assertThat(result.getDescription()).isEqualTo("Desc A");

        Mockito.verify(categoryRepository).findById(id);
        Mockito.verify(categoryRepository).save(Mockito.any(Category.class));
        Mockito.verify(categoryMapper).toResponseDto(savedCategory);
    }



    @Test
    void testDeleteCategorySuccess() {
        Long id = 1L;
        Category existing = new Category();
        existing.setId(id);

        Mockito.when(categoryRepository.findById(id)).thenReturn(Optional.of(existing));

        categoryService.deleteCategory(id);

        Mockito.verify(categoryRepository).delete(existing);
    }

    @Test
    void testGetAllActiveCategories() {
        Category c1 = new Category(); c1.setId(1L); c1.setCategoryName("A");
        Category c2 = new Category(); c2.setId(2L); c2.setCategoryName("B");

        CategoryResponseDto dto1 = new CategoryResponseDto(1L, "A", "desc", LocalDateTime.now(), null);
        CategoryResponseDto dto2 = new CategoryResponseDto(2L, "B", "desc", LocalDateTime.now(), null);

        Mockito.when(categoryRepository.findAll()).thenReturn(List.of(c1, c2));
        Mockito.when(categoryMapper.toResponseDto(c1)).thenReturn(dto1);
        Mockito.when(categoryMapper.toResponseDto(c2)).thenReturn(dto2);

        List<CategoryResponseDto> result = categoryService.getAllActiveCategories();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("A");
        assertThat(result.get(1).getName()).isEqualTo("B");
    }
}


















