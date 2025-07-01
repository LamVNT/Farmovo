package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.services.DebtNoteService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debts")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class DebtNoteController {
    private static final Logger logger = LogManager.getLogger(DebtNoteController.class);

    @Autowired
    private DebtNoteService debtNoteService;

    @PostMapping
    public ResponseEntity<DebtNoteResponseDto> createDebtNote(@RequestBody DebtNoteRequestDto requestDto,
                                                              @RequestParam Long createdBy) {
        logger.info("Creating debt note for customer ID: {}", requestDto.getCustomerId());
        DebtNoteResponseDto responseDto = debtNoteService.createDebtNote(requestDto, createdBy);
        return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DebtNoteResponseDto> getDebtNoteById(@PathVariable Long id) {
        logger.info("Fetching debt note with ID: {}", id);
        DebtNoteResponseDto responseDto = debtNoteService.getDebtNoteById(id);
        return new ResponseEntity<>(responseDto, HttpStatus.OK);
    }

    @GetMapping("/debt-list")
    public ResponseEntity<List<DebtNoteResponseDto>> getAllDebtNotes() {
        logger.info("Fetching all debt notes from table 'debt_notes'");
        return new ResponseEntity<>(debtNoteService.getAllDebtNotes().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @GetMapping("/debtors")
    public ResponseEntity<List<DebtNoteResponseDto>> getAllDebtors() {
        logger.info("Fetching all debtors from table 'debt_notes'");
        return new ResponseEntity<>(debtNoteService.getAllDebtors().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<DebtNoteResponseDto>> getDebtNotesByCustomerId(@PathVariable Long customerId) {
        logger.info("Fetching debt notes for customer ID: {}", customerId);
        return new ResponseEntity<>(debtNoteService.getDebtNotesByCustomerId(customerId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<DebtNoteResponseDto>> getDebtNotesByStoreId(@PathVariable Long storeId) {
        logger.info("Fetching debt notes for store ID: {}", storeId);
        return new ResponseEntity<>(debtNoteService.getDebtNotesByStoreId(storeId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DebtNoteResponseDto> updateDebtNote(@PathVariable Long id,
                                                              @RequestBody DebtNoteRequestDto requestDto) {
        logger.info("Updating debt note with ID: {}", id);
        DebtNoteResponseDto responseDto = debtNoteService.updateDebtNote(id, requestDto);
        return new ResponseEntity<>(responseDto, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteDebtNote(@PathVariable Long id,
                                                   @RequestParam Long deletedBy) {
        logger.info("Soft deleting debt note with ID: {}", id);
        debtNoteService.softDeleteDebtNote(id, deletedBy);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    private DebtNoteResponseDto convertToResponseDTO(DebtNoteResponseDto dto) {
        return dto; // Pass-through method; can be enhanced if additional mapping is needed
    }
}