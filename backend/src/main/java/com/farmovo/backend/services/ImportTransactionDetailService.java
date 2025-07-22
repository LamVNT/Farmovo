package com.farmovo.backend.services;

import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ZoneProductDetailDto;
import com.farmovo.backend.dto.response.MissingZoneDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.ImportDetailLotDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.mapper.ImportTransactionDetailLotMapper;

import java.util.List;

public interface ImportTransactionDetailService {

    List<ImportTransactionDetail> findByProductId(Long productId);

    // === CÁC METHOD MỚI CHO STOCKTAKE ===
    
    // Lấy danh sách Zone có sản phẩm tồn kho
    List<ZoneResponseDto> getZonesWithProducts();

    // Lấy danh sách sản phẩm theo Zone
    List<ProductResponseDto> getProductsByZone(String zoneId);

    // Lấy danh sách Zone của một sản phẩm
    List<ZoneResponseDto> getZonesByProduct(Long productId);

    // Lấy chi tiết sản phẩm theo Zone
    List<ZoneProductDetailDto> getDetailsByZone(String zoneId);

    // Kiểm tra thiếu Zone khi kiểm kê
    List<MissingZoneDto> checkMissingZones(List<StocktakeDetailDto> stocktakeDetails);

    List<ImportDetailLotDto> findForStocktakeLot(String store, String zone, String product, Boolean isCheck, String batchCode, String search);

    void updateIsCheck(Long id, boolean isCheck);

    void updateRemainQuantity(Long id, Integer remainQuantity);

    ImportDetailLotDto updateRemainQuantityAndReturnDto(Long id, Integer remainQuantity);

    void completeImportDetail(Long id);
}
