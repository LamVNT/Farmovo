package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.StocktakeService;
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
} 