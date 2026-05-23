package com.spenva.backend.repository;

import com.spenva.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    default Optional<User> findByEmailOrUsername(String identifier) {
        if (identifier == null) {
            return Optional.empty();
        }
        return findByEmail(identifier).or(() -> findByUsername(identifier));
    }
}