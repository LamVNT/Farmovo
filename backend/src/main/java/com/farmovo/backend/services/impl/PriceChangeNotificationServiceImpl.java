package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.CreateNotificationDto;
import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Notification;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.NotificationService;
import com.farmovo.backend.services.PriceChangeNotificationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceChangeNotificationServiceImpl implements PriceChangeNotificationService {

    private final ImportTransactionDetailRepository importTransactionDetailRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Override
    public void checkAndNotifyPriceChanges(CreateSaleTransactionRequestDto dto, Long userId) {
        log.info("Checking for price changes in new sale transaction: {}", dto.getName());
        
        List<String> priceChanges = new ArrayList<>();
        
        if (dto.getDetail() != null) {
            for (ProductSaleResponseDto productDetail : dto.getDetail()) {
                // Lấy giá gốc từ ImportTransactionDetail
                Optional<ImportTransactionDetail> originalDetail = importTransactionDetailRepository.findById(productDetail.getId());
                
                if (originalDetail.isPresent()) {
                    ImportTransactionDetail original = originalDetail.get();
                    BigDecimal originalPrice = original.getUnitSalePrice();
                    BigDecimal newPrice = productDetail.getUnitSalePrice();
                    
                    if (originalPrice != null && newPrice != null && 
                        originalPrice.compareTo(newPrice) != 0) {
                        
                        String change = String.format("Sản phẩm '%s' (lô %s): %s → %s VND", 
                            productDetail.getProductName(),
                            productDetail.getBatchCode(),
                            formatCurrency(originalPrice),
                            formatCurrency(newPrice));
                        
                        priceChanges.add(change);
                        log.info("Price change detected: {}", change);
                    }
                }
            }
        }
        
        if (!priceChanges.isEmpty()) {
            String priceChangesText = String.join("\n", priceChanges);
            notifyUserAboutPriceChanges(dto.getName(), dto.getStoreId(), priceChangesText, userId);
        }
    }

    @Override
    public void checkAndNotifyPriceChangesOnUpdate(SaleTransaction existingTransaction, CreateSaleTransactionRequestDto updatedDto, Long userId) {
        log.info("Checking for price changes in updated sale transaction: {}", existingTransaction.getName());
        
        List<String> priceChanges = new ArrayList<>();
        
        // Parse existing transaction details
        List<ProductSaleResponseDto> existingDetails = parseTransactionDetails(existingTransaction.getDetail());
        List<ProductSaleResponseDto> updatedDetails = updatedDto.getDetail();
        
        if (existingDetails != null && updatedDetails != null) {
            // Tạo map để so sánh theo product ID và batch ID
            for (ProductSaleResponseDto updatedDetail : updatedDetails) {
                ProductSaleResponseDto existingDetail = findMatchingDetail(existingDetails, updatedDetail);
                
                if (existingDetail != null) {
                    BigDecimal existingPrice = existingDetail.getUnitSalePrice();
                    BigDecimal updatedPrice = updatedDetail.getUnitSalePrice();
                    
                    if (existingPrice != null && updatedPrice != null && 
                        existingPrice.compareTo(updatedPrice) != 0) {
                        
                        String change = String.format("Sản phẩm '%s' (lô %s): %s → %s VND", 
                            updatedDetail.getProductName(),
                            updatedDetail.getBatchCode(),
                            formatCurrency(existingPrice),
                            formatCurrency(updatedPrice));
                        
                        priceChanges.add(change);
                        log.info("Price change detected on update: {}", change);
                    }
                }
            }
        }
        
        if (!priceChanges.isEmpty()) {
            String priceChangesText = String.join("\n", priceChanges);
            notifyUserAboutPriceChanges(existingTransaction.getName(), existingTransaction.getStore().getId(), priceChangesText, userId);
        }
    }

    @Override
    public void notifyUserAboutPriceChanges(String transactionName, Long storeId, String priceChanges, Long userId) {
        log.info("Notifying user {} about price changes in transaction: {}", userId, transactionName);
        
        try {
            // Tạo thông báo chỉ cho user cụ thể
            CreateNotificationDto notificationDto = new CreateNotificationDto();
            notificationDto.setTitle("Thay đổi giá bán - Phiếu bán hàng " + transactionName);
            notificationDto.setMessage("Phiếu bán hàng " + transactionName + " có sự thay đổi về giá:\n\n" + priceChanges);
            notificationDto.setType(Notification.NotificationType.WARNING);
            notificationDto.setCategory(Notification.NotificationCategory.SALE_TRANSACTION);
            notificationDto.setActionUrl("/sale-transactions");
            notificationDto.setEntityType("SALE_TRANSACTION");
            notificationDto.setStoreId(storeId);
            
            // Gửi thông báo chỉ cho user cụ thể thay vì tất cả admin users
            notificationService.createNotification(notificationDto, userId);
            
            log.info("Price change notification sent successfully to user {} for transaction: {}", userId, transactionName);
            
        } catch (Exception e) {
            log.error("Failed to send price change notification: {}", e.getMessage(), e);
        }
    }
    
    private ProductSaleResponseDto findMatchingDetail(List<ProductSaleResponseDto> details, ProductSaleResponseDto target) {
        return details.stream()
            .filter(detail -> detail.getId().equals(target.getId()) && 
                             detail.getProId().equals(target.getProId()))
            .findFirst()
            .orElse(null);
    }
    
    private List<ProductSaleResponseDto> parseTransactionDetails(String detailJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            return mapper.readValue(detailJson, new TypeReference<List<ProductSaleResponseDto>>() {});
        } catch (Exception e) {
            log.error("Failed to parse transaction details: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        return amount.toString() + " VND";
    }
}
