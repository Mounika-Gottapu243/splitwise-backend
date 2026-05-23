package com.spenva.backend.controller;
import com.spenva.backend.dto.GroupSplitRequest;
import com.spenva.backend.dto.SettlementDTO;
import com.spenva.backend.service.GroupSplitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class GroupController {

    @Autowired
    private GroupSplitService groupSplitService;

    @PostMapping("/calculate")
    public ResponseEntity<List<SettlementDTO>> calculate(@RequestBody GroupSplitRequest request) {
        List<SettlementDTO> settlements = groupSplitService.calculate(request);
        return ResponseEntity.ok(settlements);
    }
}