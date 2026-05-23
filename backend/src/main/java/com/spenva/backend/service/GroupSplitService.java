
package com.spenva.backend.service;

import com.spenva.backend.dto.*;
        import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroupSplitService {

    public List<SettlementDTO> calculate(GroupSplitRequest request) {
        Map<String, String> idToName = new HashMap<>();
        for (GroupMemberDTO member : request.getMembers()) {
            idToName.put(member.getId(), member.getName());
        }

        // Build net balance: positive = owed money, negative = owes money
        Map<String, Double> balance = new HashMap<>();
        for (GroupMemberDTO member : request.getMembers()) {
            balance.put(member.getId(), 0.0);
        }

        for (GroupExpenseDTO expense : request.getExpenses()) {
            double amount = expense.getAmount();
            String paidBy = expense.getPaidBy();

            if (paidBy == null || amount <= 0) continue;

            // Default: split among all members if splitAmong is empty
            List<String> splitList = (expense.getSplitAmong() == null || expense.getSplitAmong().isEmpty())
                    ? idToName.keySet().stream().toList()
                    : expense.getSplitAmong();

            double share = amount / splitList.size();

            // Payer gets credited the full amount
            balance.merge(paidBy, amount, Double::sum);

            // Each person in split gets debited their share
            for (String memberId : splitList) {
                balance.merge(memberId, -share, Double::sum);
            }
        }

        // Greedy debt minimization
        List<Map.Entry<String, Double>> credits = new ArrayList<>();
        List<Map.Entry<String, Double>> debts = new ArrayList<>();

        for (Map.Entry<String, Double> entry : balance.entrySet()) {
            if (entry.getValue() > 0.01) credits.add(entry);
            else if (entry.getValue() < -0.01) debts.add(entry);
        }

        // Sort descending by amount
        credits.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        debts.sort((a, b) -> Double.compare(a.getValue(), b.getValue())); // most negative first

        List<SettlementDTO> settlements = new ArrayList<>();

        int i = 0, j = 0;
        double[] creditAmounts = credits.stream().mapToDouble(Map.Entry::getValue).toArray();
        double[] debtAmounts = debts.stream().mapToDouble(e -> Math.abs(e.getValue())).toArray();

        while (i < credits.size() && j < debts.size()) {
            double settled = Math.min(creditAmounts[i], debtAmounts[j]);

            String fromName = idToName.get(debts.get(j).getKey());
            String toName = idToName.get(credits.get(i).getKey());

            // Round to 2 decimal places
            double rounded = Math.round(settled * 100.0) / 100.0;
            settlements.add(new SettlementDTO(fromName, toName, rounded));

            creditAmounts[i] -= settled;
            debtAmounts[j] -= settled;

            if (creditAmounts[i] < 0.01) i++;
            if (debtAmounts[j] < 0.01) j++;
        }

        return settlements;
    }
}