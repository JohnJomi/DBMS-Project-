-- ============================================================
-- MIGRATION: London Underground Station-Based Fare System
-- Run once against metro_db
-- ============================================================

USE metro_db;

-- ─── 1. STATIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS stations (
    station_id   INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    zone         INT NOT NULL
);

-- ─── 2. ROUTE_STATIONS (ordered stops per line) ──────────────
CREATE TABLE IF NOT EXISTS route_stations (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    route_id   INT NOT NULL,
    station_id INT NOT NULL,
    stop_order INT NOT NULL,
    FOREIGN KEY (route_id)   REFERENCES routes(route_id),
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
);

-- ─── 3. ZONE FARE MATRIX ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS zone_fares (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    zone_min INT NOT NULL,
    zone_max INT NOT NULL,
    fare     DECIMAL(10,2) NOT NULL
);

-- ─── 4. ADD STATION COLUMNS TO TICKETS ───────────────────────
-- (run only if columns don't already exist; safe to ignore duplicate-column errors)
ALTER TABLE tickets ADD COLUMN from_station_id INT DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN to_station_id   INT DEFAULT NULL;

-- (Foreign keys — optional, skip if already exists)
-- ALTER TABLE tickets ADD FOREIGN KEY (from_station_id) REFERENCES stations(station_id);
-- ALTER TABLE tickets ADD FOREIGN KEY (to_station_id)   REFERENCES stations(station_id);

-- ─── 5. CLEAR OLD SEED DATA AND RESET METRO/ROUTES ───────────
DELETE FROM route_stations;
DELETE FROM stations;
DELETE FROM zone_fares;

-- Clear old metro/routes to reseed as London lines
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE route_stations;
TRUNCATE TABLE stations;
TRUNCATE TABLE zone_fares;
DELETE FROM routes;
DELETE FROM metro;
ALTER TABLE metro AUTO_INCREMENT = 1;
ALTER TABLE routes AUTO_INCREMENT = 1;
ALTER TABLE stations AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── 6. METRO (train fleets per line) ────────────────────────
INSERT INTO metro (metro_name, metro_num, metro_seat_num) VALUES
  ('Central Line Fleet',    'CLF-001', 240),
  ('Northern Line Fleet',   'NLF-002', 220),
  ('Jubilee Line Fleet',    'JLF-003', 230),
  ('Piccadilly Line Fleet', 'PLF-004', 210);

-- ─── 7. ROUTES (the 4 lines) ─────────────────────────────────
INSERT INTO routes (route_name, metro_id) VALUES
  ('Central Line',    1),
  ('Northern Line',   2),
  ('Jubilee Line',    3),
  ('Piccadilly Line', 4);

-- ─── 8. STATIONS (London Underground, with real zones) ───────

-- CENTRAL LINE stations (Zone 3 → 1 → 3, West to East)
INSERT INTO stations (station_name, zone) VALUES
  ('Ealing Broadway',    3),   -- 1
  ('Shepherd''s Bush',   2),   -- 2
  ('Notting Hill Gate',  1),   -- 3
  ('Oxford Circus',      1),   -- 4
  ('Tottenham Court Rd', 1),   -- 5
  ('Bank',               1),   -- 6
  ('Liverpool Street',   1),   -- 7
  ('Mile End',           2),   -- 8
  ('Stratford',          3);   -- 9

-- NORTHERN LINE stations (Zone 4 → 1 → 4, North to South)
INSERT INTO stations (station_name, zone) VALUES
  ('Edgware',              4),  -- 10
  ('Golders Green',        2),  -- 11
  ('Camden Town',          2),  -- 12
  ('Euston',               1),  -- 13
  ('King''s Cross',        1),  -- 14
  ('Charing Cross',        1),  -- 15
  ('London Bridge',        1),  -- 16
  ('Elephant & Castle',    2),  -- 17
  ('Stockwell',            2),  -- 18
  ('Morden',               4);  -- 19

-- JUBILEE LINE stations (Zone 4 → 1 → Z2, NW to SE)
INSERT INTO stations (station_name, zone) VALUES
  ('Stanmore',         4),   -- 20
  ('Wembley Park',     4),   -- 21
  ('Willesden Green',  2),   -- 22
  ('Swiss Cottage',    2),   -- 23
  ('Baker Street',     1),   -- 24
  ('Bond Street',      1),   -- 25
  ('Westminster',      1),   -- 26
  ('Waterloo',         1),   -- 27
  ('Bermondsey',       2),   -- 28
  ('Canary Wharf',     2);   -- 29

-- PICCADILLY LINE stations (Zone 6 → 1 → 5, W to NE)
INSERT INTO stations (station_name, zone) VALUES
  ('Heathrow Terminal 5', 6),   -- 30
  ('Hatton Cross',        5),   -- 31
  ('Hounslow East',       4),   -- 32
  ('Osterley',            4),   -- 33
  ('Hammersmith',         2),   -- 34
  ('Earl''s Court',       2),   -- 35
  ('Knightsbridge',       1),   -- 36
  ('Green Park',          1),   -- 37
  ('Piccadilly Circus',   1),   -- 38
  ('King''s Cross St P',  1),   -- 39
  ('Finsbury Park',       2),   -- 40
  ('Cockfosters',         5);   -- 41

-- ─── 9. ROUTE_STATIONS (ordered stops) ───────────────────────

-- Central Line (route_id = 1), stops 1-9
INSERT INTO route_stations (route_id, station_id, stop_order) VALUES
  (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5),
  (1, 6, 6), (1, 7, 7), (1, 8, 8), (1, 9, 9);

-- Northern Line (route_id = 2), stops 10-19
INSERT INTO route_stations (route_id, station_id, stop_order) VALUES
  (2, 10, 1), (2, 11, 2), (2, 12, 3), (2, 13, 4), (2, 14, 5),
  (2, 15, 6), (2, 16, 7), (2, 17, 8), (2, 18, 9), (2, 19, 10);

-- Jubilee Line (route_id = 3), stops 20-29
INSERT INTO route_stations (route_id, station_id, stop_order) VALUES
  (3, 20, 1), (3, 21, 2), (3, 22, 3), (3, 23, 4), (3, 24, 5),
  (3, 25, 6), (3, 26, 7), (3, 27, 8), (3, 28, 9), (3, 29, 10);

-- Piccadilly Line (route_id = 4), stops 30-41
INSERT INTO route_stations (route_id, station_id, stop_order) VALUES
  (4, 30, 1), (4, 31, 2), (4, 32, 3), (4, 33, 4), (4, 34, 5),
  (4, 35, 6), (4, 36, 7), (4, 37, 8), (4, 38, 9), (4, 39, 10),
  (4, 40, 11), (4, 41, 12);

-- ─── 10. ZONE FARE MATRIX (TfL-approximate, in £) ────────────
INSERT INTO zone_fares (zone_min, zone_max, fare) VALUES
  (1, 1, 2.80),
  (1, 2, 3.40),
  (1, 3, 3.90),
  (1, 4, 4.90),
  (1, 5, 5.60),
  (1, 6, 6.00),
  (2, 2, 2.00),
  (2, 3, 2.50),
  (2, 4, 3.00),
  (2, 5, 3.50),
  (2, 6, 4.20),
  (3, 3, 2.00),
  (3, 4, 2.50),
  (3, 5, 3.00),
  (3, 6, 3.50),
  (4, 4, 2.00),
  (4, 5, 2.50),
  (4, 6, 3.00),
  (5, 5, 2.00),
  (5, 6, 2.50),
  (6, 6, 2.00);

SELECT CONCAT('Migration complete. Stations: ', COUNT(*)) AS status FROM stations;
