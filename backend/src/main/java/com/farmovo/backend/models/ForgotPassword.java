package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "forgot_password")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForgotPassword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(nullable = false)
    private Integer otp;

    @Column(nullable = false)
    private Date expirationTime;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;
}
