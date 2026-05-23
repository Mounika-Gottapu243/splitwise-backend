package com.spenva.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class PasswordResetService {

    // In-memory store: email -> {code, expiry}
    private final Map<String, String> codeStore = new HashMap<>();
    private final Map<String, LocalDateTime> expiryStore = new HashMap<>();

    public String generateCode(String email) {
        String code = String.format("%06d", new Random().nextInt(999999));
        codeStore.put(email, code);
        expiryStore.put(email, LocalDateTime.now().plusMinutes(10));
        return code;
    }

    public boolean verifyCode(String email, String code) {
        String stored = codeStore.get(email);
        LocalDateTime expiry = expiryStore.get(email);
        if (stored == null || expiry == null) return false;
        if (LocalDateTime.now().isAfter(expiry)) return false;
        return stored.equals(code);
    }

    public void clearCode(String email) {
        codeStore.remove(email);
        expiryStore.remove(email);
    }
}