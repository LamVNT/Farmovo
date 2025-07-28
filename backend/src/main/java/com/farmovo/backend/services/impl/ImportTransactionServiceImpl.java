package com.farmovo.backend.services.impl;


import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
import com.farmovo.backend.exceptions.TransactionStatusException;
import com.farmovo.backend.exceptions.CustomerNotFoundException;
import com.farmovo.backend.exceptions.StoreNotFoundException;
import com.farmovo.backend.mapper.ImportTransactionMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.ImportTransactionService;
import com.farmovo.backend.specification.ImportTransactionSpecification;
import com.farmovo.backend.validator.ImportTransactionDetailValidator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import com.farmovo.backend.aop.LogStatusChange;


@Service
@RequiredArgsConstructor
public class ImportTransactionServiceImpl implements ImportTransactionService {

    private static final Logger log = LogManager.getLogger(ImportTransactionServiceImpl.class);

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ImportTransactionRepository importTransactionRepository;
    private final ImportTransactionMapper importTransactionMapper;
    private final ImportTransactionDetailValidator detailValidator;
    private final DebtNoteService debtNoteService;



    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createImportTransaction(CreateImportTransactionRequestDto dto, Long userId) {
        log.info("Start creating import transaction for supplierId={}, storeId={}, staffId={}, detailsCount={}",
                dto.getSupplierId(), dto.getStoreId(), dto.getStaffId(),
                dto.getDetails() != null ? dto.getDetails().size() : 0);

        ImportTransaction transaction = new ImportTransaction();
        mapDtoToTransaction(transaction, dto, true, userId);

        // Sinh mã name tự động
        Long lastId = importTransactionRepository.findTopByOrderByIdDesc()
                .map(ImportTransaction::getId)
                .orElse(0L);
        String newName = String.format("PN%06d", lastId + 1);
        transaction.setName(newName);
        log.debug("Generated transaction code: {}", newName);

        ImportTransaction savedTransaction = importTransactionRepository.save(transaction);
        log.info("Import transaction created successfully. ID: {}, Code: {}, Total: {}, Paid: {}",
                savedTransaction.getId(), savedTransaction.getName(), transaction.getTotalAmount(), transaction.getPaidAmount());

        // Sinh mã LH000000 cho từng detail
        generateDetailCodes(savedTransaction);
        log.info("Import transaction created. Total: {}, Paid: {}", transaction.getTotalAmount(), transaction.getPaidAmount());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, CreateImportTransactionRequestDto dto) {
        log.info("Updating import transaction with ID: {}, detailsCount={}",
                id, dto.getDetails() != null ? dto.getDetails().size() : 0);

        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Import transaction not found with ID: {}", id);
                    return new ImportTransactionNotFoundException("Import transaction not found with ID: " + id);
                });

        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            log.warn("Attempted to update non-DRAFT transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "cập nhật");
        }

        // Clear old details before adding new ones
        int oldDetailsCount = transaction.getDetails().size();
        transaction.getDetails().clear();
        log.debug("Cleared {} old details from transaction", oldDetailsCount);

        mapDtoToTransaction(transaction, dto, false, null);

        ImportTransaction savedTransaction = importTransactionRepository.save(transaction);
        log.info("Import transaction updated successfully with ID: {}", id);

        // Sinh mã LH000000 cho từng detail (nếu cần)
        generateDetailCodes(savedTransaction);
    }

    // --- Helper methods ---

    private Customer getSupplier(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Supplier not found with ID: {}", id);
                    return new ResourceNotFoundException("Supplier not found with ID: " + id);
                });
    }

    private Store getStore(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Store not found with ID: {}", id);
                    return new ResourceNotFoundException("Store not found with ID: " + id);
                });
    }

    private User getStaff(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Staff not found with ID: {}", id);
                    return new ResourceNotFoundException("Staff not found with ID: " + id);
                });
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Product not found with ID: {}", id);
                    return new ResourceNotFoundException("Product not found with ID: " + id);
                });
    }

    private ImportTransactionDetail buildDetail(ImportTransaction transaction, Product product,
                                                CreateImportTransactionRequestDto.DetailDto dto) {
        ImportTransactionDetail detail = new ImportTransactionDetail();
        detail.setImportTransaction(transaction);
        detail.setProduct(product);
        detail.setImportQuantity(dto.getImportQuantity());
        detail.setRemainQuantity(dto.getRemainQuantity());
        detail.setExpireDate(dto.getExpireDate());
        detail.setUnitImportPrice(dto.getUnitImportPrice());
        detail.setUnitSalePrice(dto.getUnitSalePrice());

        // Convert List<String> zones_id → String và set vào entity
        String zonesIdStr = dto.getZones_id() == null ? null : String.join(",", dto.getZones_id());
        detail.setZones_id(zonesIdStr);
        log.debug("Đã set zones_id vào entity: {}", zonesIdStr);


        // false là cần kiểm hàng
        detail.setIsCheck(true);
        return detail;
    }

    private void mapDtoToTransaction(ImportTransaction transaction, CreateImportTransactionRequestDto dto, boolean isCreate, Long userId) {
        transaction.setSupplier(getSupplier(dto.getSupplierId()));
        transaction.setStore(getStore(dto.getStoreId()));
        transaction.setStaff(getStaff(dto.getStaffId()));
        transaction.setImportTransactionNote(dto.getImportTransactionNote());
        transaction.setImportDate(dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now());
        transaction.setStatus(dto.getStatus() != null ? dto.getStatus() : ImportTransactionStatus.DRAFT);
        if (isCreate && userId != null) transaction.setCreatedBy(userId);

        List<ImportTransactionDetail> detailList = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            Product product = getProduct(d.getProductId());
            detailValidator.validate(d);
            ImportTransactionDetail detail = buildDetail(transaction, product, d);
            BigDecimal lineTotal = d.getUnitImportPrice().multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);
            detailList.add(detail);
        }
        transaction.setDetails(detailList);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);
    }

    private void generateDetailCodes(ImportTransaction transaction) {
        for (ImportTransactionDetail detail : transaction.getDetails()) {
            if (detail.getName() == null || detail.getName().isEmpty()) {
                String code = String.format("LH%06d", detail.getId());
                detail.setName(code);
            }
        }
        importTransactionRepository.save(transaction);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @LogStatusChange
    public void cancel(Long id) {
        log.info("Cancelling import transaction with ID: {}", id);

        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImportTransaction not found with id: " + id));;

        ImportTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(ImportTransactionStatus.CANCEL);
        // updatedAt sẽ tự động cập nhật nhờ @UpdateTimestamp
        importTransactionRepository.save(transaction);

        log.info("Import transaction cancelled successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @LogStatusChange
    public void open(Long id) {
        log.info("Opening import transaction with ID: {}", id);

        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImportTransaction not found with id: " + id));

        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            log.warn("Attempted to open non-DRAFT transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "mở phiếu");
        }

        ImportTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(ImportTransactionStatus.WAITING_FOR_APPROVE);
        importTransactionRepository.save(transaction);

        log.info("Import transaction opened successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @LogStatusChange
    public void complete(Long id) {
        log.info("Completing import transaction with ID: {}", id);

        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImportTransaction not found with id: " + id));

        if (transaction.getStatus() != ImportTransactionStatus.WAITING_FOR_APPROVE) {
            log.warn("Attempted to complete non-WAITING_FOR_APPROVE transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "WAITING_FOR_APPROVE", "hoàn thành phiếu");
        }

        ImportTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(ImportTransactionStatus.COMPLETE);
        importTransactionRepository.save(transaction);


        BigDecimal paidAmount = transaction.getPaidAmount() != null ? transaction.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = transaction.getTotalAmount() != null ? transaction.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal rawDebtAmount = totalAmount.subtract(paidAmount);  // raw = total - paid
        if (rawDebtAmount.compareTo(BigDecimal.ZERO) != 0) {
            String debtType = rawDebtAmount.compareTo(BigDecimal.ZERO) > 0 ? "+" : "-";
            BigDecimal debtAmount = rawDebtAmount.abs();  // Luôn dương
            debtNoteService.createDebtNoteFromTransaction(
                    transaction.getSupplier().getId(),
                    debtAmount,
                    "IMPORT",
                    debtType,
                    transaction.getId(),
                    transaction.getStore().getId()
            );


            log.info("Created debt note for import transaction ID: {} with debt amount: {} (type: {})", transaction.getId(), debtAmount, debtType);
        }


        // Cập nhật số lượng sản phẩm khi hoàn thành phiếu nhập
        updateProductStockIfComplete(transaction);

        log.info("Import transaction completed successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @LogStatusChange
    public void close(Long id) {
        log.info("Closing import transaction with ID: {}", id);

        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImportTransaction not found with id: " + id));

        if (transaction.getStatus() != ImportTransactionStatus.WAITING_FOR_APPROVE) {
            log.warn("Attempted to close non-WAITING_FOR_APPROVE transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "WAITING_FOR_APPROVE", "đóng phiếu");
        }

        ImportTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(ImportTransactionStatus.DRAFT);
        importTransactionRepository.save(transaction);

        log.info("Import transaction closed successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    public List<CreateImportTransactionRequestDto> listAllImportTransaction1() {
        log.debug("Getting all import transactions (method 1)");

        List<ImportTransaction> entities = importTransactionRepository.findAll();
        List<CreateImportTransactionRequestDto> result = entities.stream()
                .map(importTransactionMapper::toDto)
                .collect(Collectors.toList());

        log.debug("Retrieved {} import transactions", result.size());
        return result;
    }

    @Override
    public Page<ImportTransactionResponseDto> listAllImportTransaction(
            String name,
            String supplierName,
            Long storeId,
            Long staffId,
            ImportTransactionStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            BigDecimal minTotalAmount,
            BigDecimal maxTotalAmount,
            Pageable pageable) {

        if (!pageable.getSort().isSorted()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("importDate").descending());
        }

        Specification<ImportTransaction> spec =
                ImportTransactionSpecification.buildSpecification(name, supplierName, storeId, staffId,
                        status, fromDate, toDate,
                        minTotalAmount, maxTotalAmount);

        Page<ImportTransaction> entityPage = importTransactionRepository.findAll(spec, pageable);

        List<ImportTransactionResponseDto> dtoList = entityPage.getContent().stream()
                .map(importTransactionMapper::toResponseDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, entityPage.getTotalElements());
    }

    @Override
    public CreateImportTransactionRequestDto getImportTransactionById(Long id) {
        log.debug("Getting import transaction by ID: {}", id);

        ImportTransaction entity = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImportTransaction not found with id: " + id));
        return importTransactionMapper.toDto(entity);
    }

    @Override
    public String getNextImportTransactionCode() {
        log.debug("Getting next import transaction code");

        Long lastId = importTransactionRepository.findTopByOrderByIdDesc()
                .map(ImportTransaction::getId)
                .orElse(0L);
        String nextCode = String.format("PN%06d", lastId + 1);

        log.debug("Generated next import transaction code: {}", nextCode);
        return nextCode;
    }

    @Override
    @Transactional
    public void softDeleteImportTransaction(Long id, Long userId) {
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        transaction.setDeletedAt(LocalDateTime.now());
        transaction.setDeletedBy(userId);

        importTransactionRepository.save(transaction);
    }

    private void updateProductStockIfComplete(ImportTransaction transaction) {
        if (transaction.getStatus() == ImportTransactionStatus.COMPLETE) {
            for (ImportTransactionDetail detail : transaction.getDetails()) {
                Product product = detail.getProduct();
                int updatedQuantity = product.getProductQuantity() + detail.getImportQuantity();
                product.setProductQuantity(updatedQuantity);
                productRepository.save(product); // Lưu lại thay đổi số lượng
                log.info("Updated product quantity. productId={}, newQuantity={}", product.getId(), updatedQuantity);
            }
        }
    }

    @Override
    public byte[] exportImportPdf(Long id) {
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Import transaction not found"));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Font Roboto hỗ trợ Unicode tiếng Việt
            ClassPathResource fontResource = new ClassPathResource("fonts/Roboto-Regular.ttf");
            File tempFontFile = File.createTempFile("roboto", ".ttf");
            tempFontFile.deleteOnExit();
            try (InputStream in = fontResource.getInputStream(); OutputStream os = new FileOutputStream(tempFontFile)) {
                in.transferTo(os);
            }

            BaseFont baseFont = BaseFont.createFont(tempFontFile.getAbsolutePath(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            Font normalFont = new Font(baseFont, 12);
            Font boldFont = new Font(baseFont, 12, Font.BOLD);
            Font redFont = new Font(baseFont, 12, Font.BOLD);
            Font blueFont = new Font(baseFont, 12, Font.BOLD);

            // Ngày giờ tạo
            LocalDateTime createdAt = transaction.getCreatedAt();
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String formattedTime = createdAt != null ? createdAt.format(timeFormatter) : "";
            String formattedDate = createdAt != null ? createdAt.format(dateFormatter) : "";

            // ===== Tiêu đề & ngày giờ =====
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{2f, 1f});
            headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            PdfPCell titleCell = new PdfPCell(new Phrase("CHI TIẾT PHIẾU NHẬP HÀNG " + safe(transaction.getName()), new Font(baseFont, 14, Font.BOLD)));
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setHorizontalAlignment(Element.ALIGN_LEFT);

            PdfPCell dateCell = new PdfPCell();
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dateCell.addElement(new Paragraph("Ngày lập: " + formattedDate, normalFont));
            dateCell.addElement(new Paragraph("Giờ lập: " + formattedTime, normalFont));

            headerTable.addCell(titleCell);
            headerTable.addCell(dateCell);
            document.add(headerTable);

            // ===== Trạng thái =====
            if (transaction.getStatus() == ImportTransactionStatus.COMPLETE) {
                document.add(new Paragraph("✔ Phiếu đã hoàn thành", normalFont));
            }

            // ===== Thông tin cửa hàng & nhà cung cấp =====
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingBefore(10f);
            infoTable.setSpacingAfter(10f);
            infoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            PdfPCell storeCell = new PdfPCell();
            storeCell.setBorder(Rectangle.NO_BORDER);
            storeCell.addElement(new Paragraph("Kho nhập", boldFont));
            storeCell.addElement(new Paragraph("Tên kho: " + safe(transaction.getStore() != null ? transaction.getStore().getStoreName() : null), normalFont));
            // Người tạo
            String nguoiTao = "Chưa có";
            try {
                if (transaction.getCreatedBy() != null) {
                    User staff = userRepository.findById(transaction.getCreatedBy()).orElse(null);
                    nguoiTao = staff != null && staff.getFullName() != null ? staff.getFullName() : "Chưa có";
                }
            } catch (Exception e) {
                nguoiTao = "Chưa có";
            }
            storeCell.addElement(new Paragraph("Người tạo: " + nguoiTao, normalFont));
            storeCell.addElement(new Paragraph("Địa chỉ kho: " + safe(transaction.getStore() != null ? transaction.getStore().getStoreAddress() : null), normalFont));

            PdfPCell supplierCell = new PdfPCell();
            supplierCell.setBorder(Rectangle.NO_BORDER);
            supplierCell.addElement(new Paragraph("Thông tin nhà cung cấp", boldFont));
            supplierCell.addElement(new Paragraph("Tên: " + safe(transaction.getSupplier() != null ? transaction.getSupplier().getName() : null), normalFont));
            supplierCell.addElement(new Paragraph("SĐT: " + safe(transaction.getSupplier() != null ? transaction.getSupplier().getPhone() : null), normalFont));
            supplierCell.addElement(new Paragraph("Địa chỉ: " + safe(transaction.getSupplier() != null ? transaction.getSupplier().getAddress() : null), normalFont));

            infoTable.addCell(storeCell);
            infoTable.addCell(supplierCell);
            document.add(infoTable);

            // ===== Bảng sản phẩm =====
            PdfPTable productTable = new PdfPTable(6);
            productTable.setWidthPercentage(100);
            productTable.setSpacingBefore(10);
            productTable.setWidths(new float[]{0.8f, 3f, 1.5f, 2f, 1.2f, 2.5f});

            productTable.addCell(getCell("STT", boldFont));
            productTable.addCell(getCell("Tên sản phẩm", boldFont));
            productTable.addCell(getCell("Mã", boldFont));
            productTable.addCell(getCell("Đơn giá nhập", boldFont));
            productTable.addCell(getCell("Số lượng", boldFont));
            productTable.addCell(getCell("Thành tiền", boldFont));

            List<ImportTransactionDetail> detailList = transaction.getDetails() != null ? transaction.getDetails() : new ArrayList<>();
            int index = 1;
            for (ImportTransactionDetail d : detailList) {
                BigDecimal unitPrice = d.getUnitImportPrice() != null ? d.getUnitImportPrice() : BigDecimal.ZERO;
                int quantity = d.getImportQuantity();
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
                productTable.addCell(getCell(String.valueOf(index++), normalFont));
                productTable.addCell(getCell(safe(d.getProduct() != null ? d.getProduct().getProductName() : null), normalFont)); // Tên sản phẩm
                productTable.addCell(getCell(safe(d.getProduct() != null ? String.valueOf(d.getProduct().getId()) : null), normalFont)); // Mã
                productTable.addCell(getCell(formatCurrency(unitPrice), normalFont));
                productTable.addCell(getCell(String.valueOf(quantity), normalFont));
                productTable.addCell(getCell(formatCurrency(lineTotal), normalFont));
            }
            document.add(productTable);

            // ===== Tổng tiền & Ghi chú =====
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingBefore(10);
            summaryTable.setWidths(new float[]{1f, 1f});

            // Cột bên trái: Tổng tiền
            PdfPCell totalCell = new PdfPCell();
            totalCell.setBorder(Rectangle.NO_BORDER);
            BigDecimal totalAmount = transaction.getTotalAmount() != null ? transaction.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal paidAmount = transaction.getPaidAmount() != null ? transaction.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal remainAmount = totalAmount.subtract(paidAmount);
            totalCell.addElement(new Paragraph("Tổng tiền hàng: " + formatCurrency(totalAmount), normalFont));
            totalCell.addElement(new Paragraph("Số tiền đã trả: " + formatCurrency(paidAmount), blueFont));
            totalCell.addElement(new Paragraph("Còn lại: " + formatCurrency(remainAmount), redFont));

            // Cột bên phải: Ghi chú
            PdfPCell noteCell = new PdfPCell();
            noteCell.setBorder(Rectangle.NO_BORDER);
            if (transaction.getImportTransactionNote() != null && !transaction.getImportTransactionNote().isEmpty()) {
                noteCell.addElement(new Paragraph("Ghi chú:", boldFont));
                noteCell.addElement(new Paragraph(transaction.getImportTransactionNote(), normalFont));
            }

            summaryTable.addCell(totalCell);
            summaryTable.addCell(noteCell);
            document.add(summaryTable);

            // ===== Chữ ký =====
            document.add(new Paragraph(" ")); // khoảng trắng
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setWidths(new float[]{1f, 1f});
            signTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            // Cột trống bên trái
            PdfPCell leftEmptyCell = new PdfPCell(new Phrase(""));
            leftEmptyCell.setBorder(Rectangle.NO_BORDER);

            // Cột bên phải là phần chữ ký
            PdfPCell rightSignCell = new PdfPCell();
            rightSignCell.setBorder(Rectangle.NO_BORDER);
            rightSignCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightSignCell.addElement(new Paragraph("Người lập phiếu", boldFont));
            rightSignCell.addElement(new Paragraph("(Ký, ghi rõ họ tên)", normalFont));

            signTable.addCell(leftEmptyCell);
            signTable.addCell(rightSignCell);

            document.add(signTable);

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo PDF phiếu nhập: " + e.getMessage(), e);
        }
    }


    private PdfPCell getCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        return cell;
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return format.format(amount).replace("₫", "VND");
    }

    private String safe(String input) {
        return input == null ? "Chưa có" : input;
    }

    //    @Override
//    public List<ImportTransactionResponseDto> listAllImportTransaction() {
//        List<ImportTransaction> entities = importTransactionRepository.findAllImportActive();
//        return entities.stream()
//                .map(importTransactionMapper::toResponseDto)
//                .collect(Collectors.toList());
//    }
}
