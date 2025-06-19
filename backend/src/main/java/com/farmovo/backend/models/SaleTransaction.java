package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Sale_Transaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customerID")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "storeID")
    private Store store;

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
}
