package com.spenva.backend.controller;

import com.spenva.backend.entity.Expense;
import com.spenva.backend.entity.Friend;
import com.spenva.backend.entity.User;
import com.spenva.backend.repository.ExpenseRepository;
import com.spenva.backend.repository.FriendRepository;
import com.spenva.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FriendController {

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    // GET /api/friends
    @GetMapping
    public List<Friend> getAllFriends() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

     

        String email = authentication.getName();

        User user = userRepository.findByEmailOrUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return friendRepository.findByUser(user);
    }

    // GET /api/friends/balances
    @GetMapping("/balances")
    public Map<String, Object> getBalances() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user = userRepository.findByEmailOrUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Expense> expenses = expenseRepository.findByUser(user);

        Map<String, Double> balanceMap = new HashMap<>();

        for (Expense e : expenses) {
            if (e.getFriend() == null) continue;

            String friendName = e.getFriend().getName();

            double amount = e.getAmount();
            String splitType = e.getSplitType();
            String paidBy = e.getPaidBy() != null ? e.getPaidBy().toLowerCase() : "you";

            double delta = 0;

            if ("equal".equalsIgnoreCase(splitType)) {
                delta = "you".equals(paidBy) ? amount / 2.0 : -amount / 2.0;
            }
            else if ("they-owe".equalsIgnoreCase(splitType)) {
                delta = "you".equals(paidBy) ? amount : 0.0;
            }
            else if ("you-owe".equalsIgnoreCase(splitType)) {
                delta = "friend".equals(paidBy) ? -amount : 0.0;
            }
            else if ("shares".equalsIgnoreCase(splitType)) {
                Double yourSharesVal = e.getYourShares();
                Double friendSharesVal = e.getFriendShares();
                double ys = (yourSharesVal == null || yourSharesVal <= 0) ? 1.0 : yourSharesVal;
                double fs = (friendSharesVal == null || friendSharesVal <= 0) ? 1.0 : friendSharesVal;
                double total = ys + fs;
                delta = "you".equals(paidBy) ? (fs / total) * amount : -(ys / total) * amount;
            }
            else if ("adjustment".equalsIgnoreCase(splitType)) {
                Double yourAdjVal = e.getYourAdjustment();
                Double friendAdjVal = e.getFriendAdjustment();
                double ya = (yourAdjVal == null) ? 0.0 : yourAdjVal;
                double fa = (friendAdjVal == null) ? 0.0 : friendAdjVal;
                double remaining = amount - ya - fa;
                double base = remaining > 0 ? remaining / 2.0 : 0.0;
                double youPay = base + ya;
                double friendPays = base + fa;
                delta = "you".equals(paidBy) ? friendPays : -youPay;
            }

            balanceMap.merge(friendName, delta, Double::sum);
        }

        List<Map<String, String>> youOweList = new ArrayList<>();
        List<Map<String, String>> youAreOwedList = new ArrayList<>();

        double totalYouOwe = 0;
        double totalYouAreOwed = 0;

        for (Map.Entry<String, Double> entry : balanceMap.entrySet()) {

            String name = entry.getKey();
            double balance = entry.getValue();

            Map<String, String> row = new HashMap<>();

            row.put("name", name);

            if (balance < 0) {

                totalYouOwe += Math.abs(balance);

                row.put("status", "you owe");
                row.put("amount", "Rs " + String.format("%.2f", Math.abs(balance)));
                row.put("color", "text-red-600");

                youOweList.add(row);

            }
            else if (balance > 0) {

                totalYouAreOwed += balance;

                row.put("status", "owes you");
                row.put("amount", "Rs " + String.format("%.2f", balance));
                row.put("color", "text-teal-600");

                youAreOwedList.add(row);
            }
        }

        Map<String, Object> result = new HashMap<>();

        result.put("totalYouOwe", totalYouOwe);
        result.put("totalYouAreOwed", totalYouAreOwed);
        result.put("totalBalance", totalYouAreOwed - totalYouOwe);

        result.put("youOweList", youOweList);
        result.put("youAreOwedList", youAreOwedList);

        return result;
    }
}