package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ProductRemainDto;
import com.farmovo.backend.dto.response.RevenueTrendDto;
import com.farmovo.backend.dto.response.StockByCategoryDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.TopProductDto;
import com.farmovo.backend.dto.response.TopCustomerDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.services.ReportService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
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
    @Autowired
    private SaleTransactionRepository saleTransactionRepository;

    @Override
    public List<ProductRemainDto> getRemainByProduct() {
        List<Object[]> result = importTransactionDetailRepository.getRemainByProduct();
        List<ProductRemainDto> dtos = new ArrayList<>();
        for (Object[] row : result) {
            dtos.add(new ProductRemainDto((Long) row[0], ((Number) row[1]).intValue()));
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
                List<StocktakeDetailDto> details = mapper.readValue(s.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {
                });
                for (StocktakeDetailDto d : details) {
                    if (d.getDiff() != null && d.getDiff() != 0) {
                        diffList.add(d);
                    }
                }
            } catch (Exception ignored) {
            }
        }
        return diffList;
    }

    @Override
    public List<ImportTransactionDetail> getExpiringLots(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(days);
        return importTransactionDetailRepository.findExpiringLots(now, soon);
    }

    @Override
    public List<RevenueTrendDto> getRevenueTrend(String type, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        List<RevenueTrendDto> result = new ArrayList<>();
        List<Object[]> raw;
        switch (type) {
            case "day":
                raw = saleTransactionRepository.getRevenueByDay(from, to);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    dto.setRevenue((java.math.BigDecimal) row[1]);
                    result.add(dto);
                }
                break;
            case "month":
                raw = saleTransactionRepository.getRevenueByMonth(from, to);
                for (Object[] row : raw) {
                    String label = row[0] + "-" + String.format("%02d", row[1]);
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(label);
                    dto.setRevenue((java.math.BigDecimal) row[2]);
                    result.add(dto);
                }
                break;
            case "year":
                raw = saleTransactionRepository.getRevenueByYear(from, to);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    dto.setRevenue((java.math.BigDecimal) row[1]);
                    result.add(dto);
                }
                break;
        }
        return result;
    }

    @Override
    public List<StockByCategoryDto> getStockByCategory() {
        List<Object[]> raw = importTransactionDetailRepository.getStockByCategory();
        List<StockByCategoryDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            StockByCategoryDto dto = new StockByCategoryDto();
            dto.setCategory((String) row[0]);
            dto.setStock(((Number) row[1]).intValue());
            result.add(dto);
        }
        return result;
    }

    @Override
    public List<TopProductDto> getTopProducts(java.time.LocalDateTime from, java.time.LocalDateTime to, int limit) {
        List<Object[]> raw = importTransactionDetailRepository.getTopProducts(from, to, PageRequest.of(0, limit));
        List<TopProductDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            TopProductDto dto = new TopProductDto();
            dto.setProductName((String) row[0]);
            dto.setCategory((String) row[1]);
            dto.setQuantity(row[2] != null ? ((Number) row[2]).longValue() : 0L);
            result.add(dto);
        }
        return result;
    }

    @Override
    public List<TopCustomerDto> getTopCustomers(java.time.LocalDateTime from, java.time.LocalDateTime to, int limit) {
        List<Object[]> raw = saleTransactionRepository.getTopCustomers(from, to, PageRequest.of(0, limit));
        List<TopCustomerDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            TopCustomerDto dto = new TopCustomerDto();
            dto.setCustomerName((String) row[0]);
            dto.setTotalAmount((java.math.BigDecimal) row[1]);
            dto.setOrderCount(row[2] != null ? ((Number) row[2]).longValue() : 0L);
            result.add(dto);
        }
        return result;
    }
} 