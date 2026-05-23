package com.spenva.backend.service;

import com.spenva.backend.entity.User;
import com.spenva.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ForgotPasswordService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> otpExpiryStore = new ConcurrentHashMap<>();
    private final Map<String, String> resetTokenStore = new ConcurrentHashMap<>(); // token -> email
    private final Map<String, LocalDateTime> tokenExpiryStore = new ConcurrentHashMap<>();

    public void sendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User with this email does not exist"));

        String otp = String.format("%06d", new Random().nextInt(1000000));
        otpStore.put(email, otp);
        otpExpiryStore.put(email, LocalDateTime.now().plusMinutes(10));

        // Print to console for easy local testing/debugging
        System.out.println("\n=== [DEBUG] PASSWORD RESET OTP ===");
        System.out.println("Email: " + email);
        System.out.println("OTP Code: " + otp);
        System.out.println("===================================\n");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Spenva Password Reset OTP");
        message.setText("Your OTP for resetting your password is: " + otp + "\nThis OTP is valid for 10 minutes.");
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("[WARNING] Failed to send email: " + e.getMessage());
            System.err.println("[DEBUG] You can use the OTP code printed in the console above to continue testing.");
        }
    }

    public String verifyOtp(String email, String otp) {
        String storedOtp = otpStore.get(email);
        LocalDateTime expiry = otpExpiryStore.get(email);

        if (storedOtp == null || expiry == null) {
            throw new RuntimeException("No OTP requested for this email");
        }

        if (LocalDateTime.now().isAfter(expiry)) {
            otpStore.remove(email);
            otpExpiryStore.remove(email);
            throw new RuntimeException("OTP has expired");
        }

        if (!storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        otpStore.remove(email);
        otpExpiryStore.remove(email);

        String token = UUID.randomUUID().toString();
        resetTokenStore.put(token, email);
        tokenExpiryStore.put(token, LocalDateTime.now().plusMinutes(5));

        return token;
    }

    public void resetPassword(String token, String newPassword) {
        String email = resetTokenStore.get(token);
        LocalDateTime expiry = tokenExpiryStore.get(token);

        if (email == null || expiry == null) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        if (LocalDateTime.now().isAfter(expiry)) {
            resetTokenStore.remove(token);
            tokenExpiryStore.remove(token);
            throw new RuntimeException("Reset token has expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetTokenStore.remove(token);
        tokenExpiryStore.remove(token);
    }
}
