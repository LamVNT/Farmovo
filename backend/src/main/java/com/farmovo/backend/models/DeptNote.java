package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dept_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeptNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "dept_amount")
    private BigDecimal deptAmount;

    @Column(name = "dept_date")
    private LocalDateTime deptDate;

    @Column(name = "dept_type", length = 50)
    private String deptType;

    @Column(name = "dept_description", length = 1000)
    private String deptDescription;

    @Column(name = "dept_evidences", length = 1000)
    private String deptEvidences;

    @Column(name = "from_source", length = 255)
    private String fromSource;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "create_by")
    private Long createBy;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

    @Column(name = "update_by")
    private LocalDateTime updateBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

}