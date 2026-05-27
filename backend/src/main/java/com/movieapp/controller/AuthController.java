package com.movieapp.controller;

import com.movieapp.dto.LoginRequest;
import com.movieapp.dto.LoginResponse;
import com.movieapp.dto.RegisterAdminRequest;
import com.movieapp.dto.RegisterRequest;
import com.movieapp.security.UserPrincipal;
import com.movieapp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<LoginResponse> registerAdmin(@RequestBody RegisterAdminRequest request) {
        return ResponseEntity.ok(authService.registerAdmin(request));
    }

    /** For legacy admins without a theater. Requires authenticated ADMIN. */
    @PostMapping("/setup-theater")
    public ResponseEntity<LoginResponse> setupTheater(@RequestBody Map<String, String> body,
                                                      @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || !me.isAdmin()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(authService.setupTheater(me.getId(),
                body.get("name"), body.get("location")));
    }
}
