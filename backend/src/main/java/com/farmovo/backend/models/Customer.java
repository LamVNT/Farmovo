package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @Column(name = "total_dept_amount")
    private BigDecimal totalDept;

    @Column(name = "create_by")
    private Long createBy;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

    @Column(name = "update_By")
    private LocalDateTime updateBy;


    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeptNote> deptNotes;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<ImportTransaction> importTransactions;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<SaleTransaction> saleTransactions;
}