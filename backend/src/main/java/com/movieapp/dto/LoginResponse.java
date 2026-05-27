package com.movieapp.dto;

public class LoginResponse {
    private String token;
    private Long id;
    private String username;
    private String role;
    private Long theaterId;
    private String theaterName;
    private String theaterLocation;

    public LoginResponse() {}

    public LoginResponse(String token, Long id, String username, String role,
                         Long theaterId, String theaterName, String theaterLocation) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.role = role;
        this.theaterId = theaterId;
        this.theaterName = theaterName;
        this.theaterLocation = theaterLocation;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getTheaterId() { return theaterId; }
    public void setTheaterId(Long theaterId) { this.theaterId = theaterId; }
    public String getTheaterName() { return theaterName; }
    public void setTheaterName(String theaterName) { this.theaterName = theaterName; }
    public String getTheaterLocation() { return theaterLocation; }
    public void setTheaterLocation(String theaterLocation) { this.theaterLocation = theaterLocation; }
}
