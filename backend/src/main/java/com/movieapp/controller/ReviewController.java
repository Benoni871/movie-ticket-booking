package com.movieapp.controller;

import com.movieapp.dto.ReviewRequest;
import com.movieapp.entity.Review;
import com.movieapp.security.UserPrincipal;
import com.movieapp.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<Review> create(@RequestBody ReviewRequest req,
                                         @AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(reviewService.create(req, me != null ? me.getId() : null));
    }

    @GetMapping("/can-review/{bookingId}")
    public ResponseEntity<Map<String, Object>> canReview(@PathVariable Long bookingId,
                                                         @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me != null ? me.getId() : null;
        boolean can = reviewService.canReview(bookingId, userId);
        Integer existing = reviewService.existingRating(bookingId, userId);
        Map<String, Object> out = new HashMap<>();
        out.put("canReview", can);
        out.put("existingRating", existing);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<Review>> byMovie(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.findByMovie(movieId));
    }
}
