package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.SaleTransactionNotFoundException;
import java.io.FileOutputStream;
import com.farmovo.backend.exceptions.TransactionStatusException;
import com.farmovo.backend.exceptions.CustomerNotFoundException;
import com.farmovo.backend.exceptions.StoreNotFoundException;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.SaleTransactionService;
import com.farmovo.backend.specification.SaleTransactionSpecification;
import com.farmovo.backend.validator.SaleTransactionValidator;
import com.farmovo.backend.aop.LogStatusChange;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class SaleTransactionServiceImpl implements SaleTransactionService {

    private static final Logger log = LogManager.getLogger(SaleTransactionServiceImpl.class);

    private final ImportTransactionDetailRepository detailRepository;
    private final SaleTransactionRepository saleTransactionRepository;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final SaleTransactionMapper saleTransactionMapper;
    private final ImportTransactionDetailRepository importTransactionDetailRepository;
    private final DebtNoteService debtNoteService;
    private final SaleTransactionValidator saleTransactionValidator;
    private final UserRepository userRepository;

    @Override
    public List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long productId) {
        log.debug("Getting product response details for product ID: {}", productId);

        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        List<ProductSaleResponseDto> result = details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());

        log.debug("Found {} details for product ID: {}", result.size(), productId);
        return result;
    }

    @Override
    @Transactional
    public void save(CreateSaleTransactionRequestDto dto, Long userId) {
        log.info("Saving sale transaction for user: {}, customer: {}, store: {}, totalAmount: {}",
                userId, dto.getCustomerId(), dto.getStoreId(), dto.getTotalAmount());

        saleTransactionValidator.validate(dto);

        SaleTransaction transaction = new SaleTransaction();
        mapDtoToTransaction(transaction, dto, userId);

        // Sinh mã name tự động
        String newName = generateTransactionCode();
        transaction.setName(newName);
        log.debug("Generated sale transaction code: {}", newName);

        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            log.info("Transaction status is COMPLETE, deducting stock from batches");
            deductStockFromBatch(dto.getDetail());
        }

        SaleTransaction savedTransaction = saleTransactionRepository.save(transaction);
        log.info("Sale transaction saved successfully with ID: {}", savedTransaction.getId());

        /// status tạo ban đầu có thể là COMPLETE không
        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            log.info("Handling debt note for completed transaction");
            handleCompleteStatus(savedTransaction);
        }
    }

    @Override
    @Transactional
    public void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto) {
        log.info("Updating sale transaction with ID: {}, status: {}", id, dto.getStatus());

        saleTransactionValidator.validate(dto);

        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Sale transaction not found with ID: {}", id);
                    return new SaleTransactionNotFoundException("Transaction not found with ID: " + id);
                });

        if (transaction.getStatus() != SaleTransactionStatus.DRAFT) {
            log.warn("Attempted to update non-DRAFT transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "cập nhật");
        }

        mapDtoToTransaction(transaction, dto, null); // Không update createdBy khi update

        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            log.info("Updated transaction status is COMPLETE, deducting stock from batches");
            deductStockFromBatch(dto.getDetail());
        }

        saleTransactionRepository.save(transaction);
        log.info("Sale transaction with ID: {} updated successfully", id);

        /// status tạo ban đầu có thể là COMPLETE không
        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            log.info("Handling debt note for completed transaction");
            handleCompleteStatus(transaction);
        }
    }

    @Override
    public Page<SaleTransactionResponseDto> getAll(String name,
                                                   String customerName,
                                                   String storeName,
                                                   SaleTransactionStatus status,
                                                   LocalDateTime fromDate,
                                                   LocalDateTime toDate,
                                                   BigDecimal minTotalAmount,
                                                   BigDecimal maxTotalAmount,
                                                   BigDecimal minPaidAmount,
                                                   BigDecimal maxPaidAmount,
                                                   String note,
                                                   Long createdBy,
                                                   Pageable pageable) {

        Specification<SaleTransaction> spec = SaleTransactionSpecification.buildSpecification(
                name, customerName, storeName, status, fromDate, toDate,
                minTotalAmount, maxTotalAmount, minPaidAmount, maxPaidAmount, note, createdBy
        );

        Page<SaleTransaction> entityPage = saleTransactionRepository.findAll(spec, pageable);

        List<SaleTransactionResponseDto> dtoList = entityPage.getContent().stream()
                .map(entity -> saleTransactionMapper.toResponseDto(entity, objectMapper))
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, entityPage.getTotalElements());
    }

    @Override
    @Transactional
    @LogStatusChange
    public void complete(Long id) {
        var transaction = saleTransactionRepository.findById(id)
            .orElseThrow(() -> new SaleTransactionNotFoundException("Not found"));

        if (transaction.getStatus() != SaleTransactionStatus.WAITING_FOR_APPROVE) {
            log.warn("Attempted to complete non-WAITING_FOR_APPROVE transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "WAITING_FOR_APPROVE", "hoàn thành phiếu");
        }
        // Parse detail từ JSON để trừ stock
        List<ProductSaleResponseDto> detailList = parseTransactionDetail(transaction.getDetail());
        if (!detailList.isEmpty()) {
            log.info("Transaction completed, deducting stock from {} batches", detailList.size());
            deductStockFromBatch(detailList);
        }
        transaction.setStatus(SaleTransactionStatus.COMPLETE);
        saleTransactionRepository.save(transaction);
        handleCompleteStatus(transaction);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    @LogStatusChange
    public void cancel(Long id) {
        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImportTransaction not found with id: " + id));

        SaleTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(SaleTransactionStatus.CANCEL);
        // updatedAt sẽ tự động cập nhật nhờ @UpdateTimestamp
        saleTransactionRepository.save(transaction);

        log.info("Sale transaction cancelled successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    public void open(Long id) {
        log.info("Opening Sale transaction with ID: {}", id);

        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new com.farmovo.backend.exceptions.ResourceNotFoundException("SaleTransaction not found with id: " + id));

        if (transaction.getStatus() != SaleTransactionStatus.DRAFT) {
            log.warn("Attempted to open non-DRAFT transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "mở phiếu");
        }

        SaleTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(SaleTransactionStatus.WAITING_FOR_APPROVE);
        saleTransactionRepository.save(transaction);

        log.info("Sale transaction opened successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    public void close(Long id) {
        log.info("Closing Sale transaction with ID: {}", id);

        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new com.farmovo.backend.exceptions.ResourceNotFoundException("SaleTransaction not found with id: " + id));

        if (transaction.getStatus() != SaleTransactionStatus.WAITING_FOR_APPROVE) {
            log.warn("Attempted to close non-WAITING_FOR_APPROVE transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "WAITING_FOR_APPROVE", "đóng phiếu");
        }

        SaleTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(SaleTransactionStatus.DRAFT);
        saleTransactionRepository.save(transaction);

        log.info("Sale transaction closed successfully. ID: {}, Old status: {}, New status: {}",
                id, oldStatus, transaction.getStatus());
    }

    @Override
    public String getNextSaleTransactionCode() {
        Long lastId = saleTransactionRepository.findTopByOrderByIdDesc()
                .map(SaleTransaction::getId)
                .orElse(0L);
        return String.format("PB%06d", lastId + 1);
    }

    @Override
    public void softDeleteSaleTransaction(Long id, Long userId) {
        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu bán với ID: " + id));

        transaction.setDeletedAt(LocalDateTime.now());
        transaction.setDeletedBy(userId);

        saleTransactionRepository.save(transaction);
    }

    @Override
    public SaleTransactionResponseDto getById(Long id) {
        log.debug("Getting sale transaction by ID: {}", id);

        SaleTransaction entity = saleTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Sale transaction not found with ID: {}", id);
                    return new SaleTransactionNotFoundException("Sale transaction not found with ID: " + id);
                });

        SaleTransactionResponseDto result = saleTransactionMapper.toResponseDto(entity, objectMapper);
        log.debug("Retrieved sale transaction with ID: {}", id);
        return result;
    }

    @Override
    public byte[] exportPdf(Long id) {
        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Load font Roboto từ file tạm (bắt buộc để dùng IDENTITY_H)
            ClassPathResource fontResource = new ClassPathResource("fonts/Roboto-Regular.ttf");
            File tempFontFile = File.createTempFile("roboto", ".ttf");
            tempFontFile.deleteOnExit();
            try (InputStream in = fontResource.getInputStream(); OutputStream os = new FileOutputStream(tempFontFile)) {
                in.transferTo(os);
            }

            BaseFont baseFont = BaseFont.createFont(
                    tempFontFile.getAbsolutePath(),
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED
            );

            Font normalFont = new Font(baseFont, 12);
            Font boldFont = new Font(baseFont, 12, Font.BOLD);
            Font redFont = new Font(baseFont, 12, Font.BOLD);
            Font blueFont = new Font(baseFont, 12, Font.BOLD);

            // ===== Tiêu đề =====
            LocalDateTime createdAt = transaction.getCreatedAt();
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String formattedTime = createdAt != null ? createdAt.format(timeFormatter) : "";
            String formattedDate = createdAt != null ? createdAt.format(dateFormatter) : "";

            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{2f, 1f});
            headerTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            PdfPCell titleCell = new PdfPCell(new Phrase("CHI TIẾT PHIẾU BÁN HÀNG " + safe(transaction.getName()), new Font(baseFont, 14, Font.BOLD)));
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
            if (transaction.getStatus() == SaleTransactionStatus.COMPLETE) {
                document.add(new Paragraph("✔ Phiếu hoàn thành", normalFont));
            }

            // ===== Thông tin cửa hàng & khách hàng =====
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingBefore(10f);
            infoTable.setSpacingAfter(10f);
            infoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            PdfPCell storeCell = new PdfPCell();
            storeCell.setBorder(Rectangle.NO_BORDER);
            storeCell.addElement(new Paragraph("Thông tin cửa hàng", boldFont));
            storeCell.addElement(new Paragraph("Tên cửa hàng: " + safe(transaction.getStore() != null ? transaction.getStore().getStoreName() : null), normalFont));
            // Người tạo
            String nguoiTao = "Chưa có";
            try {
                if (transaction.getCreatedBy() != null) {
                    User staff = getStaff(transaction.getCreatedBy());
                    nguoiTao = staff != null && staff.getFullName() != null ? staff.getFullName() : "Chưa có";
                }
            } catch (Exception e) {
                nguoiTao = "Chưa có";
            }
            storeCell.addElement(new Paragraph("Người tạo: " + nguoiTao, normalFont));
            storeCell.addElement(new Paragraph("Địa chỉ: " + safe(transaction.getStore() != null ? transaction.getStore().getStoreAddress() : null), normalFont));

            PdfPCell customerCell = new PdfPCell();
            customerCell.setBorder(Rectangle.NO_BORDER);
            customerCell.addElement(new Paragraph("Thông tin khách hàng", boldFont));
            customerCell.addElement(new Paragraph("Tên khách hàng: " + safe(transaction.getCustomer() != null ? transaction.getCustomer().getName() : null), normalFont));
            customerCell.addElement(new Paragraph("Số điện thoại: " + safe(transaction.getCustomer() != null ? transaction.getCustomer().getPhone() : null), normalFont));
            customerCell.addElement(new Paragraph("Địa chỉ: " + safe(transaction.getCustomer() != null ? transaction.getCustomer().getAddress() : null), normalFont));

            infoTable.addCell(storeCell);
            infoTable.addCell(customerCell);

            document.add(infoTable);

            // ===== Danh sách sản phẩm =====
            PdfPTable productTable = new PdfPTable(6);
            productTable.setWidthPercentage(100);
            productTable.setSpacingBefore(10);
            productTable.setWidths(new float[]{0.8f, 3f, 1.5f, 2f, 1.2f, 2.5f});

            productTable.addCell(getCell("STT", boldFont));
            productTable.addCell(getCell("Tên sản phẩm", boldFont));
            productTable.addCell(getCell("Mã", boldFont));
            productTable.addCell(getCell("Đơn giá", boldFont));
            productTable.addCell(getCell("Số lượng", boldFont));
            productTable.addCell(getCell("Thành tiền", boldFont));

            // Parse detail an toàn
            List<ProductSaleResponseDto> detailList = parseTransactionDetail(transaction.getDetail());


            int index = 1;
            for (ProductSaleResponseDto d : detailList) {
                java.math.BigDecimal unitPrice = d.getUnitSalePrice() != null ? d.getUnitSalePrice() : java.math.BigDecimal.ZERO;
                int quantity = d.getQuantity();
                java.math.BigDecimal lineTotal = unitPrice.multiply(java.math.BigDecimal.valueOf(quantity));
                productTable.addCell(getCell(String.valueOf(index++), normalFont));
                productTable.addCell(getCell(safe(d.getProductName()), normalFont));
                productTable.addCell(getCell(safe(d.getProductCode()), normalFont));
                productTable.addCell(getCell(formatCurrency(unitPrice), normalFont));
                productTable.addCell(getCell(String.valueOf(quantity), normalFont));
                productTable.addCell(getCell(formatCurrency(lineTotal), normalFont));
            }

            document.add(productTable);

            // ===== Tổng tiền + Ghi chú =====
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingBefore(10);
            summaryTable.setWidths(new float[]{1f, 1f});

            // ===== Cột trái: Tổng tiền =====
            PdfPCell totalCell = new PdfPCell();
            totalCell.setBorder(Rectangle.NO_BORDER);
            java.math.BigDecimal totalAmount = transaction.getTotalAmount() != null ? transaction.getTotalAmount() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal paidAmount = transaction.getPaidAmount() != null ? transaction.getPaidAmount() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal remainAmount = totalAmount.subtract(paidAmount);
            totalCell.addElement(new Paragraph("Tổng tiền hàng: " + formatCurrency(totalAmount), normalFont));
            totalCell.addElement(new Paragraph("Số tiền đã trả: " + formatCurrency(paidAmount), blueFont));
            totalCell.addElement(new Paragraph("Còn lại: " + formatCurrency(remainAmount), redFont));

            // ===== Cột phải: Ghi chú =====
            PdfPCell noteCell = new PdfPCell();
            noteCell.setBorder(Rectangle.NO_BORDER);
            if (transaction.getSaleTransactionNote() != null && !transaction.getSaleTransactionNote().isEmpty()) {
                noteCell.addElement(new Paragraph("Ghi chú:", boldFont));
                noteCell.addElement(new Paragraph(transaction.getSaleTransactionNote(), normalFont));
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
            throw new RuntimeException("Lỗi khi tạo PDF: " + e.getMessage(), e);
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

    private User getStaff(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Staff not found with ID: {}", id);
                    return new com.farmovo.backend.exceptions.ResourceNotFoundException("Staff not found with ID: " + id);
                });
    }

    private String generateTransactionCode() {
        Long lastId = saleTransactionRepository.findTopByOrderByIdDesc()
                .map(SaleTransaction::getId)
                .orElse(0L);
        return String.format("PB%06d", lastId + 1);
    }


    private void mapDtoToTransaction(SaleTransaction transaction, CreateSaleTransactionRequestDto dto, Long userId) {
        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());
        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setStatus(dto.getStatus() != null ? dto.getStatus() : SaleTransactionStatus.DRAFT);
        if (userId != null) {
            transaction.setCreatedBy(userId);
        }
        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail);
            log.debug("Transaction details serialized to JSON successfully");
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize transaction details to JSON", e);
            throw new BadRequestException("Không thể chuyển danh sách sản phẩm sang JSON.");
        }
        transaction.setCustomer(customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> {
                    log.error("Customer not found with ID: {}", dto.getCustomerId());
                    return new CustomerNotFoundException("Customer not found with ID: " + dto.getCustomerId());
                }));
        transaction.setStore(storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> {
                    log.error("Store not found with ID: {}", dto.getStoreId());
                    return new StoreNotFoundException("Store not found with ID: " + dto.getStoreId());
                }));
    }

    private void handleCompleteStatus(SaleTransaction transaction) {
        BigDecimal paidAmount = transaction.getPaidAmount() != null ? transaction.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = transaction.getTotalAmount() != null ? transaction.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal rawDebtAmount = paidAmount.subtract(totalAmount);  // raw = paid - total
        if (rawDebtAmount.compareTo(BigDecimal.ZERO) != 0) {
            String debtType = rawDebtAmount.compareTo(BigDecimal.ZERO) < 0 ? "-" : "+";
            BigDecimal debtAmount = rawDebtAmount.abs();  // Đã có, giữ luôn dương
            debtNoteService.createDebtNoteFromTransaction(
                    transaction.getCustomer().getId(),
                    debtAmount,
                    "SALE",
                    debtType,
                    transaction.getId(),
                    transaction.getStore().getId()
            );
            log.info("Created debt note for sale transaction ID: {} with debt amount: {} (type: {})", transaction.getId(), debtAmount, debtType);
        }
    }

    private void deductStockFromBatch(List<ProductSaleResponseDto> items) {
        log.info("Deducting stock from {} batches", items.size());

        for (ProductSaleResponseDto item : items) {
            log.debug("Processing batch ID: {}, product ID: {}, quantity: {}",
                    item.getId(), item.getProId(), item.getQuantity());

            ImportTransactionDetail batch = importTransactionDetailRepository.findById(item.getId())
                    .orElseThrow(() -> {
                        log.error("Batch not found with ID: {}", item.getId());
                        return new ResourceNotFoundException("Batch not found with ID: " + item.getId());
                    });

            if (!batch.getProduct().getId().equals(item.getProId())) {
                log.error("Batch ID: {} does not belong to product ID: {}", item.getId(), item.getProId());
                throw new BadRequestException("Batch does not belong to selected product (productId=" + item.getProId() + ")");
            }

            if (batch.getRemainQuantity() < item.getQuantity()) {
                log.error("Insufficient stock in batch ID: {}, available: {}, required: {}",
                        item.getId(), batch.getRemainQuantity(), item.getQuantity());
                throw new BadRequestException("Not enough stock in batch ID: " + item.getId() +
                        " (available=" + batch.getRemainQuantity() + ", required=" + item.getQuantity() + ")");
            }

            int oldQuantity = batch.getRemainQuantity();
            batch.setRemainQuantity(batch.getRemainQuantity() - item.getQuantity());
            importTransactionDetailRepository.save(batch);

            log.info("Deducted {} units from batch ID: {}, remaining: {} (was: {})",
                    item.getQuantity(), item.getId(), batch.getRemainQuantity(), oldQuantity);
        }
    }

    private List<ProductSaleResponseDto> parseTransactionDetail(String detailJson) {
        List<ProductSaleResponseDto> detailList = new ArrayList<>();
        try {
            if (detailJson != null && !detailJson.isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
                detailList = mapper.readValue(
                        detailJson,
                        new TypeReference<List<ProductSaleResponseDto>>() {}
                );
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse transaction detail JSON: {}", e.getMessage());
            throw new BadRequestException("Không thể parse danh sách sản phẩm từ JSON.");
        }
        return detailList;
    }

    @Override
    public List<SaleTransaction> findRecentSales(PageRequest pageRequest) {
        return saleTransactionRepository.findRecentSales(pageRequest);
    }
}
