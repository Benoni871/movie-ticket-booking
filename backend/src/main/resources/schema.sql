-- No user seeds. Movies/shows/theaters are created via the UI (sign-up + admin actions).

-- Default theater used to backfill any pre-existing shows that don't have a theater yet
-- (so older dev databases don't break after the multi-tenant migration).
INSERT IGNORE INTO theaters (id, name, location, owner_user_id) VALUES
  (1, 'Default Cinema', 'Downtown', NULL);

UPDATE shows SET theater_id = 1 WHERE theater_id IS NULL;

-- Backfill status for any older booking rows created before the column existed
UPDATE bookings SET status = 'CONFIRMED' WHERE status IS NULL;
