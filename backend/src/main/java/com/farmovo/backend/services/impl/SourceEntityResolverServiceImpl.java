package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.SourceEntityInfo;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.SourceEntityResolverService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SourceEntityResolverServiceImpl implements SourceEntityResolverService {

    private static final Logger log = LogManager.getLogger(SourceEntityResolverServiceImpl.class);
    private final SaleTransactionRepository saleTransactionRepository;
    private final ImportTransactionRepository importTransactionRepository;
    private final StocktakeRepository stocktakeRepository;

    @Override
    @Cacheable(value = "sourceEntityInfo", key = "#modelName + '_' + #modelId")
    public SourceEntityInfo resolveSourceEntity(String modelName, Long modelId) {
        if (modelName == null || modelId == null) {
            log.warn("Invalid parameters: modelName={}, modelId={}", modelName, modelId);
            return createDefaultInfo("UNKNOWN", modelId);
        }

        try {
            switch (modelName.toUpperCase()) {
                case "SALETRANSACTION":
                    return resolveSaleTransaction(modelId);
                case "IMPORTTRANSACTION":
                    return resolveImportTransaction(modelId);
                case "STOCKTAKE":
                    return resolveStocktake(modelId);
                default:
                    log.warn("Unknown model name: {}", modelName);
                    return createDefaultInfo(modelName, modelId);
            }
        } catch (Exception e) {
            log.error("Error resolving source entity for modelName: {}, modelId: {}", modelName, modelId, e);
            return createDefaultInfo(modelName, modelId);
        }
    }

    private SourceEntityInfo resolveSaleTransaction(Long modelId) {
        try {
            Optional<SaleTransaction> transaction = saleTransactionRepository.findById(modelId);
            if (transaction.isPresent()) {
                SaleTransaction sale = transaction.get();
                return SourceEntityInfo.builder()
                        .sourceName(sale.getName())
                        .sourceType("SALE_TRANSACTION")
                        .sourceUrl("/sale-transactions/" + modelId)
                        .build();
            }
            log.warn("SaleTransaction not found with id: {}", modelId);
            return createDefaultInfo("SALETRANSACTION", modelId);
        } catch (Exception e) {
            log.error("Error resolving SaleTransaction with id: {}", modelId, e);
            return createDefaultInfo("SALETRANSACTION", modelId);
        }
    }

    private SourceEntityInfo resolveImportTransaction(Long modelId) {
        try {
            Optional<ImportTransaction> transaction = importTransactionRepository.findById(modelId);
            if (transaction.isPresent()) {
                ImportTransaction importTxn = transaction.get();
                return SourceEntityInfo.builder()
                        .sourceName(importTxn.getName())
                        .sourceType("IMPORT_TRANSACTION")
                        .sourceUrl("/import-transaction/" + modelId)
                        .build();
            }
            log.warn("ImportTransaction not found with id: {}", modelId);
            return createDefaultInfo("IMPORTTRANSACTION", modelId);
        } catch (Exception e) {
            log.error("Error resolving ImportTransaction with id: {}", modelId, e);
            return createDefaultInfo("IMPORTTRANSACTION", modelId);
        }
    }

    private SourceEntityInfo resolveStocktake(Long modelId) {
        try {
            Optional<Stocktake> stocktake = stocktakeRepository.findById(modelId);
            if (stocktake.isPresent()) {
                Stocktake st = stocktake.get();
                return SourceEntityInfo.builder()
                        .sourceName(st.getName())
                        .sourceType("STOCKTAKE")
                        .sourceUrl("/stocktakes/" + modelId)
                        .build();
            }
            log.warn("Stocktake not found with id: {}", modelId);
            return createDefaultInfo("STOCKTAKE", modelId);
        } catch (Exception e) {
            log.error("Error resolving Stocktake with id: {}", modelId, e);
            return createDefaultInfo("STOCKTAKE", modelId);
        }
    }

    private SourceEntityInfo createDefaultInfo(String modelName, Long modelId) {
        return SourceEntityInfo.builder()
                .sourceName("Unknown")
                .sourceType(modelName.toUpperCase())
                .sourceUrl("/" + modelName.toLowerCase() + "/" + modelId)
                .build();
    }
} 