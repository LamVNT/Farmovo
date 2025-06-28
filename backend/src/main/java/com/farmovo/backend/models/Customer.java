package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Customer extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "customer_name", length = 255, nullable = false)
    private String name;

    @Column(name = "customer_email", length = 255)
    private String email;

    @Column(name = "customer_phone", length = 50)
    private String phone;

    @Column(name = "is_supplier")
    private Boolean isSupplier;

    @Column(name = "total_debt_amount")
    private BigDecimal totalDebt;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DebtNote> debtNotes;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<ImportTransaction> importTransactions;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<SaleTransaction> saleTransactions;
}