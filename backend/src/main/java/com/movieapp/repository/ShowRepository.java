package com.movieapp.repository;

import com.movieapp.entity.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowRepository extends JpaRepository<Show, Long> {
    List<Show> findByMovieIdOrderByShowTimeAsc(Long movieId);
    List<Show> findAllByOrderByShowTimeAsc();
    List<Show> findByTheaterIdOrderByShowTimeAsc(Long theaterId);

    @Query("SELECT s FROM Show s WHERE " +
           "(:movieId IS NULL OR s.movie.id = :movieId) AND " +
           "(:theaterId IS NULL OR s.theater.id = :theaterId) AND " +
           "(:dayStart IS NULL OR (s.showTime >= :dayStart AND s.showTime < :dayEnd)) " +
           "ORDER BY s.showTime ASC")
    List<Show> search(@Param("movieId") Long movieId,
                      @Param("theaterId") Long theaterId,
                      @Param("dayStart") LocalDateTime dayStart,
                      @Param("dayEnd") LocalDateTime dayEnd);
}
