package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportTransactionDetailServiceImpl implements ImportTransactionDetailService {

    private static final Logger log = LogManager.getLogger(ImportTransactionDetailServiceImpl.class);

    private final ImportTransactionDetailRepository detailRepository;
    private final ProductMapper productMapper;

    @Override
    public List<ImportTransactionDetail> findByProductId(Long productId) {
        log.info("Finding import transaction details by productId: {}", productId);
        
        List<ImportTransactionDetail> result = detailRepository.findByProductId(productId);
        log.info("Found {} import transaction details for productId: {}", result.size(), productId);
        
        return result;
    }


}
