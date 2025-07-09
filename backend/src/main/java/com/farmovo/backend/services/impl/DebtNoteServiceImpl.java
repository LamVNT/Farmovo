package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.DebtNoteRepository;
import com.farmovo.backend.services.CustomerService;
import com.farmovo.backend.services.DebtNoteService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
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
    private final CustomerService customerService;

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
    @Transactional
    public DebtNoteResponseDto addDebtNote(DebtNoteRequestDto requestDto) {
        logger.debug("Adding debt note: {}", requestDto);
        try {
            Customer customer = customerRepository.findById(requestDto.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + requestDto.getCustomerId()));

            DebtNote debtNote = new DebtNote();
            debtNote.setCustomer(customer);
            debtNote.setDebtAmount(requestDto.getDebtAmount());
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
    public void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, Long sourceId) {
        logger.debug("Creating debt note from transaction for customer ID: {}, source: {}, sourceId: {}", customerId, fromSource, sourceId);
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));

            DebtNote debtNote = new DebtNote();
            debtNote.setCustomer(customer);
            debtNote.setDebtAmount(debtAmount);
            debtNote.setDebtDate(LocalDateTime.now());
            debtNote.setDebtType("AUTO");
            debtNote.setDebtDescription("Tự động tạo từ " + fromSource + " ID: " + sourceId);
            debtNote.setDebtEvidences("");
            debtNote.setFromSource(fromSource);
            debtNote.setSourceId(sourceId);
            debtNote.setStore(customer.getDebtNotes().stream().findAny().map(DebtNote::getStore).orElse(null));
            debtNote.setCreatedAt(LocalDateTime.now());
            debtNote.setCreatedBy(1L);

            debtNote = debtNoteRepository.save(debtNote);
            logger.info("Successfully created debt note with ID: {} from {} ID: {}", debtNote.getId(), fromSource, sourceId);

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
        return new DebtNoteResponseDto(
                debtNote.getId(),
                debtNote.getCustomer().getId(),
                debtNote.getDebtAmount() != null ? debtNote.getDebtAmount() : BigDecimal.ZERO,
                debtNote.getDebtDate() != null ? debtNote.getDebtDate() : LocalDateTime.now(),
                debtNote.getStore() != null ? debtNote.getStore().getId() : null,
                debtNote.getDebtType() != null ? debtNote.getDebtType() : "",
                debtNote.getDebtDescription() != null ? debtNote.getDebtDescription() : "",
                debtNote.getDebtEvidences() != null ? debtNote.getDebtEvidences() : "",
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