
package com.spenva.backend.repository;

import com.spenva.backend.entity.Friend;
import com.spenva.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRepository extends JpaRepository<Friend, Long> {

    Optional<Friend> findByEmail(String email);

    Optional<Friend> findByUserAndEmail(User user, String email);

    List<Friend> findByUser(User user);
}