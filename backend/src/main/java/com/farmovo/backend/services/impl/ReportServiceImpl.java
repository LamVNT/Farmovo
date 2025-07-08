package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ProductRemainDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.services.ReportService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {
    @Autowired
    private ImportTransactionDetailRepository importTransactionDetailRepository;
    @Autowired
    private StocktakeRepository stocktakeRepository;

    @Override
    public List<ProductRemainDto> getRemainByProduct() {
        List<Object[]> result = importTransactionDetailRepository.getRemainByProduct();
        List<ProductRemainDto> dtos = new ArrayList<>();
        for (Object[] row : result) {
            dtos.add(new ProductRemainDto((Long)row[0], ((Number)row[1]).intValue()));
        }
        return dtos;
    }

    @Override
    public List<StocktakeDetailDto> getStocktakeDiff() {
        List<Stocktake> stocktakes = stocktakeRepository.findAll();
        List<StocktakeDetailDto> diffList = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        for (Stocktake s : stocktakes) {
            try {
                List<StocktakeDetailDto> details = mapper.readValue(s.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {});
                for (StocktakeDetailDto d : details) {
                    if (d.getDiff() != null && d.getDiff() != 0) {
                        diffList.add(d);
                    }
                }
            } catch (Exception ignored) {}
        }
        return diffList;
    }

    @Override
    public List<ImportTransactionDetail> getExpiringLots(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(days);
        return importTransactionDetailRepository.findExpiringLots(now, soon);
    }
} 