package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.exceptions.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class ImportTransactionDetailValidator {

    public void validate(CreateImportTransactionRequestDto.DetailDto dto) {
        if (dto.getImportQuantity() == null || dto.getImportQuantity() <= 0) {
            throw new BadRequestException("Số lượng nhập phải lớn hơn 0.");
        }

        if (dto.getRemainQuantity() == null || dto.getRemainQuantity() < 0) {
            throw new BadRequestException("Số lượng còn lại không hợp lệ.");
        }

        if (dto.getRemainQuantity() > dto.getImportQuantity()) {
            throw new BadRequestException("Số lượng còn lại không được lớn hơn số lượng nhập.");
        }

        if (dto.getUnitImportPrice() == null || dto.getUnitImportPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Giá nhập không hợp lệ.");
        }

        if (dto.getUnitSalePrice() == null || dto.getUnitSalePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Giá bán không hợp lệ.");
        }

        if (dto.getExpireDate() != null && dto.getExpireDate().isBefore(LocalDateTime.now())){
            throw new BadRequestException("Ngày hết hạn không được ở quá khứ.");
        }
    }
}

