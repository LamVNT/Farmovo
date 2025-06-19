package com.farmovo.backend.models;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Entity
@Table(name = "Status_Log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model", length = 255)
    private String model;

    @Column(name = "model_id")
    private Long modelId;

    @Column(name = "previous_status", length = 100)
    private String previousStatus;

    @Column(name = "next_status", length = 100)
    private String nextStatus;

    @Column(name = "description", length = 1000)
    private String description;

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
