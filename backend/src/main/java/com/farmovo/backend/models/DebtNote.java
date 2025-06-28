package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "debt_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class DebtNote extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "debt_amount")
    private BigDecimal debtAmount;

    @Column(name = "debt_date")
    private LocalDateTime debtDate;

    @Column(name = "debt_type", length = 50)
    private String debtType;

    @Column(name = "debt_description", length = 1000)
    private String debtDescription;

    @Column(name = "debt_evidences", length = 1000)
    private String debtEvidences;

    @Column(name = "from_source", length = 255)
    private String fromSource;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "updated_by")
    private Long updatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;
}