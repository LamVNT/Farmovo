package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.exceptions.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class SaleTransactionValidator {

    public void validate(CreateSaleTransactionRequestDto dto) {
        if (dto.getTotalAmount() == null || dto.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Tổng tiền không hợp lệ.");
        }

        if (dto.getPaidAmount() == null || dto.getPaidAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Số tiền thanh toán không hợp lệ.");
        }

        if (dto.getStatus() == null) {
            throw new BadRequestException("Trạng thái không được để trống.");
        }

        if (dto.getSaleDate() == null) {
            throw new BadRequestException("Ngày bán không được để trống.");
        }

        if (dto.getSaleTransactionNote() != null && dto.getSaleTransactionNote().length() > 255) {
            throw new BadRequestException("Ghi chú quá dài (tối đa 255 ký tự).");
        }
    }
}

