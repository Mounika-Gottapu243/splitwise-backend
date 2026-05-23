package com.spenva.backend.controller;

import com.spenva.backend.dto.LoginRequest;
import com.spenva.backend.dto.RegisterRequest;
import com.spenva.backend.entity.User;
import com.spenva.backend.service.UserService;
import com.spenva.backend.util.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        try {

            User savedUser = userService.registerUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword()
            );

            String token = jwtUtil.generateToken(
                    savedUser.getEmail()
            );

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", savedUser.getUsername(),
                    "email", savedUser.getEmail()
            ));

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        try {

            User user = userService.loginUser(
                    request.getEmail(),
                    request.getPassword()
            );

            String token = jwtUtil.generateToken(
                    user.getEmail()
            );

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));

        } catch (RuntimeException e) {

            return ResponseEntity.status(401)
                    .body(e.getMessage());
        }
    }
}