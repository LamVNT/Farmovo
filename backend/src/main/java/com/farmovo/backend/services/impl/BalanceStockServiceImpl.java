package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.services.BalanceStockService;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.models.SaleTransactionStatus;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.stream.Collectors;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BalanceStockServiceImpl implements BalanceStockService {
    @Autowired
    private StocktakeRepository stocktakeRepository;
    @Autowired
    private SaleTransactionRepository saleTransactionRepository;
    @Autowired
    private ImportTransactionDetailRepository importTransactionDetailRepository;
    @Autowired
    private ProductRepository productRepository;
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
        // customerId sẽ được truyền từ frontend (dropdown), không mặc định khách lẻ ở đây
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

    @Override
    public List<ProductSaleResponseDto> convertStocktakeDetailToProductSale(List<StocktakeDetailDto> stocktakeDetails) {
        log.info("Converting {} stocktake details to product sale DTOs", stocktakeDetails.size());

        List<ProductSaleResponseDto> result = new ArrayList<>();

        for (StocktakeDetailDto stocktakeDetail : stocktakeDetails) {
            try {
                // Chỉ xử lý những item có diff âm (thiếu hàng) cho phiếu cân bằng
                if (stocktakeDetail.getDiff() == null || stocktakeDetail.getDiff() >= 0) {
                    continue;
                }

                ProductSaleResponseDto productSaleDto = new ProductSaleResponseDto();

                // Lấy thông tin ImportTransactionDetail dựa trên ID
                ImportTransactionDetail importDetail = null;
                if (stocktakeDetail.getId() != null) {
                    importDetail = importTransactionDetailRepository.findById(stocktakeDetail.getId()).orElse(null);
                }

                // Nếu không tìm thấy ImportTransactionDetail bằng ID, thử tìm bằng batchCode
                if (importDetail == null && stocktakeDetail.getBatchCode() != null) {
                    importDetail = importTransactionDetailRepository.findByName(stocktakeDetail.getBatchCode());
                }

                if (importDetail != null) {
                    // Lấy thông tin từ ImportTransactionDetail
                    productSaleDto.setId(importDetail.getId());
                    productSaleDto.setProId(importDetail.getProduct().getId());
                    productSaleDto.setProductName(importDetail.getProduct().getProductName());
                    productSaleDto.setProductCode(importDetail.getProduct().getProductCode());
                    productSaleDto.setRemainQuantity(importDetail.getRemainQuantity());
                    productSaleDto.setUnitSalePrice(importDetail.getUnitSalePrice() != null ? importDetail.getUnitSalePrice() : BigDecimal.ZERO);
                    productSaleDto.setCategoryName(importDetail.getProduct().getCategory() != null ?
                        importDetail.getProduct().getCategory().getCategoryName() : null);
                    productSaleDto.setStoreName(importDetail.getProduct().getStore() != null ?
                        importDetail.getProduct().getStore().getStoreName() : null);
                    productSaleDto.setName(importDetail.getName()); // Mã lô hàng
                    productSaleDto.setBatchCode(importDetail.getName());
                    productSaleDto.setCreateAt(importDetail.getCreatedAt());
                    productSaleDto.setExpireDate(importDetail.getExpireDate());
                } else {
                    // Fallback: lấy thông tin từ Product nếu không tìm thấy ImportTransactionDetail
                    log.warn("ImportTransactionDetail not found for stocktake detail ID: {}, batchCode: {}",
                        stocktakeDetail.getId(), stocktakeDetail.getBatchCode());

                    if (stocktakeDetail.getProductId() != null) {
                        Product product = productRepository.findById(stocktakeDetail.getProductId()).orElse(null);
                        if (product != null) {
                            productSaleDto.setId(0L); // Không có ImportTransactionDetail ID
                            productSaleDto.setProId(product.getId());
                            productSaleDto.setProductName(product.getProductName());
                            productSaleDto.setProductCode(product.getProductCode());
                            productSaleDto.setRemainQuantity(0);
                            productSaleDto.setUnitSalePrice(BigDecimal.ZERO); // Không có giá bán
                            productSaleDto.setCategoryName(product.getCategory() != null ?
                                product.getCategory().getCategoryName() : null);
                            productSaleDto.setStoreName(product.getStore() != null ?
                                product.getStore().getStoreName() : null);
                            productSaleDto.setBatchCode(stocktakeDetail.getBatchCode());
                        }
                    }
                }

                // Set thông tin từ StocktakeDetailDto
                productSaleDto.setQuantity(Math.abs(stocktakeDetail.getDiff())); // Số lượng chênh lệch (dương)
                productSaleDto.setZoneReal(stocktakeDetail.getZoneReal()); // Zone thực tế

                // Fallback cho các trường từ StocktakeDetailDto nếu chưa có
                if (productSaleDto.getProductName() == null) {
                    productSaleDto.setProductName(stocktakeDetail.getProductName());
                }
                if (productSaleDto.getProductCode() == null) {
                    productSaleDto.setProductCode(stocktakeDetail.getProductCode());
                }
                if (productSaleDto.getBatchCode() == null) {
                    productSaleDto.setBatchCode(stocktakeDetail.getBatchCode());
                }

                result.add(productSaleDto);

            } catch (Exception e) {
                log.error("Error converting stocktake detail to product sale DTO: {}", e.getMessage(), e);
                // Tiếp tục xử lý các item khác
            }
        }

        log.info("Successfully converted {} stocktake details to {} product sale DTOs",
            stocktakeDetails.size(), result.size());
        return result;
    }
}