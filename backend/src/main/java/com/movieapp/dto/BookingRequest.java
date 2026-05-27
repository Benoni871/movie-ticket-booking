package com.movieapp.dto;

import java.util.List;

public class BookingRequest {
    private Long userId;
    private Long showId;
    private List<String> seats;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getShowId() { return showId; }
    public void setShowId(Long showId) { this.showId = showId; }
    public List<String> getSeats() { return seats; }
    public void setSeats(List<String> seats) { this.seats = seats; }
}
