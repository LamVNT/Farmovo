package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;

import java.util.List;

public interface StocktakeService {
    StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto, Long userId);

    List<StocktakeResponseDto> getAllStocktakes();

    StocktakeResponseDto getStocktakeById(Long id);

    StocktakeResponseDto updateStocktakeStatus(Long id, String status, Long userId);

    StocktakeResponseDto updateStocktake(Long id, StocktakeRequestDto requestDto);
} 