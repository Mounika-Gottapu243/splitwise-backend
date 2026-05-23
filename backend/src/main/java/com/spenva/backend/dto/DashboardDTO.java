
package com.spenva.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data                        // Automatically generates Getters, Setters, toString, equals, and hashCode
@AllArgsConstructor          // Automatically generates the constructor with all fields
@NoArgsConstructor           // Generates a no-args constructor (highly recommended for Spring/Jackson deserialization)
public class DashboardDTO {
    private double totalBalance;
    private double totalYouOwe;
    private double totalYouAreOwed;
    private List<FriendBalanceDTO> youOweList;
    private List<FriendBalanceDTO> youAreOwedList;
}