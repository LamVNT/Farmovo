package com.farmovo.backend.services;

import com.farmovo.backend.dto.response.ProductRemainDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.models.ImportTransactionDetail;

import java.util.List;

public interface ReportService {
    List<ProductRemainDto> getRemainByProduct();

    List<StocktakeDetailDto> getStocktakeDiff();

    List<ImportTransactionDetail> getExpiringLots(int days);
} 