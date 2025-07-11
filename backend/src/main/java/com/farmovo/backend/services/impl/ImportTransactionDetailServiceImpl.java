package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ImportTransactionDetailServiceImpl implements ImportTransactionDetailService {

    @Autowired
    private ImportTransactionDetailRepository detailRepository;

    @Autowired
    private ProductMapper productMapper;

    @Override
    public List<ImportTransactionDetail> findByProductId(Long productId) {
        return detailRepository.findByProductId(productId);
    }

//    @Override
//    public List<ProductSaleResponseDto> getAllProductSaleDto() {
//        List<ImportTransactionDetail> details = detailRepository.findAllWithProductAndTransaction();
//        return details.stream()
//                .map(productMapper::toDtoSale)
//                .collect(Collectors.toList());
//    }

}
