package com.spenva.backend.repository;

import com.spenva.backend.entity.Expense;
import com.spenva.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);
}