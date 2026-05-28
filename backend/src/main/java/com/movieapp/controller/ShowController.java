package com.movieapp.controller;

import com.movieapp.dto.BulkShowRequest;
import com.movieapp.dto.ShowRequest;
import com.movieapp.entity.Show;
import com.movieapp.security.UserPrincipal;
import com.movieapp.service.BookingService;
import com.movieapp.service.ShowService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/shows")
public class ShowController {

    private final ShowService showService;
    private final BookingService bookingService;

    public ShowController(ShowService showService, BookingService bookingService) {
        this.showService = showService;
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<Show>> getShows(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long theaterId,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean hasLocation = location != null && !location.isBlank();
        if (movieId == null && theaterId == null && !hasLocation && date == null) {
            throw new IllegalArgumentException("At least one filter (movieId, theaterId, location, or date) is required");
        }
        return ResponseEntity.ok(showService.search(movieId, theaterId, location, date));
    }

    @PostMapping
    public ResponseEntity<Show> create(@RequestBody ShowRequest request,
                                       @AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(showService.create(request, me != null ? me.getId() : null));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Show>> bulkCreate(@RequestBody BulkShowRequest request,
                                                 @AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(showService.bulkCreate(request, me != null ? me.getId() : null));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Show>> getAll(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(showService.findForAdmin(me != null ? me.getId() : null));
    }

    @GetMapping("/offers")
    public ResponseEntity<List<Show>> offers() {
        return ResponseEntity.ok(showService.findOffers());
    }

    @GetMapping("/{showId}/booked-seats")
    public ResponseEntity<List<String>> bookedSeats(@PathVariable Long showId) {
        return ResponseEntity.ok(bookingService.findBookedSeats(showId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserPrincipal me) {
        showService.delete(id, me != null ? me.getId() : null);
        return ResponseEntity.noContent().build();
    }
}
