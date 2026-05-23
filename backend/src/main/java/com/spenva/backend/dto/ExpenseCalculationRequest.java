
package com.spenva.backend.dto;

import lombok.Data;

@Data
public class ExpenseCalculationRequest {
    private double amount;
    private String splitType;
    private double yourShares;
    private double friendShares;
    private double yourAdjustment;
    private double friendAdjustment;
}