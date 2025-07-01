package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.models.Product;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    ProductDto toDto(Product product);

    List<ProductDto> toDtoList(List<Product> products);
}

