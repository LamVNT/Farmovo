package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "productName", target = "productName")
    @Mapping(source = "productDescription", target = "productDescription")
    @Mapping(source = "productQuantity", target = "productQuantity")
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.categoryName", target = "categoryName")
    @Mapping(source = "store.id", target = "storeId")
    @Mapping(source = "store.storeName", target = "storeName")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    @Mapping(source = "productCode", target = "productCode")
    ProductDto toDto(Product product);

    List<ProductDto> toDtoList(List<Product> products);

    @Mapping(source = "productName", target = "productName")
    @Mapping(source = "id", target = "productCode")
    @Mapping(source = "id", target = "proId")
    @Mapping(source = "category.categoryName", target = "categoryName")
    @Mapping(source = "store.storeName", target = "storeName")
    @Mapping(source = "productQuantity", target = "remainQuantity")
    @Mapping(target = "unitSalePrice", constant = "0")
    @Mapping(target = "quantity", constant = "0")
    @Mapping(target = "id", constant = "0L")
    ProductSaleResponseDto toDtoProSale(Product product);

    List<ProductSaleResponseDto> toDtoProSaleList(List<Product> products);


    @Mapping(source = "product.productName", target = "name") // Lấy tên từ Product
    @Mapping(source = "product.id", target = "proId")
    @Mapping(source = "product.category.categoryName", target = "categoryName")
    @Mapping(source = "product.store.storeName", target = "storeName")
    ProductResponseDto toDto(ImportTransactionDetail detail);


    @Mapping(source = "id", target = "id")
    @Mapping(source = "product.productName", target = "productName") // Lấy tên từ Product
    @Mapping(source = "product.productCode", target = "productCode") // Lấy mã tự sinh thực sự
    @Mapping(source = "product.id", target = "proId")
    @Mapping(source = "product.category.categoryName", target = "categoryName")
    @Mapping(source = "product.store.storeName", target = "storeName")
    @Mapping(source = "remainQuantity", target = "remainQuantity")
    @Mapping(source = "unitSalePrice", target = "unitSalePrice")
    @Mapping(source = "createdAt", target = "createAt")
    @Mapping(source = "expireDate", target = "expireDate") // Thêm dòng này
    @Mapping(source = "name", target = "name") // mapping mã lô hàng LH000000
    ProductSaleResponseDto toDtoSale(ImportTransactionDetail detail);


}

