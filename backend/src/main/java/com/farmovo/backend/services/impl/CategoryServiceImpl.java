package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.CategoryNotFoundException;
import com.farmovo.backend.mapper.CategoryMapper;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.repositories.CategoryRepository;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.services.CategoryService;
import com.farmovo.backend.validator.CategoryValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {
	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private CategoryMapper categoryMapper;

	@Autowired
	private CategoryValidator categoryValidator;

	@Autowired
	private ProductRepository productRepository;

	@Override
	public List<CategoryResponseDto> getAllActiveCategories() {
		return categoryRepository.findAll()
				.stream()
				.map(categoryMapper::toResponseDto)
				.collect(Collectors.toList());
	}

	@Override
	public CategoryResponseDto createCategory(CategoryRequestDto request) {
		categoryValidator.validate(request);
		// Kiểm tra trùng tên
		if (categoryRepository.findByCategoryName(request.getName()).isPresent()) {
			throw new com.farmovo.backend.exceptions.ValidationException("Tên danh mục đã tồn tại!");
		}
		Category category = categoryMapper.toEntity(request);
		category.setCreatedAt(LocalDateTime.now());
		return categoryMapper.toResponseDto(categoryRepository.save(category));
	}

	@Override
	public CategoryResponseDto updateCategory(Long id, CategoryRequestDto request) {
		categoryValidator.validate(request);
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
		// Nếu tên mới khác tên cũ, kiểm tra trùng tên
		if (!category.getCategoryName().equals(request.getName())) {
			if (categoryRepository.findByCategoryName(request.getName()).isPresent()) {
				throw new com.farmovo.backend.exceptions.ValidationException("Tên danh mục đã tồn tại!");
			}
		}
		category.setCategoryName(request.getName());
		category.setCategoryDescription(request.getDescription());
		category.setUpdatedAt(LocalDateTime.now());
		return categoryMapper.toResponseDto(categoryRepository.save(category));
	}

	@Override
	public void deleteCategory(Long id, boolean force) {
		Category category = categoryRepository.findById(id)
				.orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));

		// Đếm sản phẩm liên quan
		long relatedProducts = category.getProducts() == null ? 0 : category.getProducts().size();
		if (relatedProducts > 0 && !force) {
			throw new BadRequestException("Không thể xóa danh mục có sản phẩm.");
		}

		if (relatedProducts > 0 && force) {
			// Kiểm tra quyền cao hơn (ADMIN)
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			boolean hasAdmin = false;
			if (authentication != null && authentication.getAuthorities() != null) {
				for (GrantedAuthority ga : authentication.getAuthorities()) {
					String role = ga.getAuthority();
					if ("ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
						hasAdmin = true;
						break;
					}
				}
			}
			if (!hasAdmin) {
				throw new BadRequestException("Insufficient permission to force delete category with related products.");
			}
		}

		categoryRepository.delete(category);
	}
}