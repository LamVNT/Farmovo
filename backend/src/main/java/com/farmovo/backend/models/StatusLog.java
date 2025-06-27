package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "status_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
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

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}