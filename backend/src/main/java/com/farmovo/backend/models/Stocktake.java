package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Stocktake")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stocktake {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "storeID", nullable = false)
    private Store store;

    @ManyToOne
    @JoinColumn(name = "zoneID", nullable = false)
    private Zone zone;

    @ManyToOne
    @JoinColumn(name = "productID", nullable = false)
    private Product product;

    @Column(name = "stocktake_date", nullable = false)
    private LocalDate stocktakeDate;

    @Column(name = "actual_quantity")
    private Integer actualQuantity;

    @Column(name = "recorded_quantity")
    private Integer recordedQuantity;

    @Column(name = "difference")
    private Integer difference;

    @Column(name = "note", length = 1000)
    private String note;

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