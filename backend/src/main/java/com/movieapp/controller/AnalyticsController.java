package com.movieapp.controller;

import com.movieapp.security.UserPrincipal;
import com.movieapp.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(analyticsService.overview(me != null ? me.getId() : null));
    }

    @GetMapping("/bookings-over-time")
    public ResponseEntity<List<Map<String, Object>>> overTime(
            @RequestParam(defaultValue = "30") int days,
            @AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(analyticsService.bookingsOverTime(me != null ? me.getId() : null, days));
    }

    @GetMapping("/revenue-by-movie")
    public ResponseEntity<List<Map<String, Object>>> revenue(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(analyticsService.revenueByMovie(me != null ? me.getId() : null));
    }

    @GetMapping("/show-fillrate")
    public ResponseEntity<List<Map<String, Object>>> fillRate(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(analyticsService.showFillRate(me != null ? me.getId() : null));
    }
}
