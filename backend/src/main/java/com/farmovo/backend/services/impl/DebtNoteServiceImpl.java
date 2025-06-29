package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.DebtNoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DebtNoteServiceImpl implements DebtNoteService {

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
        validateRequest(requestDto);

        Customer customer = customerRepository.findById(requestDto.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));
        Store store = storeRepository.findById(requestDto.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found with ID: " + requestDto.getStoreId()));

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
        DebtNote debtNote = debtNoteRepository.findByIdAndActive(id);
        if (debtNote == null) {
            throw new IllegalArgumentException("Debt note not found or has been deleted: " + id);
        }
        return mapToResponseDto(debtNote);
    }

    @Override
    public List<DebtNoteResponseDto> getAllDebtNotes() {
        return debtNoteRepository.findAllActive().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<DebtNoteResponseDto> getDebtNotesByCustomerId(Long customerId) {
        return debtNoteRepository.findByCustomerIdAndActive(customerId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<DebtNoteResponseDto> getDebtNotesByStoreId(Long storeId) {
        return debtNoteRepository.findByStoreIdAndActive(storeId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public DebtNoteResponseDto updateDebtNote(Long id, DebtNoteRequestDto requestDto) {
        DebtNote debtNote = debtNoteRepository.findByIdAndActive(id);
        if (debtNote == null) {
            throw new IllegalArgumentException("Debt note not found or has been deleted: " + id);
        }

        validateRequest(requestDto);

        Customer customer = customerRepository.findById(requestDto.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));
        Store store = storeRepository.findById(requestDto.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found with ID: " + requestDto.getStoreId()));

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
        DebtNote debtNote = debtNoteRepository.findByIdAndActive(id);
        if (debtNote == null) {
            throw new IllegalArgumentException("Debt note not found or has been deleted: " + id);
        }
        debtNote.setDeletedAt(LocalDateTime.now());
        debtNote.setDeletedBy(deletedBy);
        debtNoteRepository.save(debtNote);
    }

    private void validateRequest(DebtNoteRequestDto requestDto) {
        if (!VALID_DEBT_TYPES.contains(requestDto.getDebtType())) {
            throw new IllegalArgumentException("Invalid debt type. Must be '+' or '-'");
        }
        if (!VALID_SOURCE_TYPES.contains(requestDto.getFromSource())) {
            throw new IllegalArgumentException("Invalid source type. Must be 'CUSTOMER' or 'SUPPLIER'");
        }
        if (requestDto.getDebtAmount() == null || requestDto.getDebtAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Debt amount must be greater than zero");
        }
    }

    private DebtNoteResponseDto mapToResponseDto(DebtNote debtNote) {
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