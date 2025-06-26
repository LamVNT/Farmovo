package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "stores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "store_name", length = 255, nullable = false, unique = true)
    private String storeName;

    @Column(name = "store_description", length = 1000)
    private String storeDescription;

    @Column(name = "store_Address", length = 500)
    private String storeAddress;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "update_at")
    private LocalDateTime updateAt;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<Product> products;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<ImportTransaction> importTransactions;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<SaleTransaction> saleTransactions;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<Stocktake> stocktakes;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<DeptNote> deptNotes;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<User> users;
}