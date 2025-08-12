package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.services.BalanceStockService;
import org.springframework.stereotype.Service;
import java.util.List;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.models.SaleTransactionStatus;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.stream.Collectors;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BalanceStockServiceImpl implements BalanceStockService {
    @Autowired
    private StocktakeRepository stocktakeRepository;
    @Autowired
    private SaleTransactionRepository saleTransactionRepository;
    @Autowired
    private ImportTransactionDetailRepository importTransactionDetailRepository;
    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public CreateSaleTransactionRequestDto buildSaleTransactionFromStocktake(Long stocktakeId, List<ProductSaleResponseDto> diffDetails, Long storeId) {
        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new IllegalArgumentException("Stocktake not found"));

        // Map StocktakeDetailDto (diff) sang ProductSaleResponseDto
        // (Nếu diffDetails đã là ProductSaleResponseDto thì chỉ cần truyền qua, nếu là StocktakeDetailDto thì cần map)
        // Ở đây assume diffDetails đã được map đúng (từ API /api/reports/stocktake-diff)

        // Tổng tiền hàng (có thể tính lại nếu cần)
        BigDecimal totalAmount = diffDetails.stream()
                .map(d -> d.getUnitSalePrice() != null && d.getQuantity() != null ? d.getUnitSalePrice().multiply(BigDecimal.valueOf(d.getQuantity())) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CreateSaleTransactionRequestDto dto = new CreateSaleTransactionRequestDto();
        dto.setCustomerId(null); // Khách lẻ (frontend sẽ truyền đúng ID hoặc backend tự lấy ID khách lẻ mặc định)
        dto.setStoreId(storeId);
        dto.setTotalAmount(totalAmount);
        dto.setPaidAmount(totalAmount); // Mặc định đã trả hết
        dto.setDetail(diffDetails);
        dto.setSaleTransactionNote("Cân bằng kho");
        dto.setStatus(SaleTransactionStatus.WAITING_FOR_APPROVE);
        dto.setSaleDate(java.time.LocalDateTime.now());
        // Ghi link Stocktake vào DTO để khi tạo PCB sẽ lưu luôn
        dto.setStocktakeId(stocktake.getId());
        dto.setName(null); // Để backend tự sinh mã phiếu bán nếu cần
        return dto;
    }

    @Override
    @Transactional
    public void updateZoneAndStockOnApprove(Long saleTransactionId) {
        SaleTransaction transaction = saleTransactionRepository.findById(saleTransactionId)
                .orElseThrow(() -> new IllegalArgumentException("SaleTransaction not found"));
        if (transaction.getDetail() == null) return;
        try {
            // Parse detail (list ProductSaleResponseDto)
            List<ProductSaleResponseDto> details = objectMapper.readValue(transaction.getDetail(), new TypeReference<List<ProductSaleResponseDto>>(){});
            for (ProductSaleResponseDto dto : details) {
                if (dto.getBatchCode() != null && dto.getZoneReal() != null) {
                    ImportTransactionDetail lot = importTransactionDetailRepository.findByName(dto.getBatchCode());
                    if (lot != null && (lot.getZones_id() == null || !lot.getZones_id().equals(dto.getZoneReal()))) {
                        lot.setZones_id(dto.getZoneReal());
                    }
                    // Đảm bảo cập nhật isCheck = true khi hoàn thành phiếu cân bằng kho
                    if (lot != null) {
                        lot.setIsCheck(true);
                        importTransactionDetailRepository.save(lot);
                    }
                }
            }
            // Trừ tồn kho (reuse logic deductStockFromBatch nếu cần, hoặc implement lại ở đây)
            // Ở đây chỉ cập nhật zone, còn deductStockFromBatch sẽ được gọi ở SaleTransactionServiceImpl.complete
        } catch (Exception e) {
            throw new RuntimeException("Failed to update zone and stock on approve: " + e.getMessage(), e);
        }
    }
} 