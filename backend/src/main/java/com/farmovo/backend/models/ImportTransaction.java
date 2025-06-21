package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "import_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "total")
    private BigDecimal total;

    @Column(name = "paid")
    private BigDecimal paid;

    @Column(name = "detail", length = 1000)
    private String detail;

    @Column(name = "note", length = 1000)
    private String note;

    @Column(name = "status", length = 50)
    private String status;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @OneToMany(mappedBy = "importTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImportTransactionDetail> details;
}