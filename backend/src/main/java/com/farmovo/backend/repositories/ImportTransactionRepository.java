package com.farmovo.backend.repositories;


import com.farmovo.backend.models.ImportTransaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImportTransactionRepository extends JpaRepository<ImportTransaction, Long> {
    @EntityGraph(attributePaths = {
            "details",          // chi tiết phiếu nhập
            "details.product",  // thông tin sản phẩm trong chi tiết
            "supplier",         // khách hàng
            "store",            // kho nhập
            "staff"             // người tạo
    })
    Optional<ImportTransaction> findById(Long id);

    Optional<ImportTransaction> findTopByOrderByIdDesc();
}
