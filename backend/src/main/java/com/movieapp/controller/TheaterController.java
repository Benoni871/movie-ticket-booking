package com.movieapp.controller;

import com.movieapp.entity.Theater;
import com.movieapp.repository.TheaterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
public class TheaterController {

    private final TheaterRepository theaterRepository;

    public TheaterController(TheaterRepository theaterRepository) {
        this.theaterRepository = theaterRepository;
    }

    @GetMapping
    public ResponseEntity<List<Theater>> all(@RequestParam(required = false) String location) {
        if (location != null && !location.isBlank()) {
            return ResponseEntity.ok(theaterRepository.findByLocationIgnoreCaseOrderByNameAsc(location.trim()));
        }
        return ResponseEntity.ok(theaterRepository.findAll());
    }

    @GetMapping("/locations")
    public ResponseEntity<List<String>> locations() {
        return ResponseEntity.ok(theaterRepository.findDistinctLocations());
    }
}
