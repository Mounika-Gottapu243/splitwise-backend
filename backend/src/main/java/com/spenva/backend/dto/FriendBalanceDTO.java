
package com.spenva.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FriendBalanceDTO {
    private String name;
    private String status;
    private String amount;  
    private String color;
}
