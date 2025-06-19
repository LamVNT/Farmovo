package com.farmovo.backend.models;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name = "Import_Transaction_Detail")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "import_transaction_id")
    private ImportTransaction importTransaction;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "remain_quantity")
    private Integer remainQuantity;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Column(name = "unit_import_price")
    private BigDecimal unitImportPrice;

    @Column(name = "unit_sale_price")
    private BigDecimal unitSalePrice;

    @Column(name = "create_by")
    private Long createBy;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

    @Column(name = "delete_at")
    private LocalDateTime deleteAt;

    @Column(name = "delete_by")
    private Long deleteBy;
}
