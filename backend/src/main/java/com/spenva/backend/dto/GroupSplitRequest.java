
package com.spenva.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class GroupSplitRequest {
    private String groupName;
    private List<GroupMemberDTO> members;
    private List<GroupExpenseDTO> expenses;
}