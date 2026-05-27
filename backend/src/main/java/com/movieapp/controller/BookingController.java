package com.movieapp.controller;

import com.movieapp.dto.BookingRequest;
import com.movieapp.entity.Booking;
import com.movieapp.security.UserPrincipal;
import com.movieapp.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> create(@RequestBody BookingRequest request,
                                          @AuthenticationPrincipal UserPrincipal me) {
        // Always book on behalf of the authenticated user — never trust client-sent userId.
        if (me != null) {
            request.setUserId(me.getId());
        }
        return ResponseEntity.ok(bookingService.create(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> byUser(@PathVariable Long userId,
                                                @AuthenticationPrincipal UserPrincipal me) {
        // Users can only view their own bookings. Admins can view any.
        if (me != null && !me.isAdmin() && !me.getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(bookingService.findByUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> all(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(bookingService.findForAdmin(me != null ? me.getId() : null));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancel(@PathVariable Long id,
                                          @AuthenticationPrincipal UserPrincipal me) {
        boolean isAdmin = me != null && me.isAdmin();
        Long requesterId = me != null ? me.getId() : null;
        return ResponseEntity.ok(bookingService.cancel(id, requesterId, isAdmin));
    }
}
