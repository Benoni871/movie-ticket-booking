package com.movieapp.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:4200"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(reg -> reg
                // Public auth endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/login",
                                                  "/api/auth/register",
                                                  "/api/auth/register-admin").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Admin-only write endpoints
                .requestMatchers(HttpMethod.POST, "/api/movies").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,  "/api/movies/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/movies/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/shows", "/api/shows/bulk").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/shows/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/api/bookings").hasRole("ADMIN")
                .requestMatchers("/api/analytics/**").hasRole("ADMIN")

                // Everything else under /api requires authentication
                .requestMatchers("/api/**").authenticated()

                .anyRequest().permitAll()
            )
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((req, resp, e) -> {
                    resp.setStatus(401);
                    resp.setContentType("application/json");
                    resp.getWriter().write("{\"error\":\"Authentication required\"}");
                })
                .accessDeniedHandler((req, resp, e) -> {
                    resp.setStatus(403);
                    resp.setContentType("application/json");
                    resp.getWriter().write("{\"error\":\"Forbidden\"}");
                })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
