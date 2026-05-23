package com.spenva.backend.controller;

import com.spenva.backend.dto.ForgotPasswordRequest;
import com.spenva.backend.dto.VerifyOtpRequest;
import com.spenva.backend.dto.ResetPasswordRequest;
import com.spenva.backend.service.ForgotPasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/forgot-password")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ForgotPasswordController {

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody ForgotPasswordRequest request) {
        try {
            forgotPasswordService.sendOtp(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully to your email."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            String token = forgotPasswordService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of("token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            forgotPasswordService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
