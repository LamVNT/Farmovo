package com.farmovo.backend.utils;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

public class DebtNoteValidation {

    private static final Logger logger = LogManager.getLogger(DebtNoteValidation.class);

    public static void validate(DebtNoteRequestDto requestDto) {
        logger.debug("Validating DebtNoteRequestDto: {}", requestDto);

        // Kiểm tra customerId bắt buộc
        if (requestDto.getCustomerId() == null) {
            throw new IllegalArgumentException("Customer ID không được để trống.");
        }

// Kiểm tra debtAmount bắt buộc, phải != 0
        if (requestDto.getDebtAmount() == null || requestDto.getDebtAmount().compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Số tiền nợ (debtAmount) phải khác 0.");
        }

        // Kiểm tra debtType bắt buộc, chỉ chấp nhận "+" hoặc "-"
        if (requestDto.getDebtType() == null || (!"+".equals(requestDto.getDebtType()) && !"-".equals(requestDto.getDebtType()))) {
            throw new IllegalArgumentException("Loại nợ (debtType) phải là '+' (tăng nợ) hoặc '-' (giảm nợ).");
        }

        // Kiểm tra debtDate bắt buộc
        if (requestDto.getDebtDate() == null) {
            throw new IllegalArgumentException("Ngày nợ (debtDate) không được để trống.");
        }

        // Kiểm tra storeId tùy chọn, nhưng nếu có thì phải > 0
        if (requestDto.getStoreId() != null && requestDto.getStoreId() <= 0) {
            throw new IllegalArgumentException("Store ID phải lớn hơn 0 nếu được cung cấp.");
        }

        if (requestDto.getDebtDescription() == null ) {
            throw new IllegalArgumentException("Mô tả không được thiếu.");
        }

        logger.info("Validation passed for DebtNoteRequestDto with customerId: {}", requestDto.getCustomerId());
    }
}