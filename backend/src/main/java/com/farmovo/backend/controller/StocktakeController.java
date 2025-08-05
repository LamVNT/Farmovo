package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.MissingZoneDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.farmovo.backend.services.StocktakeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/stocktakes")
@RequiredArgsConstructor
public class StocktakeController {

    private final StocktakeService stocktakeService;
    private final ImportTransactionDetailService importTransactionDetailService;
    private final JwtUtils jwtUtils;

    @PostMapping
    public ResponseEntity<StocktakeResponseDto> createStocktake(
            @Valid @RequestBody StocktakeRequestDto requestDto,
            HttpServletRequest request) {
        Long userId = extractUserIdFromRequest(request);
        return ResponseEntity.ok(stocktakeService.createStocktake(requestDto, userId));
    }

    @GetMapping
    public ResponseEntity<List<StocktakeResponseDto>> getAllStocktakes(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            HttpServletRequest request) {
        Long userId = extractUserIdFromRequest(request);
        return ResponseEntity.ok(stocktakeService.getAllStocktakes(storeId, status, note, fromDate, toDate, userId));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<StocktakeResponseDto>> getStocktakesPaged(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        Long userId = extractUserIdFromRequest(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("stocktakeDate").descending());
        Page<StocktakeResponseDto> result = stocktakeService.searchStocktakes(storeId, status, note, fromDate, toDate, userId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StocktakeResponseDto> getStocktakeById(@PathVariable Long id) {
        return ResponseEntity.ok(stocktakeService.getStocktakeById(id));
    }

    @GetMapping("/{id}/export-excel")
    public ResponseEntity<ByteArrayResource> exportStocktakeToExcel(@PathVariable Long id) throws Exception {
        return stocktakeService.exportStocktakeToExcel(id);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<StocktakeResponseDto> updateStocktakeStatus(
            @PathVariable Long id,
            @RequestParam String status,
            HttpServletRequest request) {
        Long userId = extractUserIdFromRequest(request);
        return ResponseEntity.ok(stocktakeService.updateStocktakeStatus(id, status, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StocktakeResponseDto> updateStocktake(
            @PathVariable Long id,
            @Valid @RequestBody StocktakeRequestDto requestDto) {
        return ResponseEntity.ok(stocktakeService.updateStocktake(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStocktake(@PathVariable Long id) {
        stocktakeService.deleteStocktakeById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/zones-with-products")
    public ResponseEntity<List<ZoneResponseDto>> getZonesWithProducts() {
        return ResponseEntity.ok(importTransactionDetailService.getZonesWithProducts());
    }

    @GetMapping("/products-by-zone")
    public ResponseEntity<List<ProductResponseDto>> getProductsByZone(@RequestParam String zoneId) {
        return ResponseEntity.ok(importTransactionDetailService.getProductsByZone(zoneId));
    }

    @PostMapping("/check-missing-zones")
    public ResponseEntity<List<MissingZoneDto>> checkMissingZones(
            @RequestBody List<StocktakeDetailDto> stocktakeDetails) {
        return ResponseEntity.ok(importTransactionDetailService.checkMissingZones(stocktakeDetails));
    }

    private Long extractUserIdFromRequest(HttpServletRequest request) {
        String token = jwtUtils.getJwtFromRequest(request);
        if (token == null) {
            throw new IllegalArgumentException("JWT token is missing");
        }
        return jwtUtils.getUserIdFromJwtToken(token);
    }
}