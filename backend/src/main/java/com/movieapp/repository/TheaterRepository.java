package com.movieapp.repository;

import com.movieapp.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TheaterRepository extends JpaRepository<Theater, Long> {
    Optional<Theater> findByOwnerUserId(Long ownerUserId);

    List<Theater> findByLocationIgnoreCaseOrderByNameAsc(String location);

    @Query("SELECT DISTINCT t.location FROM Theater t " +
           "WHERE t.location IS NOT NULL AND TRIM(t.location) <> '' " +
           "ORDER BY t.location ASC")
    List<String> findDistinctLocations();
}
