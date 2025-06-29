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
        try {
            logger.info("Creating debt note for customer ID: {}", requestDto.getCustomerId());
            DebtNoteResponseDto responseDto = debtNoteService.createDebtNote(requestDto, createdBy);
            return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            logger.error("Error creating debt note: {}", e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DebtNoteResponseDto> getDebtNoteById(@PathVariable Long id) {
        try {
            logger.info("Fetching debt note with ID: {}", id);
            DebtNoteResponseDto responseDto = debtNoteService.getDebtNoteById(id);
            return new ResponseEntity<>(responseDto, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching debt note: {}", e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping
    public ResponseEntity<List<DebtNoteResponseDto>> getAllDebtNotes() {
        logger.info("Fetching all debt notes");
        List<DebtNoteResponseDto> responseDtos = debtNoteService.getAllDebtNotes();
        return new ResponseEntity<>(responseDtos, HttpStatus.OK);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<DebtNoteResponseDto>> getDebtNotesByCustomerId(@PathVariable Long customerId) {
        logger.info("Fetching debt notes for customer ID: {}", customerId);
        List<DebtNoteResponseDto> responseDtos = debtNoteService.getDebtNotesByCustomerId(customerId);
        return new ResponseEntity<>(responseDtos, HttpStatus.OK);
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<DebtNoteResponseDto>> getDebtNotesByStoreId(@PathVariable Long storeId) {
        logger.info("Fetching debt notes for store ID: {}", storeId);
        List<DebtNoteResponseDto> responseDtos = debtNoteService.getDebtNotesByStoreId(storeId);
        return new ResponseEntity<>(responseDtos, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DebtNoteResponseDto> updateDebtNote(@PathVariable Long id,
                                                              @RequestBody DebtNoteRequestDto requestDto) {
        try {
            logger.info("Updating debt note with ID: {}", id);
            DebtNoteResponseDto responseDto = debtNoteService.updateDebtNote(id, requestDto);
            return new ResponseEntity<>(responseDto, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating debt note: {}", e.getMessage());
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteDebtNote(@PathVariable Long id,
                                                   @RequestParam Long deletedBy) {
        try {
            logger.info("Soft deleting debt note with ID: {}", id);
            debtNoteService.softDeleteDebtNote(id, deletedBy);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (IllegalArgumentException e) {
            logger.error("Error soft deleting debt note: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}