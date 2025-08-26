package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
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
}