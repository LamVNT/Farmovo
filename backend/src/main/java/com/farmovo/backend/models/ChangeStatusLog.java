package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "changestatuslogs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ChangeStatusLog extends Base {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "model_id")
    private Long modelID;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "next_status")
    private String nextStatus;

    @Column(name = "description")
    private String description;
}
