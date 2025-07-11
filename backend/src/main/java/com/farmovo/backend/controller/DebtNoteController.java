package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.services.DebtNoteService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/debt/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class DebtNoteController {

    private static final Logger logger = LogManager.getLogger(DebtNoteController.class);
    private final DebtNoteService debtNoteService;

    @GetMapping("/customer/{customerId}/debt-notes")
    public ResponseEntity<List<DebtNoteResponseDto>> getDebtNotes(@PathVariable Long customerId) {
        logger.debug("Received request to get debt notes for customer ID: {}", customerId);
        List<DebtNoteResponseDto> debtNotes = debtNoteService.findDebtNotesByCustomerId(customerId);
        logger.info("Successfully retrieved {} debt notes for customer ID: {}", debtNotes.size(), customerId);
        return ResponseEntity.ok(debtNotes);
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
    public ResponseEntity<String> uploadEvidence(@RequestParam("file") MultipartFile file) throws IOException {
        logger.debug("Received request to upload evidence file: {}", file.getOriginalFilename());
        if (file.isEmpty()) {
            logger.error("Uploaded file is empty");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("File is empty");
        }
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path path = Paths.get("uploads/" + fileName);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());
        logger.info("Successfully uploaded evidence file: {}", fileName);
        return ResponseEntity.ok(fileName);
    }
}