package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "zones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Zone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "zone_name", length = 100)
    private String zoneName;


    @Column(name = "zone_description", length = 1000)
    private String zoneDescription;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;


    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL)
    private List<ImportTransactionDetail> importTransactionDetails;

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL)
    private List<Stocktake> stocktakes;
}