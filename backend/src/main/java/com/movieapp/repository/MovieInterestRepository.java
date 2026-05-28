package com.movieapp.repository;

import com.movieapp.entity.MovieInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MovieInterestRepository extends JpaRepository<MovieInterest, Long> {
    Optional<MovieInterest> findByUserIdAndMovieId(Long userId, Long movieId);
    long countByMovieId(Long movieId);
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    /** Returns [movieId, count] tuples ordered by interest count desc. */
    @Query("SELECT mi.movieId, COUNT(mi) FROM MovieInterest mi " +
           "GROUP BY mi.movieId " +
           "ORDER BY COUNT(mi) DESC")
    List<Object[]> aggregateByMovie();
}
