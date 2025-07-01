package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.DebtNoteRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.DebtNoteService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DebtNoteServiceImpl implements DebtNoteService {

    private static final Logger logger = LogManager.getLogger(DebtNoteServiceImpl.class);
    private static final List<String> VALID_DEBT_TYPES = Arrays.asList("+", "-");
    private static final List<String> VALID_SOURCE_TYPES = Arrays.asList("CUSTOMER", "SUPPLIER");

    @Autowired
    private DebtNoteRepository debtNoteRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Override
    public DebtNoteResponseDto createDebtNote(DebtNoteRequestDto requestDto, Long createdBy) {
        logger.info("Processing creation of debt note for customer ID: {}", requestDto.getCustomerId());
        if (!isValidRequest(requestDto)) {
            logger.warn("Invalid request for debt note creation: {}", requestDto);
            return null; // Invalid request will be handled by controller/handler
        }

        Customer customer = customerRepository.findByIdAndActive(requestDto.getCustomerId());
        if (customer == null) {
            logger.warn("Customer not found with ID: {}", requestDto.getCustomerId());
            return null;
        }
        Store store = storeRepository.findById(requestDto.getStoreId()).orElse(null);
        if (store == null) {
            logger.warn("Store not found with ID: {}", requestDto.getStoreId());
            return null;
        }

        DebtNote debtNote = new DebtNote();
        debtNote.setDebtAmount(requestDto.getDebtAmount());
        debtNote.setDebtDate(requestDto.getDebtDate());
        debtNote.setDebtType(requestDto.getDebtType());
        debtNote.setDebtDescription(requestDto.getDebtDescription());
        debtNote.setDebtEvidences(requestDto.getDebtEvidences());
        debtNote.setFromSource(requestDto.getFromSource());
        debtNote.setSourceId(requestDto.getSourceId());
        debtNote.setCustomer(customer);
        debtNote.setStore(store);
        debtNote.setCreatedBy(createdBy);

        DebtNote savedDebtNote = debtNoteRepository.save(debtNote);
        return mapToResponseDto(savedDebtNote);
    }

    @Override
    public DebtNoteResponseDto getDebtNoteById(Long id) {
        logger.info("Fetching debt note with ID: {}", id);
        DebtNote debtNote = debtNoteRepository.findByIdAndActive(id);
        return debtNote != null ? mapToResponseDto(debtNote) : null;
    }

    @Override
    public List<DebtNoteResponseDto> getAllDebtNotes() {
        logger.info("Fetching all active debt notes");
        return debtNoteRepository.findAllActive().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<DebtNoteResponseDto> getAllDebtors() {
        logger.info("Fetching all debtors");
        return customerRepository.findAllActive().stream()
                .map(customer -> {
                    if (customer == null) {
                        logger.warn("Null customer encountered while fetching debtors");
                        return null;
                    }
                    DebtNoteResponseDto dto = new DebtNoteResponseDto();
                    dto.setId(customer.getId());
                    dto.setCustomerId(customer.getId());
                    dto.setDebtAmount(customer.getTotalDebt() != null ? customer.getTotalDebt() : BigDecimal.ZERO);
                    dto.setDebtDate(customer.getCreatedAt()); // Use createdAt as initial debt date
                    dto.setStoreId(null); // Can be enhanced to link to a default store if needed
                    dto.setDebtType(customer.getIsSupplier() ? "+" : "-"); // Default based on role
                    dto.setDebtDescription("Initial debtor record");
                    dto.setDebtEvidences(null);
                    dto.setFromSource(customer.getIsSupplier() ? "SUPPLIER" : "CUSTOMER");
                    dto.setSourceId(null);
                    dto.setCreatedAt(customer.getCreatedAt());
                    dto.setCreatedBy(customer.getCreatedBy());
                    dto.setUpdatedAt(customer.getUpdatedAt());
                    dto.setDeletedAt(customer.getDeletedAt());
                    dto.setDeletedBy(customer.getDeletedBy());
                    return dto;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    @Override
    public List<DebtNoteResponseDto> getDebtNotesByCustomerId(Long customerId) {
        logger.info("Fetching debt notes for customer ID: {}", customerId);
        return debtNoteRepository.findByCustomerIdAndActive(customerId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<DebtNoteResponseDto> getDebtNotesByStoreId(Long storeId) {
        logger.info("Fetching debt notes for store ID: {}", storeId);
        return debtNoteRepository.findByStoreIdAndActive(storeId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public DebtNoteResponseDto updateDebtNote(Long id, DebtNoteRequestDto requestDto) {
        logger.info("Processing update for debt note with ID: {}", id);
        DebtNote debtNote = debtNoteRepository.findByIdAndActive(id);
        if (debtNote == null) {
            logger.warn("Debt note not found or has been deleted: {}", id);
            return null;
        }

        if (!isValidRequest(requestDto)) {
            logger.warn("Invalid request for debt note update: {}", requestDto);
            return null;
        }

        Customer customer = customerRepository.findByIdAndActive(requestDto.getCustomerId());
        if (customer == null) {
            logger.warn("Customer not found with ID: {}", requestDto.getCustomerId());
            return null;
        }
        Store store = storeRepository.findById(requestDto.getStoreId()).orElse(null);
        if (store == null) {
            logger.warn("Store not found with ID: {}", requestDto.getStoreId());
            return null;
        }

        debtNote.setDebtAmount(requestDto.getDebtAmount());
        debtNote.setDebtDate(requestDto.getDebtDate());
        debtNote.setDebtType(requestDto.getDebtType());
        debtNote.setDebtDescription(requestDto.getDebtDescription());
        debtNote.setDebtEvidences(requestDto.getDebtEvidences());
        debtNote.setFromSource(requestDto.getFromSource());
        debtNote.setSourceId(requestDto.getSourceId());
        debtNote.setCustomer(customer);
        debtNote.setStore(store);

        DebtNote updatedDebtNote = debtNoteRepository.save(debtNote);
        return mapToResponseDto(updatedDebtNote);
    }

    @Override
    public void softDeleteDebtNote(Long id, Long deletedBy) {
        logger.info("Processing soft delete for debt note with ID: {}", id);
        DebtNote debtNote = debtNoteRepository.findByIdAndActive(id);
        if (debtNote == null) {
            logger.warn("Debt note not found or has been deleted: {}", id);
            return;
        }
        debtNote.setDeletedAt(LocalDateTime.now());
        debtNote.setDeletedBy(deletedBy);
        debtNoteRepository.save(debtNote);
    }

    private boolean isValidRequest(DebtNoteRequestDto requestDto) {
        boolean isValid = true;

        if (!VALID_DEBT_TYPES.contains(requestDto.getDebtType())) {
            logger.warn("Invalid debt type: {}", requestDto.getDebtType());
            isValid = false;
        }
        if (!VALID_SOURCE_TYPES.contains(requestDto.getFromSource())) {
            logger.warn("Invalid source type: {}", requestDto.getFromSource());
            isValid = false;
        }
        if (requestDto.getDebtAmount() == null || requestDto.getDebtAmount().compareTo(BigDecimal.ZERO) <= 0) {
            logger.warn("Invalid debt amount: {}", requestDto.getDebtAmount());
            isValid = false;
        }

        // Validate debt scenarios
        if ("CUSTOMER".equals(requestDto.getFromSource())) {
            if (!("+".equals(requestDto.getDebtType()) || "-".equals(requestDto.getDebtType()))) {
                logger.warn("Invalid debt type for CUSTOMER: {}", requestDto.getDebtType());
                isValid = false;
            }
        } else if ("SUPPLIER".equals(requestDto.getFromSource())) {
            if (!("-".equals(requestDto.getDebtType()) || "+".equals(requestDto.getDebtType()))) {
                logger.warn("Invalid debt type for SUPPLIER: {}", requestDto.getDebtType());
                isValid = false;
            }
        }

        return isValid;
    }

    private DebtNoteResponseDto mapToResponseDto(DebtNote debtNote) {
        logger.debug("Mapping debt note to response DTO: {}", debtNote.getId());
        DebtNoteResponseDto responseDto = new DebtNoteResponseDto();
        responseDto.setId(debtNote.getId());
        responseDto.setCustomerId(debtNote.getCustomer().getId());
        responseDto.setDebtAmount(debtNote.getDebtAmount());
        responseDto.setDebtDate(debtNote.getDebtDate());
        responseDto.setStoreId(debtNote.getStore().getId());
        responseDto.setDebtType(debtNote.getDebtType());
        responseDto.setDebtDescription(debtNote.getDebtDescription());
        responseDto.setDebtEvidences(debtNote.getDebtEvidences());
        responseDto.setFromSource(debtNote.getFromSource());
        responseDto.setSourceId(debtNote.getSourceId());
        responseDto.setCreatedAt(debtNote.getCreatedAt());
        responseDto.setCreatedBy(debtNote.getCreatedBy());
        responseDto.setUpdatedAt(debtNote.getUpdatedAt());
        responseDto.setDeletedAt(debtNote.getDeletedAt());
        responseDto.setDeletedBy(debtNote.getDeletedBy());
        return responseDto;
    }
}