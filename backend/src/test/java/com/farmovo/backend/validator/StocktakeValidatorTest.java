package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.models.StocktakeDetail;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StocktakeValidatorTest {
    @Test
    void validateRequest_missingStocktakeDate_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of());
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(new StocktakeDetail())))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("stocktakeDate is required");
    }

    @Test
    void validateRequest_missingStoreId_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStatus("DRAFT");
        req.setDetail(List.of());
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(new StocktakeDetail())))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("storeId is required");
    }

    @Test
    void validateRequest_missingDetail_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(null);
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(new StocktakeDetail())))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("detail is required");
    }

    @Test
    void validateRequest_missingStatus_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setDetail(List.of());
        req.setStatus(null);
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(new StocktakeDetail())))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("status is required");
    }

    @Test
    void validateRequest_detailsNullOrEmpty_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of(new com.farmovo.backend.dto.response.StocktakeDetailDto()));
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, null))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("detail must contain at least one item");
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("detail must contain at least one item");
    }

    @Test
    void validateRequest_detailItemMissingProductId_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of(new com.farmovo.backend.dto.response.StocktakeDetailDto()));
        StocktakeDetail detail = new StocktakeDetail();
        detail.setProductId(null);
        detail.setZones_id(List.of("1"));
        detail.setReal(10);
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(detail)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("productId");
    }

    @Test
    void validateRequest_detailItemMissingZonesId_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of(new com.farmovo.backend.dto.response.StocktakeDetailDto()));
        StocktakeDetail detail = new StocktakeDetail();
        detail.setProductId(1L);
        detail.setZones_id(null);
        detail.setReal(10);
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(detail)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("zones_id");
    }

    @Test
    void validateRequest_detailItemMissingReal_shouldThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of(new com.farmovo.backend.dto.response.StocktakeDetailDto()));
        StocktakeDetail detail = new StocktakeDetail();
        detail.setProductId(1L);
        detail.setZones_id(List.of("1"));
        detail.setReal(null);
        assertThatThrownBy(() -> StocktakeValidator.validateRequest(req, List.of(detail)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("real quantity");
    }

    @Test
    void validateRequest_validInput_shouldNotThrow() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of(new com.farmovo.backend.dto.response.StocktakeDetailDto()));
        StocktakeDetail detail = new StocktakeDetail();
        detail.setProductId(1L);
        detail.setZones_id(List.of("1"));
        detail.setReal(10);
        assertThatCode(() -> StocktakeValidator.validateRequest(req, List.of(detail))).doesNotThrowAnyException();
    }
} 