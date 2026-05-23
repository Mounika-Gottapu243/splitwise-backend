
package com.spenva.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class GroupExpenseDTO {
    private String paidBy;        // member id
    private double amount;
    private String description;
    private List<String> splitAmong; // member ids, empty = split among all
}