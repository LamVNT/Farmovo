package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.DebtNoteRepository;
import com.farmovo.backend.repositories.ImportTransactionRepository;
//import com.farmovo.backend.repositories.SaleTransactionRepository;
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
    private static final List<String> VALID_SOURCE_TYPES = Arrays.asList("MANUAL", "SALE", "PURCHASE");

    @Autowired
    private DebtNoteRepository debtNoteRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ImportTransactionRepository importTransactionRepository;

    @Autowired
//    private SaleTransactionRepository saleTransactionRepository;

    @Override
    public DebtNoteResponseDto createDebtNote(DebtNoteRequestDto requestDto, Long createdBy) {
        logger.info("Processing creation of debt note for customer ID: {}", requestDto.getCustomerId());
        if (!isValidRequest(requestDto)) {
            logger.warn("Invalid request for debt note creation: {}", requestDto);
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

        // Update customer's totalDebt for MANUAL debts
        if ("MANUAL".equals(requestDto.getFromSource()) && requestDto.getSourceId() == null) {
            BigDecimal currentTotalDebt = customer.getTotalDebt() != null ? customer.getTotalDebt() : BigDecimal.ZERO;
            BigDecimal newTotalDebt = currentTotalDebt.add(requestDto.getDebtAmount());
            customer.setTotalDebt(newTotalDebt);
            customerRepository.save(customer);
        }

        DebtNote savedDebtNote = debtNoteRepository.save(debtNote);
        return mapToResponseDto(savedDebtNote);
    }

    public DebtNoteResponseDto createDebtFromTransaction(Long transactionId, String transactionType, Long createdBy) {
        logger.info("Automatically creating debt from {} transaction ID: {}", transactionType, transactionId);
        if (!VALID_SOURCE_TYPES.contains(transactionType)) {
            logger.warn("Invalid transaction type: {}", transactionType);
            return null;
        }

        if ("SALE".equals(transactionType)) {
            SaleTransaction sale = saleTransactionRepository.findById(transactionId).orElse(null);
            if (sale == null || sale.getPaidAmount() >= sale.getTotal()) {
                logger.warn("No debt required for sale transaction ID: {}", transactionId);
                return null;
            }
            Customer customer = sale.getCustomer();
            if (customer == null) {
                logger.warn("No customer associated with sale transaction ID: {}", transactionId);
                return null;
            }
            BigDecimal debtAmount = sale.getTotal().subtract(sale.getPaidAmount());
            return createDebtNote(new DebtNoteRequestDto(
                    customer.getId(),
                    debtAmount,
                    LocalDateTime.now(),
                    sale.getStore().getId(),
                    "+",
                    "Phát sinh nợ khi bán hàng mà chưa trả đủ",
                    null,
                    "SALE",
                    transactionId
            ), createdBy);
        } else if ("PURCHASE".equals(transactionType)) {
            ImportTransaction purchase = importTransactionRepository.findById(transactionId).orElse(null);
            if (purchase == null || purchase.getPaidAmount() >= purchase.getTotal()) {
                logger.warn("No debt required for purchase transaction ID: {}", transactionId);
                return null;
            }
            Customer supplier = purchase.getSupplier();
            if (supplier == null) {
                logger.warn("No supplier associated with purchase transaction ID: {}", transactionId);
                return null;
            }
            BigDecimal debtAmount = purchase.getTotal().subtract(purchase.getPaidAmount());
            return createDebtNote(new DebtNoteRequestDto(
                    supplier.getId(),
                    debtAmount,
                    LocalDateTime.now(),
                    purchase.getStore().getId(),
                    "-",
                    "Bạn nợ nhà cung cấp",
                    null,
                    "PURCHASE",
                    transactionId
            ), createdBy);
        }
        return null;
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
                    dto.setDebtDate(customer.getCreatedAt());
                    dto.setStoreId(null);
                    dto.setDebtType(customer.getIsSupplier() ? "-" : "+");
                    dto.setDebtDescription("Initial debtor record");
                    dto.setDebtEvidences(null);
                    dto.setFromSource("MANUAL");
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

        // Update customer's totalDebt for MANUAL debt updates
        if ("MANUAL".equals(requestDto.getFromSource()) && requestDto.getSourceId() == null) {
            BigDecimal currentTotalDebt = customer.getTotalDebt() != null ? customer.getTotalDebt() : BigDecimal.ZERO;
            BigDecimal newTotalDebt = currentTotalDebt.add(requestDto.getDebtAmount());
            customer.setTotalDebt(newTotalDebt);
            customerRepository.save(customer);
        }

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
        if (requestDto.getDebtAmount() == null || requestDto.getDebtAmount().compareTo(BigDecimal.ZERO) <= 0) {
            logger.warn("Invalid debt amount: {}", requestDto.getDebtAmount());
            isValid = false;
        }

        if (requestDto.getFromSource() != null) {
            if (!VALID_SOURCE_TYPES.contains(requestDto.getFromSource())) {
                logger.warn("Invalid fromSource: {}", requestDto.getFromSource());
                isValid = false;
            }
            if ("MANUAL".equals(requestDto.getFromSource()) && requestDto.getSourceId() != null) {
                logger.warn("Manual debt should not have sourceId: {}", requestDto.getSourceId());
                isValid = false;
            }
            if (("SALE".equals(requestDto.getFromSource()) || "PURCHASE".equals(requestDto.getFromSource())) && requestDto.getSourceId() == null) {
                logger.warn("Transaction-based debt requires sourceId");
                isValid = false;
            }
        }

        return isValid;
    }

    private DebtNoteResponseDto mapToResponseDto(DebtNote debtNote) {
        logger.debug("Mapping debt note to response DTO: {}", debtNote.getId());
        if (debtNote == null) {
            logger.warn("Attempted to map null debt note");
            return null;
        }
        DebtNoteResponseDto responseDto = new DebtNoteResponseDto();
        responseDto.setId(debtNote.getId());
        responseDto.setCustomerId(debtNote.getCustomer() != null ? debtNote.getCustomer().getId() : null);
        responseDto.setDebtAmount(debtNote.getDebtAmount());
        responseDto.setDebtDate(debtNote.getDebtDate());
        responseDto.setStoreId(debtNote.getStore() != null ? debtNote.getStore().getId() : null);
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