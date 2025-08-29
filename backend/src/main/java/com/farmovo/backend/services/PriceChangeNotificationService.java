package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.models.SaleTransaction;

public interface PriceChangeNotificationService {
    
    /**
     * Kiểm tra và thông báo sự thay đổi giá khi tạo phiếu bán hàng mới
     * @param dto DTO chứa thông tin phiếu bán hàng
     * @param userId ID của user tạo phiếu
     */
    void checkAndNotifyPriceChanges(CreateSaleTransactionRequestDto dto, Long userId);
    
    /**
     * Kiểm tra và thông báo sự thay đổi giá khi cập nhật phiếu bán hàng
     * @param existingTransaction Phiếu bán hàng hiện tại
     * @param updatedDto DTO chứa thông tin cập nhật
     * @param userId ID của user cập nhật
     */
    void checkAndNotifyPriceChangesOnUpdate(SaleTransaction existingTransaction, CreateSaleTransactionRequestDto updatedDto, Long userId);
    
    /**
     * Tạo thông báo cho user cụ thể về sự thay đổi giá
     * @param transactionName Tên phiếu bán hàng
     * @param storeId ID của cửa hàng
     * @param priceChanges Danh sách các thay đổi giá
     * @param userId ID của user thực hiện thay đổi
     */
    void notifyUserAboutPriceChanges(String transactionName, Long storeId, String priceChanges, Long userId);
}
