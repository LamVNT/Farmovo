package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "stocktakes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Stocktake extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", length = 20, unique = true)
    private String name;

    @Column(name = "stocktake_date", nullable = false)
    private Instant stocktakeDate;

    @Lob //lưu JSON các dòng kiểm kê(lưu JSON dài)
    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "stocktake_note", length = 1000)
    private String stocktakeNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private StocktakeStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;
}