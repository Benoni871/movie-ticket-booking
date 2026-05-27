package com.movieapp.security;

import com.movieapp.entity.User;

public class UserPrincipal {
    private final Long id;
    private final String username;
    private final User.Role role;

    public UserPrincipal(Long id, String username, User.Role role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public User.Role getRole() { return role; }

    public boolean isAdmin() { return role == User.Role.ADMIN; }
}
