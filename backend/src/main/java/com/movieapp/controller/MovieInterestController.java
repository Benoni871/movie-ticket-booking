package com.movieapp.controller;

import com.movieapp.entity.Movie;
import com.movieapp.entity.MovieInterest;
import com.movieapp.exception.ForbiddenException;
import com.movieapp.repository.MovieInterestRepository;
import com.movieapp.repository.MovieRepository;
import com.movieapp.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interests")
public class MovieInterestController {

    private final MovieInterestRepository repository;
    private final MovieRepository movieRepository;

    public MovieInterestController(MovieInterestRepository repository, MovieRepository movieRepository) {
        this.repository = repository;
        this.movieRepository = movieRepository;
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<Map<String, Object>> register(@PathVariable Long movieId,
                                                        @AuthenticationPrincipal UserPrincipal me) {
        if (me == null) throw new ForbiddenException("Login required");
        if (!repository.existsByUserIdAndMovieId(me.getId(), movieId)) {
            MovieInterest mi = new MovieInterest();
            mi.setUserId(me.getId());
            mi.setMovieId(movieId);
            repository.save(mi);
        }
        return ResponseEntity.ok(Map.of(
                "interested", true,
                "count", repository.countByMovieId(movieId)
        ));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<Map<String, Object>> status(@PathVariable Long movieId,
                                                      @AuthenticationPrincipal UserPrincipal me) {
        boolean mine = me != null && repository.existsByUserIdAndMovieId(me.getId(), movieId);
        return ResponseEntity.ok(Map.of(
                "interested", mine,
                "count", repository.countByMovieId(movieId)
        ));
    }

    /**
     * Audience demand across all movies — used by admin dashboards.
     * Returns rows of {movieId, title, posterUrl, count}, hottest first.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<List<Map<String, Object>>> dashboard(@AuthenticationPrincipal UserPrincipal me) {
        if (me == null || !me.isAdmin()) throw new ForbiddenException("Admin only");
        List<Object[]> rows = repository.aggregateByMovie();
        if (rows.isEmpty()) return ResponseEntity.ok(List.of());

        List<Long> movieIds = new ArrayList<>();
        for (Object[] r : rows) movieIds.add((Long) r[0]);

        Map<Long, Movie> byId = new HashMap<>();
        for (Movie m : movieRepository.findAllById(movieIds)) byId.put(m.getId(), m);

        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Long movieId = (Long) r[0];
            Long count = (Long) r[1];
            Movie m = byId.get(movieId);
            if (m == null) continue;
            Map<String, Object> entry = new HashMap<>();
            entry.put("movieId", movieId);
            entry.put("title", m.getTitle());
            entry.put("posterUrl", m.getPosterUrl());
            entry.put("count", count);
            out.add(entry);
        }
        return ResponseEntity.ok(out);
    }
}
