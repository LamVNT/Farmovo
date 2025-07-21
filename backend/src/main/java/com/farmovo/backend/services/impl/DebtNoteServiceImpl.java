package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.DebtNoteRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.CustomerService;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.S3Service;
import com.farmovo.backend.utils.DebtNoteValidation;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DebtNoteServiceImpl implements DebtNoteService {

    private static final Logger logger = LogManager.getLogger(DebtNoteServiceImpl.class);
    private final CustomerRepository customerRepository;
    private final DebtNoteRepository debtNoteRepository;
    private final StoreRepository storeRepository;
    private final CustomerService customerService;
    private final S3Service s3Service;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Override
    public List<DebtNoteResponseDto> findDebtNotesByCustomerId(Long customerId) {
        logger.debug("Finding debt notes for customer ID: {}", customerId);
        try {
            customerService.getCustomerById(customerId);
            List<DebtNote> debtNotes = debtNoteRepository.findAll().stream()
                    .filter(debtNote -> debtNote.getCustomer().getId().equals(customerId)
                            && debtNote.getDeletedAt() == null)
                    .toList();
            List<DebtNoteResponseDto> result = debtNotes.stream()
                    .map(this::mapToDebtNoteResponseDto)
                    .collect(Collectors.toList());
            logger.info("Successfully found {} debt notes for customer ID: {}", result.size(), customerId);
            return result;
        } catch (IllegalArgumentException e) {
            logger.error("Failed to find debt notes for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error while finding debt notes for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw new IllegalStateException("Failed to find debt notes: " + e.getMessage());
        }
    }

    @Override
    public List<DebtNoteResponseDto> findDebtNotesByCustomerIdPaged(Long customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("debtDate").descending());
        return debtNoteRepository.findByCustomerIdAndDeletedAtIsNull(customerId, pageable)
                .getContent()
                .stream()
                .map(this::mapToDebtNoteResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<DebtNoteResponseDto> getDebtNotesPage(Long customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("debtDate").descending());
        Page<DebtNote> pageResult = debtNoteRepository.findByCustomerIdAndDeletedAtIsNull(customerId, pageable);
        return pageResult.map(this::mapToDebtNoteResponseDto);
    }

    @Override
    @Transactional
    public DebtNoteResponseDto addDebtNote(DebtNoteRequestDto requestDto) {
        DebtNoteValidation.validate(requestDto);
        // Thêm validation cho debtType: chỉ chấp nhận '+' hoặc '-'
        if (!"+".equals(requestDto.getDebtType()) && !"-".equals(requestDto.getDebtType())) {
            throw new IllegalArgumentException("Debt type must be '+' (import) or '-' (sale)");
        }
        logger.debug("Adding debt note: {}", requestDto);
        try {
            Customer customer = customerRepository.findById(requestDto.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));

            DebtNote debtNote = new DebtNote();
            debtNote.setCustomer(customer);
            BigDecimal debtAmount = requestDto.getDebtAmount().abs();  // Luôn abs để dương
            debtNote.setDebtAmount(debtAmount);
            debtNote.setDebtDate(requestDto.getDebtDate() != null ? requestDto.getDebtDate() : LocalDateTime.now());
            debtNote.setDebtType(requestDto.getDebtType() != null ? requestDto.getDebtType() : "");
            debtNote.setDebtDescription(requestDto.getDebtDescription() != null ? requestDto.getDebtDescription() : "");
            debtNote.setDebtEvidences(requestDto.getDebtEvidences() != null ? requestDto.getDebtEvidences() : "");
            debtNote.setFromSource(requestDto.getFromSource());
            debtNote.setSourceId(requestDto.getSourceId());
            debtNote.setStore(customer.getDebtNotes().stream().findAny().map(DebtNote::getStore).orElse(null));
            debtNote.setCreatedAt(LocalDateTime.now());
            debtNote.setCreatedBy(1L);

            debtNote = debtNoteRepository.save(debtNote);
            logger.info("Successfully added debt note with ID: {} for customer ID: {}", debtNote.getId(), customer.getId());

            // Tính tổng nợ mới sử dụng method tách
            BigDecimal totalDebt = calculateTotalDebt(customer.getId());
            customer.setTotalDebt(totalDebt != null ? totalDebt : BigDecimal.ZERO);
            customerRepository.save(customer);
            logger.debug("Updated total debt for customer ID: {} to: {}", customer.getId(), totalDebt);

            return mapToDebtNoteResponseDto(debtNote);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to add debt note. Error: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public DebtNoteResponseDto updateDebtNote(Long debtId, DebtNoteRequestDto requestDto) {
        logger.debug("Updating debt note ID: {} with data: {}", debtId, requestDto);
        try {
            DebtNote debtNote = debtNoteRepository.findById(debtId)
                    .orElseThrow(() -> new IllegalArgumentException("Debt note not found with ID: " + debtId));

            if (debtNote.getDeletedAt() != null) {
                throw new IllegalStateException("Cannot update deleted debt note with ID: " + debtId);
            }

            // Validation debtType nếu thay đổi
            if (requestDto.getDebtType() != null && !"+".equals(requestDto.getDebtType()) && !"-".equals(requestDto.getDebtType())) {
                throw new IllegalArgumentException("Debt type must be '+' (import) or '-' (sale)");
            }

            Customer customer = customerRepository.findById(requestDto.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));

            debtNote.setCustomer(customer);
            debtNote.setDebtDate(requestDto.getDebtDate() != null ? requestDto.getDebtDate() : debtNote.getDebtDate());
            debtNote.setDebtType(requestDto.getDebtType() != null ? requestDto.getDebtType() : debtNote.getDebtType());
            debtNote.setDebtDescription(requestDto.getDebtDescription() != null ? requestDto.getDebtDescription() : debtNote.getDebtDescription());
            debtNote.setDebtEvidences(requestDto.getDebtEvidences() != null ? requestDto.getDebtEvidences() : debtNote.getDebtEvidences());
            debtNote.setFromSource(requestDto.getFromSource());
            debtNote.setSourceId(requestDto.getSourceId());
            debtNote.setStore(customer.getDebtNotes().stream().findAny().map(DebtNote::getStore).orElse(null));
            debtNote.setUpdatedAt(LocalDateTime.now());

            debtNote = debtNoteRepository.save(debtNote);
            logger.info("Successfully updated debt note with ID: {}", debtId);

            return mapToDebtNoteResponseDto(debtNote);
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.error("Failed to update debt note ID: {}. Error: {}", debtId, e.getMessage());
            throw e;
        }
    }

    @Override
    public BigDecimal getTotalDebtByCustomerId(Long customerId) {
        logger.debug("Calculating total debt for customer ID: {}", customerId);
        try {
            BigDecimal totalDebt = calculateTotalDebt(customerId);
            logger.info("Successfully calculated total debt: {} for customer ID: {}", totalDebt, customerId);
            return totalDebt != null ? totalDebt : BigDecimal.ZERO;
        } catch (Exception e) {
            logger.error("Failed to calculate total debt for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw new IllegalArgumentException("Failed to calculate total debt: " + e.getMessage());
        }
    }

    @Override
    public BigDecimal getTotalImportDebtByCustomerId(Long customerId) {
        logger.debug("Calculating total import debt for customer ID: {}", customerId);
        try {
            BigDecimal totalImport = debtNoteRepository.getTotalImportDebtByCustomerId(customerId);
            return totalImport != null ? totalImport : BigDecimal.ZERO;
        } catch (Exception e) {
            logger.error("Failed to calculate total import debt for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw new IllegalArgumentException("Failed to calculate total import debt: " + e.getMessage());
        }
    }

    @Override
    public BigDecimal getTotalSaleDebtByCustomerId(Long customerId) {
        logger.debug("Calculating total sale debt for customer ID: {}", customerId);
        try {
            BigDecimal totalSale = debtNoteRepository.getTotalSaleDebtByCustomerId(customerId);
            return totalSale != null ? totalSale : BigDecimal.ZERO;
        } catch (Exception e) {
            logger.error("Failed to calculate total sale debt for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw new IllegalArgumentException("Failed to calculate total sale debt: " + e.getMessage());
        }
    }

    private BigDecimal calculateTotalDebt(Long customerId) {
        BigDecimal importDebt = getTotalImportDebtByCustomerId(customerId);
        BigDecimal saleDebt = getTotalSaleDebtByCustomerId(customerId);
        BigDecimal total = importDebt.subtract(saleDebt);
        logger.info("Tính tổng nợ cho customer {}: import (+) = {}, sale (-) = {}, total = {}", customerId, importDebt, saleDebt, total);
        return total;
    }

    @Override
    @Transactional
    public void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId) {
        // Validation debtType
        if (!"+".equals(debtType) && !"-".equals(debtType)) {
            throw new IllegalArgumentException("Debt type must be '+' (import) or '-' (sale)");
        }
        logger.debug("Creating debt note from transaction for customer ID: {}, source: {}, debtType: {}, sourceId: {}, storeId: {}", customerId, fromSource, debtType, sourceId, storeId);
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));

            DebtNote debtNote = new DebtNote();
            debtNote.setCustomer(customer);
            debtNote.setDebtAmount(debtAmount.abs());  // Thêm abs() để đảm bảo dương
            debtNote.setDebtDate(LocalDateTime.now());
            debtNote.setDebtType(debtType != null ? debtType : "AUTO");
            debtNote.setDebtDescription("Tự động tạo từ " + fromSource + " ID: " + sourceId);
            debtNote.setDebtEvidences("");
            debtNote.setFromSource(fromSource);
            debtNote.setSourceId(sourceId);
            debtNote.setStore(storeRepository.findById(storeId)
                    .orElseThrow(() -> new IllegalArgumentException("Store not found with ID: " + storeId)));
            debtNote.setCreatedAt(LocalDateTime.now());
            debtNote.setCreatedBy(1L);

            debtNote = debtNoteRepository.save(debtNote);
            logger.info("Successfully created debt note with ID: {} from {} ID: {}, store ID: {}", debtNote.getId(), fromSource, sourceId, storeId);

            BigDecimal totalDebt = calculateTotalDebt(customer.getId());
            customer.setTotalDebt(totalDebt != null ? totalDebt : BigDecimal.ZERO);
            customerRepository.save(customer);
            logger.debug("Updated total debt for customer ID: {} to: {}", customer.getId(), totalDebt);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to create debt note from transaction. Error: {}", e.getMessage());
            throw e;
        }
    }

    private DebtNoteResponseDto mapToDebtNoteResponseDto(DebtNote debtNote) {
        String evidence = debtNote.getDebtEvidences();
        String evidenceUrl = "";
        if (evidence != null && !evidence.isEmpty()) {
            String keyToUse = evidence;
            if (evidence.startsWith("https://")) {
                // Extract key từ URL public (bỏ domain)
                keyToUse = evidence.replace("https://" + bucketName + ".s3.amazonaws.com/", "");
            }
            try {
                evidenceUrl = s3Service.generatePresignedUrl(keyToUse);
                logger.info("Generated pre-signed URL for evidence key '{}': {}", keyToUse, evidenceUrl);
            } catch (Exception e) {
                logger.error("Failed to generate pre-signed URL for '{}': {}", keyToUse, e.getMessage());
                evidenceUrl = evidence;  // Fallback về evidence gốc
            }
        } else {
            logger.info("Debt evidence is empty");
        }
        return new DebtNoteResponseDto(
                debtNote.getId(),
                debtNote.getCustomer().getId(),
                debtNote.getDebtAmount() != null ? debtNote.getDebtAmount() : BigDecimal.ZERO,
                debtNote.getDebtDate() != null ? debtNote.getDebtDate() : LocalDateTime.now(),
                debtNote.getStore() != null ? debtNote.getStore().getId() : null,
                debtNote.getDebtType() != null ? debtNote.getDebtType() : "",
                debtNote.getDebtDescription() != null ? debtNote.getDebtDescription() : "",
                evidenceUrl != null ? evidenceUrl : "",
                debtNote.getFromSource() != null ? debtNote.getFromSource() : "",
                debtNote.getSourceId(),
                debtNote.getCreatedAt() != null ? debtNote.getCreatedAt() : LocalDateTime.now(),
                debtNote.getCreatedBy(),
                debtNote.getUpdatedAt(),
                debtNote.getDeletedAt(),
                debtNote.getDeletedBy()
        );
    }
}