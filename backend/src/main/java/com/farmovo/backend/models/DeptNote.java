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
@Table(name = "Dept_Note")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeptNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customerID")
    private Customer customer;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "dept_date")
    private LocalDateTime deptDate;

    @ManyToOne
    @JoinColumn(name = "storeID")
    private Store store;

    @Column(name = "type", length = 50)
    private String type;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "evidences", length = 1000)
    private String evidences;

    @Column(name = "from_source", length = 255)
    private String fromSource;

    @Column(name = "sourceID")
    private Long sourceId;

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