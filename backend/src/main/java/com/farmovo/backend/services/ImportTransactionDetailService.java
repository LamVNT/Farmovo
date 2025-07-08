package com.farmovo.backend.services;

import com.farmovo.backend.models.ImportTransactionDetail;

import java.util.List;

public interface ImportTransactionDetailService {

    List<ImportTransactionDetail> findByProductId(Long productId);
}
