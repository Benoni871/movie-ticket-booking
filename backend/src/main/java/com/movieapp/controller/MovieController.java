package com.movieapp.controller;

import com.movieapp.entity.Movie;
import com.movieapp.service.MovieService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ResponseEntity<List<Movie>> getAll(@RequestParam(required = false) Long theaterId,
                                              @RequestParam(required = false) String location,
                                              @RequestParam(required = false) String language) {
        return ResponseEntity.ok(movieService.findAll(theaterId, location, language));
    }

    @PostMapping
    public ResponseEntity<Movie> create(@RequestBody Movie movie) {
        return ResponseEntity.ok(movieService.create(movie));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movie> update(@PathVariable Long id, @RequestBody Movie movie) {
        return ResponseEntity.ok(movieService.update(id, movie));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        movieService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
