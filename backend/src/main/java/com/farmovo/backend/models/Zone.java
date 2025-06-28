package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "zones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Zone extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "zone_name", length = 100)
    private String zoneName;

    @Column(name = "zone_description", length = 1000)
    private String zoneDescription;

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL)
    private List<Stocktake> stocktakes;
}