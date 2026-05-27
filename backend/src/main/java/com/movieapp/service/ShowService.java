package com.movieapp.service;

import com.movieapp.dto.BulkShowRequest;
import com.movieapp.dto.ShowRequest;
import com.movieapp.entity.Booking.BookingStatus;
import com.movieapp.entity.Movie;
import com.movieapp.entity.Show;
import com.movieapp.entity.Theater;
import com.movieapp.entity.User;
import com.movieapp.exception.ForbiddenException;
import com.movieapp.repository.BookingRepository;
import com.movieapp.repository.MovieRepository;
import com.movieapp.repository.ShowRepository;
import com.movieapp.repository.TheaterRepository;
import com.movieapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ShowService {

    private final ShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TheaterRepository theaterRepository;

    public ShowService(ShowRepository showRepository,
                       MovieRepository movieRepository,
                       BookingRepository bookingRepository,
                       UserRepository userRepository,
                       TheaterRepository theaterRepository) {
        this.showRepository = showRepository;
        this.movieRepository = movieRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.theaterRepository = theaterRepository;
    }

    public List<Show> findByMovie(Long movieId) {
        return showRepository.findByMovieIdOrderByShowTimeAsc(movieId);
    }

    public List<Show> search(Long movieId, Long theaterId, java.time.LocalDate date) {
        LocalDateTime dayStart = date != null ? date.atStartOfDay() : null;
        LocalDateTime dayEnd = date != null ? date.plusDays(1).atStartOfDay() : null;
        return showRepository.search(movieId, theaterId, dayStart, dayEnd);
    }

    /** Used by admin "Manage Shows". Scoped to admin's theater. */
    public List<Show> findForAdmin(Long adminUserId) {
        Theater theater = requireAdminTheater(adminUserId);
        return showRepository.findByTheaterIdOrderByShowTimeAsc(theater.getId());
    }

    public Show create(ShowRequest req, Long adminUserId) {
        if (req.getMovieId() == null || req.getShowTime() == null
                || req.getTicketPrice() == null || req.getTotalSeats() == null) {
            throw new IllegalArgumentException("All show fields are required");
        }
        if (req.getShowTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Show time must be in the future");
        }
        Theater theater = requireAdminTheater(adminUserId);
        Movie movie = movieRepository.findById(req.getMovieId())
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        Show show = new Show();
        show.setMovie(movie);
        show.setTheater(theater);
        show.setShowTime(req.getShowTime());
        show.setTicketPrice(req.getTicketPrice());
        show.setTotalSeats(req.getTotalSeats());
        show.setAvailableSeats(req.getTotalSeats());
        return showRepository.save(show);
    }

    @Transactional
    public List<Show> bulkCreate(BulkShowRequest req, Long adminUserId) {
        if (req.getMovieId() == null || req.getShowTimes() == null || req.getShowTimes().isEmpty()
                || req.getTicketPrice() == null || req.getTotalSeats() == null) {
            throw new IllegalArgumentException("Movie, at least one show time, price, and seats are all required");
        }
        LocalDateTime now = LocalDateTime.now();
        for (LocalDateTime t : req.getShowTimes()) {
            if (t == null) throw new IllegalArgumentException("Show time cannot be empty");
            if (t.isBefore(now)) throw new IllegalArgumentException("All show times must be in the future");
        }

        Theater theater = requireAdminTheater(adminUserId);
        Movie movie = movieRepository.findById(req.getMovieId())
                .orElseThrow(() -> new IllegalArgumentException("Movie not found"));

        List<Show> created = new ArrayList<>();
        for (LocalDateTime t : req.getShowTimes()) {
            Show show = new Show();
            show.setMovie(movie);
            show.setTheater(theater);
            show.setShowTime(t);
            show.setTicketPrice(req.getTicketPrice());
            show.setTotalSeats(req.getTotalSeats());
            show.setAvailableSeats(req.getTotalSeats());
            created.add(showRepository.save(show));
        }
        return created;
    }

    @Transactional
    public void delete(Long showId, Long adminUserId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new IllegalArgumentException("Show not found"));

        // Owners can only delete their own theater's shows.
        Theater theater = requireAdminTheater(adminUserId);
        if (show.getTheater() == null || !theater.getId().equals(show.getTheater().getId())) {
            throw new ForbiddenException("You can only delete shows in your own theater");
        }

        long active = bookingRepository.countByShowIdAndStatus(showId, BookingStatus.CONFIRMED);
        if (active > 0) {
            throw new IllegalStateException(
                "Cannot delete: " + active + " active booking(s) exist for this show.");
        }

        bookingRepository.deleteByShowId(showId);
        showRepository.delete(show);
    }

    private Theater requireAdminTheater(Long adminUserId) {
        if (adminUserId == null) {
            throw new ForbiddenException("Missing admin identity");
        }
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ForbiddenException("Unknown admin user"));
        if (admin.getTheaterId() == null) {
            throw new IllegalStateException("You don't have a theater yet — set one up first");
        }
        return theaterRepository.findById(admin.getTheaterId())
                .orElseThrow(() -> new IllegalStateException("Admin's theater no longer exists"));
    }
}
