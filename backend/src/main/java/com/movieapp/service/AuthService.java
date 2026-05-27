package com.movieapp.service;

import com.movieapp.dto.LoginRequest;
import com.movieapp.dto.LoginResponse;
import com.movieapp.dto.RegisterAdminRequest;
import com.movieapp.dto.RegisterRequest;
import com.movieapp.entity.Theater;
import com.movieapp.entity.User;
import com.movieapp.repository.TheaterRepository;
import com.movieapp.repository.UserRepository;
import com.movieapp.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TheaterRepository theaterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       TheaterRepository theaterRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.theaterRepository = theaterRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Username and password are required");
        }
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!verifyAndMigratePassword(user, request.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return buildLoginResponse(user);
    }

    /**
     * Verifies the password. If the stored hash isn't a BCrypt hash (legacy plaintext),
     * compare directly and upgrade to BCrypt on first successful login.
     */
    private boolean verifyAndMigratePassword(User user, String rawPassword) {
        String stored = user.getPassword();
        if (stored == null) return false;

        // BCrypt hashes start with $2a$, $2b$, or $2y$
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, stored);
        }

        // Legacy plaintext path — verify then upgrade.
        if (stored.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public LoginResponse register(RegisterRequest req) {
        validateCredentials(req.getUsername(), req.getPassword());

        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalStateException("Username is already taken");
        }

        User user = new User();
        user.setUsername(req.getUsername().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.Role.USER);
        userRepository.save(user);

        return buildLoginResponse(user);
    }

    @Transactional
    public LoginResponse registerAdmin(RegisterAdminRequest req) {
        validateCredentials(req.getUsername(), req.getPassword());
        if (req.getTheaterName() == null || req.getTheaterName().isBlank()) {
            throw new IllegalArgumentException("Theater name is required");
        }

        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalStateException("Username is already taken");
        }

        User user = new User();
        user.setUsername(req.getUsername().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.Role.ADMIN);
        userRepository.save(user);

        Theater theater = new Theater();
        theater.setName(req.getTheaterName().trim());
        theater.setLocation(req.getTheaterLocation() != null ? req.getTheaterLocation().trim() : null);
        theater.setOwnerUserId(user.getId());
        theaterRepository.save(theater);

        user.setTheaterId(theater.getId());
        userRepository.save(user);

        return buildLoginResponse(user);
    }

    /**
     * For legacy admins that exist in the DB without a theater (created before multi-tenancy).
     * Creates a theater they own and links it. Idempotent — returns the existing theater if any.
     */
    @Transactional
    public LoginResponse setupTheater(Long userId, String name, String location) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRole() != User.Role.ADMIN) {
            throw new IllegalStateException("Only admins can set up a theater");
        }
        if (user.getTheaterId() != null) {
            return buildLoginResponse(user);
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Theater name is required");
        }

        Theater theater = new Theater();
        theater.setName(name.trim());
        theater.setLocation(location != null ? location.trim() : null);
        theater.setOwnerUserId(userId);
        theaterRepository.save(theater);

        user.setTheaterId(theater.getId());
        userRepository.save(user);

        return buildLoginResponse(user);
    }

    private void validateCredentials(String username, String password) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (password == null || password.length() < 4) {
            throw new IllegalArgumentException("Password must be at least 4 characters");
        }
        if (username.trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters");
        }
    }

    private LoginResponse buildLoginResponse(User user) {
        Long theaterId = user.getTheaterId();
        String theaterName = null;
        String theaterLocation = null;
        if (theaterId != null) {
            Theater t = theaterRepository.findById(theaterId).orElse(null);
            if (t != null) {
                theaterName = t.getName();
                theaterLocation = t.getLocation();
            }
        }
        String token = jwtService.issueToken(user);
        return new LoginResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getRole().name(),
            theaterId,
            theaterName,
            theaterLocation
        );
    }
}
