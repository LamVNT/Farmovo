package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.ImportBalanceDataDto;

import java.util.List;

public interface BalanceStockService {
    /**
     * Tạo SaleTransactionRequestDto từ StockTake (danh sách diff, storeId, note, ...)
     */
    CreateSaleTransactionRequestDto buildSaleTransactionFromStocktake(Long stocktakeId, List<ProductSaleResponseDto> diffDetails, Long storeId);

    /**
     * Khi Owner duyệt đơn cân bằng kho, cập nhật lại zone cho ImportTransactionDetail nếu cần
     */
    void updateZoneAndStockOnApprove(Long saleTransactionId);

    /**
     * Chuyển đổi StocktakeDetailDto thành ProductSaleResponseDto với đầy đủ thông tin giá
     */
    List<ProductSaleResponseDto> convertStocktakeDetailToProductSale(List<StocktakeDetailDto> stocktakeDetails);

    /**
     * Tạo CreateImportTransactionRequestDto từ StockTake (danh sách diff dương, storeId, note, ...)
     */
    CreateImportTransactionRequestDto buildImportTransactionFromStocktake(Long stocktakeId, List<CreateImportTransactionRequestDto.DetailDto> importDetails, Long storeId);

    /**
     * Chuyển đổi StocktakeDetailDto thành CreateImportTransactionRequestDto.DetailDto cho phiếu nhập
     */
    List<CreateImportTransactionRequestDto.DetailDto> convertStocktakeDetailToImportDetail(List<StocktakeDetailDto> stocktakeDetails);

    /**
     * Chuyển đổi StocktakeDetailDto thành ImportBalanceDataDto để hiển thị trên frontend
     */
    List<ImportBalanceDataDto> convertStocktakeDetailToImportBalanceData(List<StocktakeDetailDto> stocktakeDetails);
}