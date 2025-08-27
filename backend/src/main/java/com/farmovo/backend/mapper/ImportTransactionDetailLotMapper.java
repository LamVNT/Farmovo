package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.response.ImportDetailLotDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import java.util.List;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmovo.backend.models.Zone;
import org.springframework.beans.factory.annotation.Autowired;
import org.mapstruct.Context;

@Mapper(componentModel = "spring")
public interface ImportTransactionDetailLotMapper {
    @Mapping(source = "product.productName", target = "productName")
    @Mapping(source = "importTransaction.store.storeName", target = "storeName")
    @Mapping(source = "name", target = "name") // mã lô
    @Mapping(source = "expireDate", target = "expireDate") // hạn dùng
    @Mapping(source = "remainQuantity", target = "remainQuantity")
    @Mapping(source = "isCheck", target = "isCheck")
    @Mapping(source = "unitSalePrice", target = "unitSalePrice") // giá bán
    @Mapping(target = "zonesId", source = "zones_id", qualifiedByName = "parseZonesId")
    @Mapping(target = "zoneName", expression = "java(com.farmovo.backend.mapper.ImportTransactionDetailLotMapper.buildZoneName(detail.getZones_id(), allZones))")
    ImportDetailLotDto toDto(ImportTransactionDetail detail, @Context List<Zone> allZones);

    // Nếu không truyền allZones, chỉ map zonesId
    @Mapping(source = "product.productName", target = "productName")
    @Mapping(source = "importTransaction.store.storeName", target = "storeName")
    @Mapping(source = "name", target = "name")
    @Mapping(source = "expireDate", target = "expireDate")
    @Mapping(source = "remainQuantity", target = "remainQuantity")
    @Mapping(source = "isCheck", target = "isCheck")
    @Mapping(source = "unitSalePrice", target = "unitSalePrice") // giá bán
    @Mapping(target = "zonesId", source = "zones_id", qualifiedByName = "parseZonesId")
    ImportDetailLotDto toDto(ImportTransactionDetail detail);

    @Named("parseZonesId")
    static List<Long> parseZonesId(String zonesIdStr) {
        if (zonesIdStr == null || zonesIdStr.isEmpty()) return null;
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            return objectMapper.readValue(zonesIdStr, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            try {
                return List.of(Long.valueOf(zonesIdStr));
            } catch (Exception ignore) {
                return null;
            }
        }
    }

    @Named("buildZoneName")
    static String buildZoneName(String zonesIdStr, List<Zone> allZones) {
        List<Long> ids = parseZonesId(zonesIdStr);
        if (ids == null || allZones == null) return null;
        return allZones.stream()
                .filter(z -> ids.contains(z.getId()))
                .map(Zone::getZoneName)
                .collect(Collectors.joining(", "));
    }
}