package com.movieapp.repository;

import com.movieapp.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TheaterRepository extends JpaRepository<Theater, Long> {
    Optional<Theater> findByOwnerUserId(Long ownerUserId);
}
