package com.farmovo.backend.repositories;


import com.farmovo.backend.models.ImportTransaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ImportTransactionRepository extends JpaRepository<ImportTransaction, Long>,
        JpaSpecificationExecutor<ImportTransaction> {
    @EntityGraph(attributePaths = {
            "details",          // chi tiết phiếu nhập
            "details.product",  // thông tin sản phẩm trong chi tiết
            "supplier",         // khách hàng
            "store",            // kho nhập
            "staff"             // người tạo
    })
    Optional<ImportTransaction> findById(Long id);

    Optional<ImportTransaction> findTopByOrderByIdDesc();

    @Query("SELECT i FROM ImportTransaction i WHERE i.deletedAt IS NULL AND i.deletedBy IS NULL")
    List<ImportTransaction> findAllImportActive();

    @Query("SELECT i FROM ImportTransaction i WHERE i.deletedAt IS NULL AND i.deletedBy IS NULL AND i.store.id = :storeId")
    List<ImportTransaction> findAllImportActiveByStore(@org.springframework.data.repository.query.Param("storeId") Long storeId);

    @Query("SELECT i FROM ImportTransaction i WHERE i.deletedAt IS NULL AND i.deletedBy IS NULL ORDER BY i.importDate DESC")
    List<ImportTransaction> findRecentImports(org.springframework.data.domain.Pageable pageable);

    long countByStocktakeId(Long stocktakeId);
}
