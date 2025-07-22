package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface StocktakeService {
    StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto, Long userId);

    List<StocktakeResponseDto> getAllStocktakes(String storeId, String status, String note, String fromDate, String toDate);

    StocktakeResponseDto getStocktakeById(Long id);

    StocktakeResponseDto updateStocktakeStatus(Long id, String status, Long userId);

    StocktakeResponseDto updateStocktake(Long id, StocktakeRequestDto requestDto);

    ResponseEntity<ByteArrayResource> exportStocktakeToExcel(Long id) throws Exception;
}