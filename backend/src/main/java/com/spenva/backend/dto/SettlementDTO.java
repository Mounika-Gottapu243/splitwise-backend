
package com.spenva.backend.dto;

import lombok.Data;

@Data
public class SettlementDTO {
    private String from;
    private String to;
    private double amount;

    public SettlementDTO(String from, String to, double amount) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }
}