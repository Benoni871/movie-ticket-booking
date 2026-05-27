# CineBook — Usage Guide

A practical, hands-on guide: how to run the app, every command you'll need, and a feature-by-feature walkthrough.

> For the higher-level architecture overview see [README.md](./README.md).

---

## Table of Contents
1. [Quick Start](#1-quick-start)
2. [Prerequisites](#2-prerequisites)
3. [One-time Setup](#3-one-time-setup)
4. [Daily Commands](#4-daily-commands)
5. [URLs & Ports](#5-urls--ports)
6. [Feature Walkthrough — Moviegoer](#6-feature-walkthrough--moviegoer)
7. [Feature Walkthrough — Theater Owner (Admin)](#7-feature-walkthrough--theater-owner-admin)
8. [Cancellation & Refund Policy](#8-cancellation--refund-policy)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Quick Start

Two terminals, ~30 seconds to first screen.

**Terminal 1 — backend (Spring Boot, port 8181)**
```
cd backend
mvn spring-boot:run
```

**Terminal 2 — frontend (Angular, port 4200)**
```
cd frontend
npm install   # first run only
npm start
```

Open **http://localhost:4200**, click **Create Account**, pick *Theater Owner* or *Moviegoer*, and you're in.

---

## 2. Prerequisites

| Tool        | Version | Check                                  |
|-------------|---------|----------------------------------------|
| Java JDK    | **21**  | `java -version`                        |
| Maven       | 3.9+    | `mvn -version`                         |
| Node.js     | 18+     | `node -v`                              |
| npm         | 9+      | `npm -v`                               |
| MySQL       | 8.x     | running on localhost:3306              |

Set the MySQL password to match `backend/src/main/resources/application.properties` (default config expects `root / Sushu@23`). Either change the password there or update MySQL.

---

## 3. One-time Setup

### MySQL — create the database
```sql
CREATE DATABASE IF NOT EXISTS movie_booking;
```
The backend will create the **tables** automatically on first run (Hibernate `ddl-auto=update`).

### Frontend — install dependencies
```
cd frontend
npm install
```
Run this once after cloning, and again whenever `package.json` changes.

### Backend — install dependencies
Maven downloads dependencies the first time you build/run; no extra step needed.

---

## 4. Daily Commands

### Backend (`/backend`)

| Command | Purpose |
|---------|---------|
| `mvn spring-boot:run` | Run the API server (port 8181) |
| `mvn clean install` | Clean rebuild + run tests |
| `mvn clean package -DskipTests` | Build the JAR without tests |
| `mvn test` | Run unit tests only |
| `java -jar target/movie-ticket-booking-0.0.1-SNAPSHOT.jar` | Run the packaged JAR directly |

### Frontend (`/frontend`)

| Command | Purpose |
|---------|---------|
| `npm install` | Install / update Node dependencies |
| `npm start` | Run dev server with hot-reload (port 4200) |
| `npm run build` | Production build into `dist/` |
| `npm run watch` | Dev build, rebuild on file changes |

### Database admin (any MySQL client)

| Action | Command |
|--------|---------|
| Connect | `mysql -u root -p` |
| Use DB | `USE movie_booking;` |
| List tables | `SHOW TABLES;` |
| Clear all data (full reset) | `DELETE FROM bookings; DELETE FROM shows; DELETE FROM movies; DELETE FROM users; DELETE FROM theaters;` |
| Drop and recreate | `DROP DATABASE movie_booking; CREATE DATABASE movie_booking;` |

---

## 5. URLs & Ports

| Service     | URL                                | Notes |
|-------------|------------------------------------|-------|
| Frontend    | http://localhost:4200              | Angular dev server |
| Backend API | http://localhost:8181/api          | REST endpoints |
| MySQL       | localhost:3306                     | Database: `movie_booking` |

Quick API smoke test once both are running:
```
curl http://localhost:8181/api/movies -H "X-User-Role: USER"
```

---

## 6. Feature Walkthrough — Moviegoer

### 6.1 Sign Up
1. Visit http://localhost:4200.
2. Click **Create Account** tab.
3. Pick the **🎬 Moviegoer** card.
4. Enter username (≥3 chars) and password (≥4 chars).
5. Click **Sign up & start booking** → auto-logged in.

### 6.2 Browse Movies
- **Hero carousel** auto-rotates through all movies.
- **Search box** filters by title as you type.
- **Genre chips** filter the grid.
- Each card shows: poster, title, genre, runtime, rating, price (₹).
- Top-ranked card gets a **★ Trending** badge.

### 6.3 Book Tickets
1. Click **Book Tickets →** on a card (or any card itself).
2. Pick a **showtime** — cards show theater name, time-until-show, seats left.
3. The **seat picker** appears:
   - Grey = available, Indigo = selected, Faded = booked.
   - Click seats to toggle. Aisle gap appears between cols 5 and 6.
4. The bottom bar updates: `Selected seats: A3, A4 · 2 × ₹250.00 = ₹500.00`.
5. Click **Confirm Booking** → redirected to My Bookings.

### 6.4 My Bookings
Three tabs with live counts:
- **Upcoming** — confirmed bookings whose show hasn't started.
- **Past** — confirmed bookings whose show has already happened.
- **Cancelled** — bookings you've cancelled (kept for records).

Each booking card shows:
- Movie title, poster, theater name + location.
- Show date/time, seat count + seat numbers, total paid.
- Status pill (CONFIRMED / CANCELLED).
- ⏰ **Starting soon** badge if the show is within 30 minutes.
- Booking reference (e.g. `BK-000042`).

### 6.5 Show Ticket (with QR)
1. Click **🎫 Show Ticket** on a confirmed booking.
2. A production-style cinema ticket modal opens:
   - Dark gradient header with `ADMIT ONE` tag.
   - Movie title, theater, show date/time, screen, total paid.
   - **Seats as bold indigo chips** (`A3` `A4`).
   - Perforated tear-line with notched circles.
   - **QR code** stub on the right encoding booking ref + show details.
3. Click **🖨 Print** to print only the ticket (rest of the page is hidden).

### 6.6 Cancel a Booking
1. Click **Cancel booking** on an upcoming confirmed booking.
2. Modal shows the refund math:
   - Amount paid, cancellation fee (% based on time-until-show), refund amount.
3. Click **Yes, cancel & refund** → seats are restored to the show, booking moves to the Cancelled tab.

### 6.7 30-Minute Reminder
- If any of your upcoming shows starts within 30 minutes, an **amber sticky banner** appears below the header on every page: `"Movie X" starts in 28 minute(s) — Seats A3,A4 · View ticket →`.
- Click **View ticket →** to jump to My Bookings.
- Click **×** to dismiss for that specific booking (persisted across page reloads).

---

## 7. Feature Walkthrough — Theater Owner (Admin)

### 7.1 Sign Up as Theater Owner
1. Visit http://localhost:4200 → **Create Account** → **🏛 Theater Owner** card.
2. Username + password + **theater name** + **location** (visible to moviegoers).
3. **Create theater & sign in** → auto-logged into the Admin Console.
4. Sidebar shows: **Managing: Your Theater Name**.

### 7.2 Manage Movies (global catalog)
> Movies are shared across all theaters — any admin can add/edit/delete. Shows and bookings are per-theater.

- **Add a Movie** (form on the top-left card):
  - Title (required), genre, duration (mins), default ticket price (₹), poster URL.
  - **Live preview pane** on the right updates as you type.
- **Existing Movies table**: ID, poster thumbnail, title, genre pill, duration, price, **Edit**, **Delete**.
- **Edit modal**: same fields pre-filled, with a live preview pane. Change the poster URL to swap the image; change the price; save.
- **Delete modal**: shows the **impact summary**:
  - Scheduled shows, upcoming shows, active bookings (across all theaters), cancelled bookings.
  - If active bookings > 0 → the delete button is disabled with an explanation.

### 7.3 Manage Shows (your theater only)
- **Schedule multiple shows per day** in one submission:
  1. Pick a **movie** from the horizontal poster card strip (selected card shows a ✓).
  2. Pick a **date** (must be today or later).
  3. Add as many **time slots** as you need with the `+ Add another time slot` button.
  4. Set ticket price (₹) and total seats.
  5. Click **Schedule N shows** → all created atomically.
- **Upcoming Shows table** shows only your theater's shows with status pills:
  - **Open** (green) — plenty of seats.
  - **Filling fast** (amber) — under 20% available.
  - **Sold out** (rose) — no seats left.
  - **Closed** (grey) — show time has passed.
- **Delete a show**: button per row. Blocked if any confirmed booking exists.

### 7.4 All Bookings (your theater only)
- **Four stat cards** at the top:
  - Total Bookings · Tickets Sold · Net Revenue · Refunded
- **Carousel** of most-booked movies.
- **Filter tabs**: All / Confirmed / Cancelled.
- Table columns: booking ref, user (with avatar initials), movie / show / theater, seats count + seat numbers, total, refund, status pill, booked timestamp.
- Cancelled rows render faded with rose status pill.

---

## 8. Cancellation & Refund Policy

| Time until show     | Outcome                                  |
|---------------------|------------------------------------------|
| **More than 24h**   | 90% refund (10% cancellation fee)        |
| **2 to 24 hours**   | 50% refund (50% cancellation fee)        |
| **Less than 2h**    | Cancellation blocked                     |
| **Show already started** | Cancellation blocked                |

The refund modal previews the exact ₹ amount before you confirm.

---

## 9. Troubleshooting

### Backend
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Access denied for user 'root'@'localhost'` | Wrong MySQL password | Update `application.properties` or your MySQL root password |
| `Port 8181 already in use` | Previous run still running | Stop the old process or change `server.port` |
| `Table 'movies' doesn't exist` | DB not created | `CREATE DATABASE movie_booking;` then restart backend |
| Schema-mismatch errors after pulling code | Old columns missing | Restart backend — Hibernate auto-adds new columns |

### Frontend
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Cannot find module '@angular/...'` | Dependencies missing | `npm install` |
| Blank page, console errors about CORS | Backend not running on 8181 | Start the backend first |
| `403 Forbidden` on admin pages | Logged in as USER, hit admin URL directly | Log in as a theater owner |
| Old movies/shows still showing after schema change | Cached data | Clear browser localStorage or open in incognito |

### Quick reset
Wipe everything and start over:
```sql
DELETE FROM bookings;
DELETE FROM shows;
DELETE FROM movies;
DELETE FROM users;
DELETE FROM theaters;
```
Then refresh the browser and register fresh accounts.


#good to go