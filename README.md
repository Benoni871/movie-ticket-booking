# CineBook — Multi-Tenant Movie Ticket Booking

A full-stack movie ticket booking platform supporting **multiple theater owners** (each ADMIN runs their own cinema) and **self-service moviegoer signup**.

- **Frontend:** Angular 17 (standalone components) + Tailwind CSS
- **Backend:** Spring Boot 3.3 (Java 21) + Spring Data JPA
- **Database:** MySQL 8

Backend runs on **http://localhost:8181**, frontend on **http://localhost:4200**.

---

## Architecture

| Entity   | Scope                                                                 |
|----------|-----------------------------------------------------------------------|
| User     | Self-registered. Role = USER (moviegoer) or ADMIN (theater owner).    |
| Theater  | Created at admin signup. Each admin owns exactly one.                 |
| Movie    | **Global catalog.** Any admin can add / edit / delete movies.         |
| Show     | **Per-theater.** Only the owning admin can manage their shows.        |
| Booking  | Linked to a show (and so a theater). Cancellable per policy.          |

Real-world parallel: movies are universal titles; theaters license screenings of them.

---

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8 running locally on port 3306

---

## 1. Database setup

Create the database (the app auto-creates it on first start if `createDatabaseIfNotExist=true`):

```sql
CREATE DATABASE IF NOT EXISTS movie_booking;
```

Hibernate auto-evolves the schema (`ddl-auto=update`). `schema.sql`:
- Creates a "Default Cinema" placeholder theater (id=1)
- Backfills any orphan shows / bookings from earlier dev runs
- **Does NOT seed any users** — everyone registers via the UI

Update `backend/src/main/resources/application.properties` if your MySQL root password isn't `Sushu@23`.

---

## 2. Run the backend

```
cd backend
mvn spring-boot:run
```
Starts on **http://localhost:8181**.

---

## 3. Run the frontend

```
cd frontend
npm install
npm start
```
Opens at **http://localhost:4200**.

---

## 4. First-time flow

1. Go to http://localhost:4200 → click **Create Account**.
2. **Theater Owner** signup:
   - Username + password + theater name + location.
   - Auto-logs you into the Admin Console showing your theater name in the sidebar.
   - Add movies (global catalog), schedule shows (your theater).
3. Open a second browser → **Create Account** → **Moviegoer**.
   - Username + password.
   - Lands on the user side, sees the movies the theater owner added.
   - Picks a showtime (theater name visible), books seats.
4. As the theater owner, open **All Bookings** → see the new reservation.

Open a third browser → register another **Theater Owner** with a different theater. Both admins see the same global movie catalog but only their own shows + bookings.

---

## 5. API surface

| Method | Path                              | Access     | Notes                                              |
|--------|-----------------------------------|------------|----------------------------------------------------|
| POST   | `/api/auth/login`                 | public     | returns `{id, username, role, theaterId, …}`       |
| POST   | `/api/auth/register`              | public     | self-signup as USER                                |
| POST   | `/api/auth/register-admin`        | public     | self-signup as ADMIN + creates a Theater           |
| POST   | `/api/auth/setup-theater`         | admin self | legacy admin without theater → create one          |
| GET    | `/api/movies`                     | USER+      | global movie catalog                               |
| POST   | `/api/movies`                     | ADMIN      | any admin can add                                  |
| PUT    | `/api/movies/{id}`                | ADMIN      | edit (incl. poster URL)                            |
| DELETE | `/api/movies/{id}`                | ADMIN      | blocked if any confirmed bookings anywhere         |
| GET    | `/api/shows?movieId=`             | USER+      | all shows of a movie, across all theaters          |
| GET    | `/api/shows/all`                  | ADMIN      | **scoped to admin's own theater**                  |
| POST   | `/api/shows`                      | ADMIN      | creates in admin's theater                         |
| POST   | `/api/shows/bulk`                 | ADMIN      | multiple shows in one day                          |
| DELETE | `/api/shows/{id}`                 | ADMIN      | only own theater's shows; blocked if confirmed booking exists |
| GET    | `/api/shows/{id}/booked-seats`    | USER+      | for the seat picker                                |
| POST   | `/api/bookings`                   | USER+      | transactional seat decrement; blocked past showtime |
| GET    | `/api/bookings/user/{userId}`     | USER+      | user's own bookings                                |
| GET    | `/api/bookings`                   | ADMIN      | **scoped to admin's own theater**                  |
| POST   | `/api/bookings/{id}/cancel`       | USER/ADMIN | enforces 2h cutoff + computes refund               |

Auth: every request carries `X-User-Role` (and `X-User-Id`) from the Angular interceptor. The Spring `RoleInterceptor` enforces role on protected paths; ownership checks happen in the service layer.

---

## 6. Cancellation policy

| Time until show | Outcome                       |
|-----------------|-------------------------------|
| > 24 hours      | 90% refund (10% fee)          |
| 2 – 24 hours    | 50% refund (50% fee)          |
| < 2 hours       | Cancellation blocked          |
| Already started | Cancellation blocked          |

---

## 7. Tested scenarios

- Two admins each running their own theater see only their own shows + bookings.
- A USER books the same movie at Theater A; Theater B admin can't see that booking.
- 30-minute reminder banner fires globally for any user with an upcoming booking.
- Booking past-show: blocked server-side with a friendly error.
- Movie deletion blocked when any confirmed booking exists anywhere.
- Cancelled bookings restore seats and free them from the booked-seats aggregation.

---

## Demo-only shortcuts (NOT for production)

- Plaintext passwords (use BCrypt in production).
- Header-based auth (use JWT or session cookies in production).
- Anyone can self-register as an admin (in production this would require business verification).
- Global movie catalog with shared write access (in production this would be per-tenant or owner-restricted).
