package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ImportTransactionDetailServiceImpl implements ImportTransactionDetailService {

    @Autowired
    private ImportTransactionDetailRepository detailRepository;

    @Override
    public List<ImportTransactionDetail> findByProductId(Long productId) {
        return detailRepository.findByProductId(productId);
    }
}
