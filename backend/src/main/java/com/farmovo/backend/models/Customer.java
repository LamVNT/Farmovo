package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {
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

    @Column(name = "customer_role", length = 50)
    private String role;

    @Column(name = "total_debt_amount")
    private BigDecimal totalDebt;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;


    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DebtNote> debtNotes;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<ImportTransaction> importTransactions;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<SaleTransaction> saleTransactions;
}