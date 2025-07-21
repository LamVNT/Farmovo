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
import java.util.HashMap;
import java.util.Map;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/debt/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class DebtNoteController {

    private static final Logger logger = LogManager.getLogger(DebtNoteController.class);
    private final DebtNoteService debtNoteService;
    private final S3Service s3Service;

    @GetMapping("/customer/{customerId}/debt-notes")
    public ResponseEntity<Map<String, Object>> getDebtNotes(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.debug("Received request to get debt notes for customer ID: {} page: {} size: {}", customerId, page, size);
        Page<DebtNoteResponseDto> pageResult = debtNoteService.getDebtNotesPage(customerId, page, size);
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber());
        response.put("totalItems", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());
        logger.info("Successfully retrieved {} debt notes for customer ID: {} (page {}/{})", pageResult.getNumberOfElements(), customerId, pageResult.getNumber() + 1, pageResult.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/debt-note")
    public ResponseEntity<DebtNoteResponseDto> addDebtNote(@RequestBody DebtNoteRequestDto requestDto) {
        logger.debug("Received request to add debt note: {}", requestDto);
        DebtNoteResponseDto debtNote = debtNoteService.addDebtNote(requestDto);
        logger.info("Successfully added debt note with ID: {} for customer ID: {}", debtNote.getId(), debtNote.getCustomerId());
        return ResponseEntity.status(HttpStatus.CREATED).body(debtNote);
    }

    @PutMapping("/debt-note/{debtId}")
    public ResponseEntity<DebtNoteResponseDto> updateDebtNote(
            @PathVariable Long debtId,
            @RequestBody DebtNoteRequestDto requestDto) {
        logger.debug("Received request to update debt note ID: {} with data: {}", debtId, requestDto);
        DebtNoteResponseDto debtNote = debtNoteService.updateDebtNote(debtId, requestDto);
        logger.info("Successfully updated debt note with ID: {}", debtId);
        return ResponseEntity.ok(debtNote);
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