package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.models.StocktakeDetail;

import java.util.List;

public class StocktakeValidator {
    public static void validateRequest(StocktakeRequestDto requestDto, List<StocktakeDetail> details) {
        if (requestDto.getStocktakeDate() == null) {
            throw new ValidationException("stocktakeDate is required");
        }
        if (requestDto.getStoreId() == null) {
            throw new ValidationException("storeId is required");
        }
        if (requestDto.getDetail() == null || requestDto.getDetail().isEmpty()) {
            throw new ValidationException("detail is required");
        }
        if (requestDto.getStatus() == null) {
            throw new ValidationException("status is required");
        }
        if (details == null || details.isEmpty()) {
            throw new ValidationException("detail must contain at least one item");
        }
        for (StocktakeDetail d : details) {
            if (d.getProductId() == null) {
                throw new ValidationException("Each detail item must have productId");
            }
            if (d.getZones_id() == null || d.getZones_id().isEmpty()) {
                throw new ValidationException("Each detail item must have zones_id (list)");
            }
            if (d.getReal() == null) {
                throw new ValidationException("Each detail item must have real quantity");
            }
        }
    }
} 