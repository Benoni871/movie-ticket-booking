package com.movieapp.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BulkShowRequest {
    private Long movieId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private List<LocalDateTime> showTimes;

    private BigDecimal ticketPrice;
    private Integer totalSeats;
    private String couponCode;
    private Integer discountPercent;
    private String language;

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }
    public List<LocalDateTime> getShowTimes() { return showTimes; }
    public void setShowTimes(List<LocalDateTime> showTimes) { this.showTimes = showTimes; }
    public BigDecimal getTicketPrice() { return ticketPrice; }
    public void setTicketPrice(BigDecimal ticketPrice) { this.ticketPrice = ticketPrice; }
    public Integer getTotalSeats() { return totalSeats; }
    public void setTotalSeats(Integer totalSeats) { this.totalSeats = totalSeats; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public Integer getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Integer discountPercent) { this.discountPercent = discountPercent; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
