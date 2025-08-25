package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.impl.S3Service;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import com.farmovo.backend.dto.request.PageResponse;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/debt/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://farmovo-frontend-h7esa8cxbsdqa3dd.southeastasia-01.azurewebsites.net",
        "https://farmovo.store",
        "https://www.farmovo.store",
        "https://farmovo.io.vn",
        "https://www.farmovo.io.vn"
}, allowedHeaders = "*", allowCredentials = "true")
public class DebtNoteController {

    private static final Logger logger = LogManager.getLogger(DebtNoteController.class);
    private final DebtNoteService debtNoteService;
    private final S3Service s3Service;

    @GetMapping("/customer/{customerId}/debt-notes")
    public ResponseEntity<PageResponse<DebtNoteResponseDto>> getDebtNotes(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String fromSource,
            @RequestParam(required = false) String debtType,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime toDate) {

        logger.debug("Debt notes search: cust={}, page={}, size={}, src={}, type={}, store={}, from={}, to={}", customerId, page, size, fromSource, debtType, storeId, fromDate, toDate);

        Page<DebtNoteResponseDto> pageResult = debtNoteService.findDebtNotesByCustomerIdPaged(customerId, fromSource, debtType, storeId, fromDate, toDate, page, size);
        PageResponse<DebtNoteResponseDto> response = PageResponse.fromPage(pageResult);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/debt-note")
    public ResponseEntity<DebtNoteResponseDto> addDebtNote(@RequestBody DebtNoteRequestDto requestDto) {
        logger.debug("Received request to add debt note: {}", requestDto);
        DebtNoteResponseDto debtNote = debtNoteService.addDebtNote(requestDto);
        logger.info("Successfully added debt note with ID: {} for customer ID: {}", debtNote.getId(), debtNote.getCustomerId());
        return ResponseEntity.status(HttpStatus.CREATED).body(debtNote);
    }



    @GetMapping("/customer/{customerId}/total-debt")
    public ResponseEntity<BigDecimal> getTotalDebt(@PathVariable Long customerId) {
        logger.debug("Received request to get total debt for customer ID: {}", customerId);
        BigDecimal totalDebt = debtNoteService.getTotalDebtByCustomerId(customerId);
        logger.info("Successfully retrieved total debt: {} for customer ID: {}", totalDebt, customerId);
        return ResponseEntity.ok(totalDebt);
    }

    @PostMapping("/upload-evidence")
    public ResponseEntity<String> uploadEvidence(@RequestParam("file") MultipartFile file) {
        try {
            String key = s3Service.uploadEvidence(file);  // Trả key
            return ResponseEntity.ok(key);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to upload: " + e.getMessage());
        }
    }

    // Thêm endpoint mới nếu cần
    @GetMapping("/presigned-evidence")
    public ResponseEntity<String> getPresignedEvidence(@RequestParam("key") String key) {
        try {
            String presignedUrl = s3Service.generatePresignedUrl(key);
            return ResponseEntity.ok(presignedUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to generate presigned URL: " + e.getMessage());
        }
    }
}