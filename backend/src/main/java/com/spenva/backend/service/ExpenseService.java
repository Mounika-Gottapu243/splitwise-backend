package com.spenva.backend.service;
import com.spenva.backend.dto.DashboardDTO;
import com.spenva.backend.dto.ExpenseCalculationRequest;
import com.spenva.backend.dto.ExpenseCalculationResult;
import com.spenva.backend.dto.FriendBalanceDTO;
import com.spenva.backend.entity.Expense;
import com.spenva.backend.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    public Expense saveExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public DashboardDTO getDashboardData() {
        List<Expense> allExpenses = expenseRepository.findAll();

        Map<String, Double> emailBalances = new HashMap<>();
        Map<String, String> emailToNameMap = new HashMap<>();

        for (Expense expense : allExpenses) {
            if (expense.getFriend() == null) continue;

            String email = expense.getFriend().getEmail();
            String name = expense.getFriend().getName();
            if (email == null || email.trim().isEmpty()) continue;

            email = email.toLowerCase().trim();
            emailToNameMap.put(email, name);

            double amount = expense.getAmount();
            String splitType = expense.getSplitType();
            String paidBy = expense.getPaidBy() != null
                    ? expense.getPaidBy().toLowerCase() : "you";

            double calculatedChange = 0.0;

            if ("equal".equalsIgnoreCase(splitType)) {
                calculatedChange = "you".equals(paidBy) ? amount / 2.0 : -amount / 2.0;

            } else if ("they-owe".equalsIgnoreCase(splitType)) {
                calculatedChange = amount;

            } else if ("you-owe".equalsIgnoreCase(splitType)) {
                calculatedChange = -amount;

            } else if ("shares".equalsIgnoreCase(splitType)) {
                Double yourSharesVal = expense.getYourShares();
                Double friendSharesVal = expense.getFriendShares();
                double ys = (yourSharesVal == null || yourSharesVal <= 0) ? 1.0 : yourSharesVal;
                double fs = (friendSharesVal == null || friendSharesVal <= 0) ? 1.0 : friendSharesVal;
                double total = ys + fs;
                calculatedChange = "you".equals(paidBy)
                        ? (fs / total) * amount
                        : -(ys / total) * amount;

            } else if ("adjustment".equalsIgnoreCase(splitType)) {
                Double yourAdjVal = expense.getYourAdjustment();
                Double friendAdjVal = expense.getFriendAdjustment();
                double ya = (yourAdjVal == null) ? 0.0 : yourAdjVal;
                double fa = (friendAdjVal == null) ? 0.0 : friendAdjVal;
                double remaining = amount - ya - fa;
                double base = remaining / 2.0;
                double youPay = base + ya;
                double friendPays = base + fa;
                calculatedChange = "you".equals(paidBy) ? friendPays : -youPay;
            }

            emailBalances.put(email,
                    emailBalances.getOrDefault(email, 0.0) + calculatedChange);
        }

        List<FriendBalanceDTO> youOweList = new ArrayList<>();
        List<FriendBalanceDTO> youAreOwedList = new ArrayList<>();
        double totalYouOwe = 0.0;
        double totalYouAreOwed = 0.0;

        for (Map.Entry<String, Double> entry : emailBalances.entrySet()) {
            double balance = entry.getValue();
            String friendEmail = entry.getKey();
            String friendName = emailToNameMap.get(friendEmail);

            if (balance < 0) {
                double abs = Math.abs(balance);
                youOweList.add(new FriendBalanceDTO(
                        friendName, "you owe",
                        String.format("Rs %.2f", abs), "text-red-600"));
                totalYouOwe += abs;

            } else if (balance > 0) {
                youAreOwedList.add(new FriendBalanceDTO(
                        friendName, "owes you",
                        String.format("Rs %.2f", balance), "text-[#0f766e]"));
                totalYouAreOwed += balance;
            }
        }

        double totalBalance = totalYouAreOwed - totalYouOwe;
        return new DashboardDTO(totalBalance, totalYouOwe, totalYouAreOwed,
                youOweList, youAreOwedList);
    }

    public ExpenseCalculationResult calculateSplit(ExpenseCalculationRequest req) {
        double amount = req.getAmount();

        return switch (req.getSplitType()) {
            case "equal" -> new ExpenseCalculationResult(
                    round(amount / 2), round(amount / 2));
            case "you-owe" -> new ExpenseCalculationResult(amount, 0);
            case "they-owe" -> new ExpenseCalculationResult(0, amount);
            case "shares" -> {
                double ys = req.getYourShares() <= 0 ? 1 : req.getYourShares();
                double fs = req.getFriendShares() <= 0 ? 1 : req.getFriendShares();
                double total = ys + fs;
                yield new ExpenseCalculationResult(
                        round(ys / total * amount),
                        round(fs / total * amount));
            }
            case "adjustment" -> {
                double ya = req.getYourAdjustment();
                double fa = req.getFriendAdjustment();
                double remaining = amount - ya - fa;
                if (remaining < 0) yield new ExpenseCalculationResult(-1, -1);
                double base = remaining / 2.0;
                yield new ExpenseCalculationResult(
                        round(base + ya), round(base + fa));
            }
            default -> new ExpenseCalculationResult(
                    round(amount / 2), round(amount / 2));
        };
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}