package com.movieapp.service;

import com.movieapp.entity.Booking.BookingStatus;
import com.movieapp.entity.Movie;
import com.movieapp.entity.Show;
import com.movieapp.repository.BookingRepository;
import com.movieapp.repository.MovieRepository;
import com.movieapp.repository.ShowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final ShowRepository showRepository;
    private final BookingRepository bookingRepository;
    private final ReviewService reviewService;

    public MovieService(MovieRepository movieRepository,
                        ShowRepository showRepository,
                        BookingRepository bookingRepository,
                        ReviewService reviewService) {
        this.movieRepository = movieRepository;
        this.showRepository = showRepository;
        this.bookingRepository = bookingRepository;
        this.reviewService = reviewService;
    }

    public List<Movie> findAll(Long theaterId) {
        List<Movie> movies;
        if (theaterId != null) {
            // Distinct movies that have at least one show in the given theater.
            List<Long> movieIds = showRepository.findByTheaterIdOrderByShowTimeAsc(theaterId).stream()
                    .map(s -> s.getMovie().getId())
                    .distinct()
                    .toList();
            movies = movieRepository.findAllById(movieIds);
        } else {
            movies = movieRepository.findAll();
        }
        applyRatings(movies);
        return movies;
    }

    private void applyRatings(List<Movie> movies) {
        Map<Long, double[]> ratings = reviewService.aggregateAll();
        for (Movie m : movies) {
            double[] agg = ratings.get(m.getId());
            if (agg != null) {
                m.setAverageRating(Math.round(agg[0] * 10.0) / 10.0);
                m.setReviewCount((long) agg[1]);
            } else {
                m.setAverageRating(null);
                m.setReviewCount(0L);
            }
        }
    }

    public Movie create(Movie movie) {
        if (movie.getTitle() == null || movie.getTitle().isBlank()) {
            throw new IllegalArgumentException("Movie title is required");
        }
        return movieRepository.save(movie);
    }

    public Movie update(Long id, Movie updates) {
        Movie existing = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        if (updates.getTitle() != null && !updates.getTitle().isBlank()) {
            existing.setTitle(updates.getTitle());
        }
        if (updates.getGenre() != null) {
            existing.setGenre(updates.getGenre());
        }
        if (updates.getDurationMins() != null) {
            existing.setDurationMins(updates.getDurationMins());
        }
        if (updates.getPosterUrl() != null) {
            existing.setPosterUrl(updates.getPosterUrl());
        }
        if (updates.getPrice() != null) {
            existing.setPrice(updates.getPrice());
        }
        if (updates.getTrailerUrl() != null) {
            existing.setTrailerUrl(updates.getTrailerUrl());
        }
        return movieRepository.save(existing);
    }

    @Transactional
    public void delete(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        long activeBookings = bookingRepository.countByMovieIdAndStatus(movieId, BookingStatus.CONFIRMED);
        if (activeBookings > 0) {
            throw new IllegalStateException(
                "Cannot delete: " + activeBookings + " active booking(s) exist for this movie. " +
                "Cancel them first or wait until shows pass.");
        }

        List<Show> shows = showRepository.findByMovieIdOrderByShowTimeAsc(movieId);
        if (!shows.isEmpty()) {
            List<Long> showIds = shows.stream().map(Show::getId).toList();
            // Wipe any cancelled-booking history for these shows so the FK doesn't block deletion.
            bookingRepository.deleteByShowIdIn(showIds);
            showRepository.deleteAll(shows);
        }

        movieRepository.delete(movie);
    }
}
