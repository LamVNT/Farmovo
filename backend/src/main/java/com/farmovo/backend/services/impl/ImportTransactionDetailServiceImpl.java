package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ImportDetailStocktakeDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ImportTransactionDetailServiceImpl implements ImportTransactionDetailService {

    @Autowired
    private ImportTransactionDetailRepository detailRepository;

    @Override
    public List<ImportTransactionDetail> findByProductId(Long productId) {
        return detailRepository.findByProductId(productId);
    }

    @Override
    public List<ImportDetailStocktakeDto> findAllForStocktakeDate(java.time.LocalDate stocktakeDate) {
        List<Object[]> rawList = detailRepository.findAllForStocktakeDateRaw(stocktakeDate);
        List<ImportDetailStocktakeDto> result = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();
        for (Object[] row : rawList) {
            Long id = (Long) row[0];
            String productName = (String) row[1];
            Integer remainQuantity = (Integer) row[2];
            String zonesIdStr = (String) row[3];
            Boolean isCheck = (Boolean) row[4];
            java.time.LocalDateTime expireDate = (java.time.LocalDateTime) row[5];
            List<Long> zones_id = new ArrayList<>();
            if (zonesIdStr != null && !zonesIdStr.isEmpty()) {
                try {
                    zones_id = objectMapper.readValue(zonesIdStr, new TypeReference<List<Long>>() {
                    });
                } catch (Exception e) {
                    // fallback: nếu không phải JSON array thì trả về 1 phần tử
                    try {
                        zones_id.add(Long.valueOf(zonesIdStr));
                    } catch (Exception ignore) {
                    }
                }
            }
            result.add(new ImportDetailStocktakeDto(id, productName, remainQuantity, zones_id, isCheck, expireDate));
        }
        return result;
    }
}
