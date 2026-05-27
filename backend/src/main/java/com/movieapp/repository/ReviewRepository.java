package com.movieapp.repository;

import com.movieapp.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByBookingId(Long bookingId);

    Optional<Review> findByBookingId(Long bookingId);

    List<Review> findByMovieId(Long movieId);

    @Query("SELECT r.movieId, AVG(r.rating), COUNT(r) FROM Review r GROUP BY r.movieId")
    List<Object[]> aggregateAll();
}
