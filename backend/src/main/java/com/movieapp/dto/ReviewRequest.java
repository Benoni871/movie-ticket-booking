package com.movieapp.dto;

public class ReviewRequest {
    private Long bookingId;
    private Integer rating;

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
}
