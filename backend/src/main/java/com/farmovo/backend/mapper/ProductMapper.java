package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "productDescription", target = "detail")
    @Mapping(source = "productQuantity", target = "quantity")
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.categoryName", target = "categoryName")
    @Mapping(source = "store.id", target = "storeId")
    @Mapping(source = "store.storeName", target = "storeName")
    ProductDto toDto(Product product);

    List<ProductDto> toDtoList(List<Product> products);

    @Mapping(source = "product.productName", target = "name") // Lấy tên từ Product
    @Mapping(source = "product.id", target = "id")
    @Mapping(source = "product.category.categoryName", target = "categoryName")
    @Mapping(source = "product.store.storeName", target = "storeName")
    ProductResponseDto toDto(ImportTransactionDetail detail);
}

