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
        logger.debug("Adding debt note: {}", requestDto);
        try {
            Customer customer = customerRepository.findById(requestDto.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));

            DebtNote debtNote = new DebtNote();
            debtNote.setCustomer(customer);
            // Điều chỉnh debtAmount dựa trên debtType
            BigDecimal debtAmount = requestDto.getDebtAmount();
            if ("-".equals(requestDto.getDebtType())) {
                debtAmount = debtAmount.abs().negate(); // Chuyển thành số âm nếu debtType là "-"
            } else {
                debtAmount = debtAmount.abs(); // Giữ số dương nếu debtType là "+"
            }
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

            BigDecimal totalDebt = debtNoteRepository.calculateTotalDebtByCustomerId(customer.getId());
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

            Customer customer = customerRepository.findById(requestDto.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));

            debtNote.setCustomer(customer);
            debtNote.setDebtDate(requestDto.getDebtDate() != null ? requestDto.getDebtDate() : debtNote.getDebtDate());
            debtNote.setDebtType(requestDto.getDebtType() != null ? requestDto.getDebtType() : "");
            debtNote.setDebtDescription(requestDto.getDebtDescription() != null ? requestDto.getDebtDescription() : "");
            debtNote.setDebtEvidences(requestDto.getDebtEvidences() != null ? requestDto.getDebtEvidences() : "");
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
            BigDecimal totalDebt = debtNoteRepository.calculateTotalDebtByCustomerId(customerId);
            logger.info("Successfully calculated total debt: {} for customer ID: {}", totalDebt, customerId);
            return totalDebt != null ? totalDebt : BigDecimal.ZERO;
        } catch (Exception e) {
            logger.error("Failed to calculate total debt for customer ID: {}. Error: {}", customerId, e.getMessage());
            throw new IllegalArgumentException("Failed to calculate total debt: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId) {
        logger.debug("Creating debt note from transaction for customer ID: {}, source: {}, debtType: {}, sourceId: {}, storeId: {}", customerId, fromSource, debtType, sourceId, storeId);
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));

            DebtNote debtNote = new DebtNote();
            debtNote.setCustomer(customer);
            debtNote.setDebtAmount(debtAmount); // debtAmount đã được điều chỉnh ở tầng gọi
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

            BigDecimal totalDebt = debtNoteRepository.calculateTotalDebtByCustomerId(customer.getId());
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
        String evidenceUrl = evidence;
        if (evidence != null && !evidence.isEmpty()) {
            // Luôn generate pre-signed, giả sử evidence là key hoặc URL (extract key nếu cần)
            if (evidence.startsWith("http")) {
                // Nếu là URL public, extract key từ URL
                evidenceUrl = evidence.substring(evidence.lastIndexOf("/") + 1);  // Extract key
            }
            try {
                evidenceUrl = s3Service.generatePresignedUrl(evidenceUrl);
                logger.info("Generated pre-signed URL for evidence key '{}': {}", evidence, evidenceUrl);
            } catch (Exception e) {
                logger.error("Failed to generate pre-signed URL for '{}': {}", evidence, e.getMessage());
                evidenceUrl = "";  // Hoặc fallback
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