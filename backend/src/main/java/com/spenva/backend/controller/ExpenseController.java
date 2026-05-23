package com.spenva.backend.controller;

import com.spenva.backend.dto.ExpenseCalculationRequest;
import com.spenva.backend.dto.ExpenseCalculationResult;

import com.spenva.backend.entity.Expense;
import com.spenva.backend.entity.Friend;
import com.spenva.backend.entity.User;

import com.spenva.backend.repository.ExpenseRepository;
import com.spenva.backend.repository.FriendRepository;
import com.spenva.backend.repository.UserRepository;

import com.spenva.backend.service.ExpenseService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public List<Expense> getAllExpenses() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmailOrUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return expenseRepository.findByUser(user);
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Expense expense) {

        try {

            Authentication authentication =
                    SecurityContextHolder.getContext().getAuthentication();

            String email = authentication.getName();

            User user = userRepository.findByEmailOrUsername(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (expense.getFriend() != null) {

                Friend assignedFriend;

                if (expense.getFriend().getId() != null) {

                    assignedFriend = friendRepository.findById(
                                    expense.getFriend().getId())
                            .orElseThrow(() ->
                                    new RuntimeException("Friend not found"));

                }
                else if (expense.getFriend().getEmail() != null) {

                    String formattedEmail =
                            expense.getFriend()
                                    .getEmail()
                                    .toLowerCase()
                                    .trim();

                    Optional<Friend> existingFriendOpt =
                            friendRepository.findByUserAndEmail(user, formattedEmail);

                    if (existingFriendOpt.isPresent()) {

                        assignedFriend = existingFriendOpt.get();

                    } else {

                        Friend newFriend = expense.getFriend();

                        newFriend.setUser(user);

                        assignedFriend = friendRepository.save(newFriend);
                    }

                } else {

                    return ResponseEntity.badRequest()
                            .body("Error: Friend profile missing identifier.");
                }

                expense.setFriend(assignedFriend);

            } else {

                return ResponseEntity.badRequest()
                        .body("Error: Missing friend assignment.");
            }

            expense.setUser(user);

            Expense savedExpense = expenseRepository.save(expense);

            return ResponseEntity.ok(savedExpense);

        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                    .body("Failed to process expense: " + e.getMessage());
        }
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateSplit(
            @RequestBody ExpenseCalculationRequest request) {

        if (request.getAmount() <= 0) {
            return ResponseEntity.badRequest()
                    .body("Amount must be greater than 0");
        }

        ExpenseCalculationResult result =
                expenseService.calculateSplit(request);

        if (result.getYouPay() == -1) {
            return ResponseEntity.badRequest()
                    .body("Adjustments exceed total amount");
        }

        return ResponseEntity.ok(result);
    }
}