package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.services.StocktakeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocktakes")
public class StocktakeController {
    @Autowired
    private StocktakeService stocktakeService;

    //    @PreAuthorize("hasRole('STAFF')") // Chỉ Staff mới được tạo phiếu kiểm kê
    @PostMapping
    public ResponseEntity<StocktakeResponseDto> createStocktake(@RequestBody StocktakeRequestDto requestDto) {
        return ResponseEntity.ok(stocktakeService.createStocktake(requestDto));
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
    public ResponseEntity<StocktakeResponseDto> updateStocktakeStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(stocktakeService.updateStocktakeStatus(id, status));
    }
} 