package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.MissingZoneDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.StocktakeService;
import com.farmovo.backend.services.ImportTransactionDetailService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocktakes")
public class StocktakeController {
    @Autowired
    private StocktakeService stocktakeService;

    @Autowired
    private ImportTransactionDetailService importTransactionDetailService;

    @Autowired
    private JwtUtils jwtUtils;

    //    @PreAuthorize("hasRole('STAFF')") // Chỉ Staff mới được tạo phiếu kiểm kê
    @PostMapping
    public ResponseEntity<StocktakeResponseDto> createStocktake(@RequestBody StocktakeRequestDto requestDto, HttpServletRequest request) {
        String token = jwtUtils.getJwtFromRequest(request);
        if (token == null) {
            throw new RuntimeException("JWT token is missing!");
        }
        Long userId = jwtUtils.getUserIdFromJwtToken(token);
        return ResponseEntity.ok(stocktakeService.createStocktake(requestDto, userId));
    }

    @GetMapping
    public ResponseEntity<List<StocktakeResponseDto>> getAllStocktakes() {
        return ResponseEntity.ok(stocktakeService.getAllStocktakes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StocktakeResponseDto> getStocktakeById(@PathVariable Long id) {
        return ResponseEntity.ok(stocktakeService.getStocktakeById(id));
    }

    //    @PreAuthorize("hasRole('OWNER')") // Chỉ Owner mới được phê duyệt/hủy phiếu
    @PutMapping("/{id}/status")
    public ResponseEntity<StocktakeResponseDto> updateStocktakeStatus(@PathVariable Long id, @RequestParam String status, HttpServletRequest request) {
        String token = jwtUtils.getJwtFromRequest(request);
        if (token == null) throw new RuntimeException("JWT token is missing!");
        Long userId = jwtUtils.getUserIdFromJwtToken(token);
        return ResponseEntity.ok(stocktakeService.updateStocktakeStatus(id, status, userId));
    }

    // Cập nhật phiếu kiểm kê (toàn bộ)
    @PutMapping("/{id}")
    public ResponseEntity<StocktakeResponseDto> updateStocktake(@PathVariable Long id, @RequestBody StocktakeRequestDto requestDto) {
        return ResponseEntity.ok(stocktakeService.updateStocktake(id, requestDto));
    }

    // === CÁC API HỖ TRỢ CHO STOCKTAKE ===

    // API lấy danh sách Zone có sản phẩm tồn kho
    @GetMapping("/zones-with-products")
    public ResponseEntity<List<ZoneResponseDto>> getZonesWithProducts() {
        List<ZoneResponseDto> zones = importTransactionDetailService.getZonesWithProducts();
        return ResponseEntity.ok(zones);
    }

    // API lấy danh sách sản phẩm theo Zone
    @GetMapping("/products-by-zone")
    public ResponseEntity<List<ProductResponseDto>> getProductsByZone(@RequestParam String zoneId) {
        List<ProductResponseDto> products = importTransactionDetailService.getProductsByZone(zoneId);
        return ResponseEntity.ok(products);
    }

    // API kiểm tra thiếu Zone khi kiểm kê
    @PostMapping("/check-missing-zones")
    public ResponseEntity<List<MissingZoneDto>> checkMissingZones(@RequestBody List<StocktakeDetailDto> stocktakeDetails) {
        List<MissingZoneDto> missingZones = importTransactionDetailService.checkMissingZones(stocktakeDetails);
        return ResponseEntity.ok(missingZones);
    }
} 