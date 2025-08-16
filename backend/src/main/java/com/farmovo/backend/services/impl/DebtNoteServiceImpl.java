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
import com.farmovo.backend.utils.DebtNoteValidation;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.farmovo.backend.specification.DebtNoteSpecification.*;

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
    private final com.farmovo.backend.mapper.DebtNoteMapper debtNoteMapper;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Override
    public List<DebtNoteResponseDto> findDebtNotesByCustomerId(Long customerId) {
        validateCustomerId(customerId);
        logger.debug("Finding debt notes for customer ID: {}", customerId);
        try {
            customerService.getCustomerById(customerId);
            Specification<DebtNote> spec = defaultFilter(customerId);
            List<DebtNote> debtNotes = debtNoteRepository.findAll(spec, Sort.by("debtDate").descending());
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

    // Removed legacy List-returning paged method

    @Override
    public Page<DebtNoteResponseDto> getDebtNotesPage(Long customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("debtDate").descending());
        Specification<DebtNote> spec = defaultFilter(customerId);
        Page<DebtNote> pageResult = debtNoteRepository.findAll(spec, pageable);
        return pageResult.map(this::mapToDebtNoteResponseDto);
    }

    @Override
    public Page<DebtNoteResponseDto> findDebtNotesByCustomerIdPaged(Long customerId, String fromSource, String debtType, Long storeId,
                                                     LocalDateTime fromDate, LocalDateTime toDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("debtDate").descending());

        Specification<DebtNote> spec = Specification.allOf(
                isNotDeleted(),
                hasCustomer(customerId),
                hasFromSource(fromSource),
                hasDebtType(debtType),
                hasStore(storeId),
                createdBetween(fromDate, toDate)
        );

        Page<DebtNote> pageResult = debtNoteRepository.findAll(spec, pageable);
        return pageResult.map(this::mapToDebtNoteResponseDto);
    }


    @Override
    @Transactional
    public DebtNoteResponseDto addDebtNote(DebtNoteRequestDto requestDto) {
        validateDebtNoteRequest(requestDto);
        Customer customer = getCustomerOrThrow(requestDto.getCustomerId());
        DebtNote debtNote = mapRequestToEntity(requestDto, customer);
        debtNote = debtNoteRepository.save(debtNote);
        updateCustomerTotalDebtIncremental(customer.getId(), debtNote.getDebtAmount(), debtNote.getDebtType());
        return mapToDebtNoteResponseDto(debtNote);
    }



    @Override
    public BigDecimal getTotalDebtByCustomerId(Long customerId) {
        validateCustomerId(customerId);
        logger.debug("Calculating total debt for customer ID: {}", customerId);
        try {
            // Trả về totalDebt từ Customer entity (đã được tính incremental)
            Customer customer = getCustomerOrThrow(customerId);
            BigDecimal totalDebt = customer.getTotalDebt() != null ? customer.getTotalDebt() : BigDecimal.ZERO;
            logger.info("Retrieved total debt from customer entity: {} for customer ID: {}", totalDebt, customerId);
            return totalDebt;
        } catch (Exception e) {
            logger.error("Failed to get total debt for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw new IllegalArgumentException("Failed to get total debt: " + e.getMessage());
        }
    }



    @Override
    @Transactional
    public void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId) {
        validateDebtAmount(debtAmount);
        validateDebtType(debtType);
        logger.debug("Creating debt note from transaction for customer ID: {}, source: {}, debtType: {}, sourceId: {}, storeId: {}", customerId, fromSource, debtType, sourceId, storeId);
        try {
            Customer customer = getCustomerOrThrow(customerId);
            DebtNote debtNote = createDebtNoteEntityFromTransaction(customer, debtAmount, fromSource, debtType, sourceId, storeId);
            debtNote = debtNoteRepository.save(debtNote);
            updateCustomerTotalDebtIncremental(customer.getId(), debtNote.getDebtAmount(), debtNote.getDebtType());
            logger.info("Successfully created debt note with ID: {} from {} ID: {}, store ID: {}", debtNote.getId(), fromSource, sourceId, storeId);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to create debt note from transaction. Error: {}", e.getMessage());
            throw e;
        }
    }

    private void validateCustomerId(Long customerId) {
        if (customerId == null) {
            throw new IllegalArgumentException("Customer ID không được để trống.");
        }
    }

    private void validateDebtNoteRequest(DebtNoteRequestDto requestDto) {
        DebtNoteValidation.validate(requestDto);
        validateDebtType(requestDto.getDebtType());
    }

    private void validateDebtType(String debtType) {
        if (!"+".equals(debtType) && !"-".equals(debtType)) {
            throw new IllegalArgumentException("Debt type must be '+' (import) or '-' (sale)");
        }
    }



    private void validateDebtAmount(BigDecimal debtAmount) {
        if (debtAmount == null) {
            throw new IllegalArgumentException("Số tiền nợ (debtAmount) không được để trống.");
        }
    }

    private Customer getCustomerOrThrow(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));
    }

    private DebtNote getDebtNoteOrThrow(Long debtId) {
        return debtNoteRepository.findById(debtId)
                .orElseThrow(() -> new IllegalArgumentException("Debt note not found with ID: " + debtId));
    }



    /**
     * Cập nhật totalDebt bằng cách cộng thêm debtAmount mới (hiệu suất cao hơn)
     * @param customerId ID của customer
     * @param debtAmount Số tiền nợ mới
     * @param debtType Loại nợ ('+' hoặc '-')
     */
    private void updateCustomerTotalDebtIncremental(Long customerId, BigDecimal debtAmount, String debtType) {
        Customer customer = getCustomerOrThrow(customerId);
        BigDecimal currentTotalDebt = customer.getTotalDebt() != null ? customer.getTotalDebt() : BigDecimal.ZERO;
        
        // Tính toán số tiền cần cộng vào totalDebt
        BigDecimal amountToAdd;
        if ("+".equals(debtType)) {
            // Import debt: cộng thêm (tăng nợ)
            amountToAdd = debtAmount;
        } else if ("-".equals(debtType)) {
            // Sale debt: trừ đi (giảm nợ)
            amountToAdd = debtAmount.negate();
        } else {
            // Trường hợp khác: giữ nguyên
            amountToAdd = BigDecimal.ZERO;
        }
        
        BigDecimal newTotalDebt = currentTotalDebt.add(amountToAdd);
        customer.setTotalDebt(newTotalDebt);
        customerRepository.save(customer);
        
        logger.debug("Updated total debt incrementally for customer ID: {}: current={}, added={}, new={}", 
                    customerId, currentTotalDebt, amountToAdd, newTotalDebt);
    }



    private DebtNote mapRequestToEntity(DebtNoteRequestDto requestDto, Customer customer) {
        DebtNote debtNote = new DebtNote();
        debtNote.setCustomer(customer);
        BigDecimal debtAmount = requestDto.getDebtAmount().abs();
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
        return debtNote;
    }



    private DebtNote createDebtNoteEntityFromTransaction(Customer customer, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId) {
        DebtNote debtNote = new DebtNote();
        debtNote.setCustomer(customer);
        debtNote.setDebtAmount(debtAmount.abs());
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
        return debtNote;
    }

    private String generateEvidenceUrl(String evidence) {
        if (evidence == null || evidence.isEmpty()) return "";
        String keyToUse = evidence;
        if (evidence.startsWith("https://")) {
            keyToUse = evidence.replace("https://" + bucketName + ".s3.amazonaws.com/", "");
        }
        try {
            return s3Service.generatePresignedUrl(keyToUse);
        } catch (Exception e) {
            logger.error("Failed to generate pre-signed URL for '{}': {}", keyToUse, e.getMessage());
            return evidence;
        }
    }

    private DebtNoteResponseDto mapToDebtNoteResponseDto(DebtNote debtNote) {
        DebtNoteResponseDto dto = debtNoteMapper.toResponseDto(debtNote);
        // Thay thế đường dẫn evidence thành presigned URL
        dto.setDebtEvidences(generateEvidenceUrl(debtNote.getDebtEvidences()));
        return dto;
    }
}