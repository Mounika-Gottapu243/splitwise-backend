package com.spenva.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER,
            cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "friend_id", nullable = false)
    private Friend friend;



    private String description;

    private double amount;

    private String splitType;

    private String paidBy;

    private String notes;

    private LocalDateTime dateTime;

    @Column(nullable = true)
    private Double yourShares = 1.0;

    @Column(nullable = true)
    private Double friendShares = 1.0;

    @Column(nullable = true)
    private Double yourAdjustment = 0.0;

    @Column(nullable = true)
    private Double friendAdjustment = 0.0;
}