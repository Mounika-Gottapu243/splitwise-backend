package com.spenva.backend.service;

import com.spenva.backend.entity.User;
import com.spenva.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(String username, String email, String password) {

        if (username == null || username.trim().isEmpty()) {
            username = email;
        }

        if (userRepository.findByEmail(email).isPresent() || userRepository.findByUsername(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.findByUsername(username).isPresent() || userRepository.findByEmail(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();

        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        return userRepository.save(user);
    }

    public User loginUser(String email, String password) {

        User user = userRepository.findByEmailOrUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return user;
    }
}