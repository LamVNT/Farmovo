package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "import_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ImportTransaction extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private ImportTransactionStatus status;

    @Column(name = "import_transaction_note", length = 1000)
    private String importTransactionNote;

    @Column(name = "import_date", nullable = false)
    private LocalDateTime importDate;

    @Column(name = "name", unique = true, length = 20)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Customer supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @OneToMany(mappedBy = "importTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImportTransactionDetail> details;
}