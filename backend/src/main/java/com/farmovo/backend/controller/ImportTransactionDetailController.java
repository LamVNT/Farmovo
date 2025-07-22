package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.MissingZoneDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.ImportDetailLotDto;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.farmovo.backend.services.ZoneService;
import com.farmovo.backend.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/import-details")
public class ImportTransactionDetailController {

    @Autowired
    private ImportTransactionDetailService importTransactionDetailService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private ProductService productService;

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

    // API lấy danh sách Zone của một sản phẩm
    @GetMapping("/zones-by-product")
    public ResponseEntity<List<ZoneResponseDto>> getZonesByProduct(@RequestParam Long productId) {
        List<ZoneResponseDto> zones = importTransactionDetailService.getZonesByProduct(productId);
        return ResponseEntity.ok(zones);
    }

    // API lấy chi tiết sản phẩm theo Zone (bao gồm thông tin lô, hạn sử dụng)
    @GetMapping("/details-by-zone")
    public ResponseEntity<?> getDetailsByZone(@RequestParam String zoneId) {
        return ResponseEntity.ok(importTransactionDetailService.getDetailsByZone(zoneId));
    }

    // API kiểm tra thiếu Zone khi kiểm kê
    @PostMapping("/check-missing-zones")
    public ResponseEntity<List<MissingZoneDto>> checkMissingZones(@RequestBody List<StocktakeDetailDto> stocktakeDetails) {
        List<MissingZoneDto> missingZones = importTransactionDetailService.checkMissingZones(stocktakeDetails);
        return ResponseEntity.ok(missingZones);
    }

    @GetMapping("/stocktake-lot")
    public ResponseEntity<List<ImportDetailLotDto>> getImportDetailsForStocktakeLot(
        @RequestParam(required = false) String store,
        @RequestParam(required = false) String zone,
        @RequestParam(required = false) String product,
        @RequestParam(required = false) Boolean isCheck,
        @RequestParam(required = false) String batchCode,
        @RequestParam(required = false) String search
    ) {
        List<ImportDetailLotDto> result = importTransactionDetailService.findForStocktakeLot(store, zone, product, isCheck, batchCode, search);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/is-check")
    public ResponseEntity<Void> updateIsCheck(@PathVariable Long id, @RequestParam boolean isCheck) {
        importTransactionDetailService.updateIsCheck(id, isCheck);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/remain")
    public ResponseEntity<ImportDetailLotDto> updateRemainQuantity(@PathVariable Long id, @RequestBody(required = true) java.util.Map<String, Integer> body) {
        Integer remainQuantity = body.get("remainQuantity");
        ImportDetailLotDto updated = importTransactionDetailService.updateRemainQuantityAndReturnDto(id, remainQuantity);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Void> completeImportDetail(@PathVariable Long id) {
        importTransactionDetailService.completeImportDetail(id);
        return ResponseEntity.ok().build();
    }
}