package com.movieapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MovieAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(MovieAppApplication.class, args);
        System.out.println("Running at port 8181");
    }
}
