    package com.farmovo.backend.models;

    import jakarta.persistence.*;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.EqualsAndHashCode;
    import lombok.NoArgsConstructor;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;

    @Entity
    @Table(name = "import_transaction_details")
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public class ImportTransactionDetail extends Base {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "id")
        private Long id;

        @Column(name = "import_quantity")
        private Integer importQuantity;

        @Column(name = "remain_quantity")
        private Integer remainQuantity;

        @Column(name = "expire_date")
        private LocalDateTime expireDate;

        @Column(name = "unit_import_price")
        private BigDecimal unitImportPrice;

        @Column(name = "unit_sale_price")
        private BigDecimal unitSalePrice;

        @Column(name = "zones_id")
        private String zones_id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "import_transaction_id")
        private ImportTransaction importTransaction;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "product_id")
        private Product product;
    }