package com.movieapp.service;

import com.movieapp.dto.ReviewRequest;
import com.movieapp.entity.Booking;
import com.movieapp.entity.Booking.BookingStatus;
import com.movieapp.entity.Review;
import com.movieapp.entity.Show;
import com.movieapp.exception.ForbiddenException;
import com.movieapp.repository.BookingRepository;
import com.movieapp.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public Review create(ReviewRequest req, Long userId) {
        if (userId == null) {
            throw new ForbiddenException("Missing user identity");
        }
        if (req.getBookingId() == null || req.getRating() == null) {
            throw new IllegalArgumentException("bookingId and rating are required");
        }
        if (req.getRating() < 1 || req.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only review your own bookings");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be reviewed");
        }

        Show show = booking.getShow();
        int durationMins = show.getMovie().getDurationMins() != null ? show.getMovie().getDurationMins() : 0;
        LocalDateTime endTime = show.getShowTime().plusMinutes(durationMins);
        if (LocalDateTime.now().isBefore(endTime)) {
            throw new IllegalStateException("You can review only after the show has ended");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new IllegalStateException("This booking has already been reviewed");
        }

        Review review = new Review();
        review.setUserId(userId);
        review.setBookingId(booking.getId());
        review.setShowId(show.getId());
        review.setMovieId(show.getMovie().getId());
        review.setRating(req.getRating());
        return reviewRepository.save(review);
    }

    public boolean canReview(Long bookingId, Long userId) {
        if (userId == null || bookingId == null) return false;
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return false;
        if (!booking.getUser().getId().equals(userId)) return false;
        if (booking.getStatus() != BookingStatus.CONFIRMED) return false;
        Show show = booking.getShow();
        int durationMins = show.getMovie().getDurationMins() != null ? show.getMovie().getDurationMins() : 0;
        LocalDateTime endTime = show.getShowTime().plusMinutes(durationMins);
        if (LocalDateTime.now().isBefore(endTime)) return false;
        return !reviewRepository.existsByBookingId(bookingId);
    }

    /** Returns the user's existing rating for a booking, or null if not reviewed yet. */
    public Integer existingRating(Long bookingId, Long userId) {
        if (userId == null || bookingId == null) return null;
        return reviewRepository.findByBookingId(bookingId)
                .filter(r -> r.getUserId().equals(userId))
                .map(Review::getRating)
                .orElse(null);
    }

    public Map<Long, double[]> aggregateAll() {
        Map<Long, double[]> out = new HashMap<>();
        for (Object[] row : reviewRepository.aggregateAll()) {
            Long movieId = (Long) row[0];
            Double avg = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            Long count = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            out.put(movieId, new double[]{ avg, count });
        }
        return out;
    }

    public List<Review> findByMovie(Long movieId) {
        return reviewRepository.findByMovieId(movieId);
    }
}
