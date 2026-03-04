-- ============================================================
-- METRO TICKET MANAGEMENT SYSTEM
-- Full SQL Script - metro_db.sql
-- Covers: DDL, DML, DCL, TCL, Joins, Views, Triggers,
--         Cursor, Aggregate/String/Date Functions, Clauses
-- ============================================================

-- ============================================================
-- DDL: CREATE DATABASE
-- ============================================================
CREATE DATABASE IF NOT EXISTS metro_db;
USE metro_db;

-- ============================================================
-- DDL: CREATE TABLE - roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50)  NOT NULL,
    role_desc VARCHAR(255)
);

-- ============================================================
-- DDL: CREATE TABLE - users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_name    VARCHAR(100) NOT NULL,
    user_email   VARCHAR(100) NOT NULL UNIQUE,
    user_mobile  VARCHAR(15),
    user_address VARCHAR(255),
    password     VARCHAR(100) NOT NULL,
    role_id      INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ============================================================
-- DDL: CREATE TABLE - permission
-- ============================================================
CREATE TABLE IF NOT EXISTS permission (
    per_id     INT AUTO_INCREMENT PRIMARY KEY,
    per_name   VARCHAR(100) NOT NULL,
    per_module VARCHAR(100),
    role_id    INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ============================================================
-- DDL: CREATE TABLE - metro
-- ============================================================
CREATE TABLE IF NOT EXISTS metro (
    metro_id       INT AUTO_INCREMENT PRIMARY KEY,
    metro_name     VARCHAR(100) NOT NULL,
    metro_num      VARCHAR(50)  NOT NULL,
    metro_seat_num INT          NOT NULL
);

-- ============================================================
-- DDL: CREATE TABLE - routes
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
    route_id   INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    metro_id   INT,
    FOREIGN KEY (metro_id) REFERENCES metro(metro_id)
);

-- ============================================================
-- DDL: CREATE TABLE - tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT,
    route_id     INT,
    metro_id     INT,
    fare         DECIMAL(10,2) NOT NULL,
    booking_date DATETIME,
    FOREIGN KEY (user_id)  REFERENCES users(user_id),
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (metro_id) REFERENCES metro(metro_id)
);

-- ============================================================
-- DDL: CREATE TABLE - ticket_log
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_log (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id    INT,
    deleted_date DATETIME
);

-- ============================================================
-- DDL: ALTER TABLE - add a column, then drop it (demo)
-- ============================================================
ALTER TABLE metro ADD COLUMN metro_status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE metro DROP COLUMN metro_status;

-- ============================================================
-- DCL: GRANT & REVOKE
-- ============================================================
-- NOTE: Run these as a superuser. Adjust host as needed.
-- CREATE USER IF NOT EXISTS 'metro_user'@'localhost' IDENTIFIED BY 'Metro@123';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON metro_db.* TO 'metro_user'@'localhost';
-- REVOKE DELETE ON metro_db.* FROM 'metro_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================
-- DML: INSERT - Seed Data
-- ============================================================

-- Roles
START TRANSACTION;
INSERT INTO roles (role_name, role_desc) VALUES
    ('Admin', 'Full system access'),
    ('User',  'Passenger / ticket booker');
COMMIT;

-- Users (Admin + Sample Users)
START TRANSACTION;
SAVEPOINT sp_users;

INSERT INTO users (user_name, user_email, user_mobile, user_address, password, role_id) VALUES
    ('Admin',       'admin@metro.com',   '9000000001', 'Metro HQ',      'admin123',  1),
    ('Alice Kumar', 'alice@gmail.com',   '9000000002', 'Sector 12',     'alice123',  2),
    ('Bob Singh',   'bob@gmail.com',     '9000000003', 'Sector 5',      'bob123',    2),
    ('Carol Das',   'carol@gmail.com',   '9000000004', 'MG Road',       'carol123',  2),
    ('Dave Roy',    'dave@gmail.com',    '9000000005', 'Park Street',   'dave123',   2),
    ('Eve Sharma',  'eve@gmail.com',     '9000000006', 'Salt Lake',     'eve123',    2);

COMMIT;

-- Permissions
INSERT INTO permission (per_name, per_module, role_id) VALUES
    ('Manage Metro',  'Metro',   1),
    ('Manage Routes', 'Routes',  1),
    ('View Reports',  'Reports', 1),
    ('Book Ticket',   'Tickets', 2),
    ('View Tickets',  'Tickets', 2);

-- Metro trains
INSERT INTO metro (metro_name, metro_num, metro_seat_num) VALUES
    ('Blue Line Express', 'BL-01', 200),
    ('Red Line Rapid',    'RL-02', 180),
    ('Green Line Local',  'GL-03', 150);

-- Routes
INSERT INTO routes (route_name, metro_id) VALUES
    ('Airport to City Center',       1),
    ('City Center to Suburb North',  1),
    ('University to Mall',           2),
    ('Mall to Station',              2),
    ('Park to Downtown',             3);

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Trigger 1: BEFORE INSERT on tickets → auto-set booking_date + auto-set metro_id from route + decrement seats
CREATE TRIGGER before_ticket_insert
BEFORE INSERT ON tickets
FOR EACH ROW
BEGIN
    DECLARE v_metro_id INT;
    DECLARE v_seats INT;

    SET NEW.booking_date = NOW();

    -- Auto-set metro_id from the route
    SELECT metro_id INTO v_metro_id FROM routes WHERE route_id = NEW.route_id;
    SET NEW.metro_id = v_metro_id;

    -- Check seat availability
    SELECT metro_seat_num INTO v_seats FROM metro WHERE metro_id = v_metro_id;
    IF v_seats <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Metro is full. No seats available.';
    END IF;

    -- Decrement available seats
    UPDATE metro SET metro_seat_num = metro_seat_num - 1 WHERE metro_id = v_metro_id;
END$$

-- Trigger 2: AFTER DELETE on tickets → log into ticket_log + increment seats back
CREATE TRIGGER after_ticket_delete
AFTER DELETE ON tickets
FOR EACH ROW
BEGIN
    INSERT INTO ticket_log (ticket_id, deleted_date)
    VALUES (OLD.ticket_id, NOW());

    -- Increment available seats back when ticket is cancelled
    UPDATE metro SET metro_seat_num = metro_seat_num + 1 WHERE metro_id = OLD.metro_id;
END$$

DELIMITER ;

-- ============================================================
-- DML: INSERT Tickets (booking_date auto-set by trigger)
-- ============================================================
START TRANSACTION;
SAVEPOINT sp_tickets;

INSERT INTO tickets (user_id, route_id, fare) VALUES
    (2, 1, 50.00),
    (2, 2, 30.00),
    (3, 3, 45.00),
    (4, 4, 25.00),
    (5, 5, 60.00),
    (6, 1, 50.00),
    (3, 2, 30.00),
    (4, 3, 45.00),
    (5, 4, 25.00),
    (6, 5, 60.00);

COMMIT;

-- ============================================================
-- TCL: ROLLBACK demonstration
-- ============================================================
START TRANSACTION;
SAVEPOINT sp_demo;
INSERT INTO tickets (user_id, route_id, fare) VALUES (2, 1, 999.00); -- demo row
ROLLBACK TO SAVEPOINT sp_demo;      -- undo the demo row
COMMIT;

-- ============================================================
-- DDL: TRUNCATE (demo on ticket_log, safe to truncate)
-- ============================================================
TRUNCATE TABLE ticket_log;

-- Re-populate ticket_log after truncate (demo delete → trigger fires)
-- We delete one ticket and the AFTER DELETE trigger auto-inserts into ticket_log
DELETE FROM tickets WHERE ticket_id = 10;

-- ============================================================
-- VIEW: user_ticket_view
-- ============================================================
CREATE OR REPLACE VIEW user_ticket_view AS
SELECT
    u.user_id,
    u.user_name,
    u.user_email,
    r.route_name,
    t.ticket_id,
    t.fare,
    t.booking_date
FROM tickets t
INNER JOIN users  u ON t.user_id  = u.user_id
INNER JOIN routes r ON t.route_id = r.route_id;

-- ============================================================
-- STORED PROCEDURE WITH CURSOR
-- Loops through tickets, totals fare per user
-- ============================================================
DELIMITER $$

CREATE PROCEDURE GetFarePerUser()
BEGIN
    DECLARE done      INT DEFAULT 0;
    DECLARE v_user_id INT;
    DECLARE v_total   DECIMAL(10,2);
    DECLARE v_name    VARCHAR(100);

    -- Cursor over grouped result
    DECLARE fare_cursor CURSOR FOR
        SELECT t.user_id, u.user_name, SUM(t.fare) AS total_fare
        FROM tickets t
        INNER JOIN users u ON t.user_id = u.user_id
        GROUP BY t.user_id, u.user_name;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN fare_cursor;

    read_loop: LOOP
        FETCH fare_cursor INTO v_user_id, v_name, v_total;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;
        -- Print result for each user inside the loop
        SELECT v_user_id AS UserID, v_name AS UserName, v_total AS TotalFare;
    END LOOP;

    CLOSE fare_cursor;
END$$

DELIMITER ;

-- Call the procedure:
-- CALL GetFarePerUser();

-- ============================================================
-- DML: UPDATE & DELETE
-- ============================================================
UPDATE metro SET metro_seat_num = 210 WHERE metro_id = 1;
UPDATE users SET user_address = TRIM('  Sector 12 Updated  ') WHERE user_id = 2;

-- ============================================================
-- SELECT with all required Clauses & Functions
-- ============================================================

-- WHERE
SELECT * FROM tickets WHERE fare > 30;

-- DISTINCT
SELECT DISTINCT route_id FROM tickets;

-- ORDER BY
SELECT * FROM tickets ORDER BY fare DESC;

-- GROUP BY + HAVING
SELECT route_id, COUNT(*) AS ticket_count, SUM(fare) AS total_fare
FROM tickets
GROUP BY route_id
HAVING total_fare > 50;

-- LIKE
SELECT * FROM users WHERE user_name LIKE 'A%';

-- IN
SELECT * FROM routes WHERE metro_id IN (1, 2);

-- BETWEEN
SELECT * FROM tickets WHERE fare BETWEEN 25 AND 55;

-- ============================================================
-- JOINS
-- ============================================================

-- INNER JOIN
SELECT u.user_name, r.route_name, t.fare, t.booking_date
FROM tickets t
INNER JOIN users  u ON t.user_id  = u.user_id
INNER JOIN routes r ON t.route_id = r.route_id;

-- LEFT JOIN (all routes, even with no tickets)
SELECT r.route_name, COUNT(t.ticket_id) AS total_tickets
FROM routes r
LEFT JOIN tickets t ON r.route_id = t.route_id
GROUP BY r.route_name;

-- RIGHT JOIN (all users, even with no tickets)
SELECT u.user_name, t.ticket_id, t.fare
FROM tickets t
RIGHT JOIN users u ON t.user_id = u.user_id;

-- SELF JOIN (users sharing same role)
SELECT a.user_name AS User1, b.user_name AS User2, a.role_id
FROM users a
INNER JOIN users b ON a.role_id = b.role_id AND a.user_id < b.user_id;

-- ============================================================
-- AGGREGATE FUNCTIONS
-- ============================================================
SELECT
    COUNT(*)   AS total_tickets,
    SUM(fare)  AS total_revenue,
    AVG(fare)  AS avg_fare,
    MAX(fare)  AS max_fare,
    MIN(fare)  AS min_fare
FROM tickets;

-- ============================================================
-- STRING FUNCTIONS
-- ============================================================
SELECT
    UPPER(user_name)              AS upper_name,
    LOWER(user_email)             AS lower_email,
    SUBSTRING(user_name, 1, 5)   AS name_sub,
    LENGTH(user_name)             AS name_len,
    CONCAT(user_name, ' - ', user_email) AS full_info,
    TRIM(user_address)            AS clean_address
FROM users;

-- ============================================================
-- DATE FUNCTIONS
-- ============================================================
SELECT
    ticket_id,
    booking_date,
    NOW()                            AS `current_time`,
    DATEDIFF(NOW(), booking_date)    AS days_since_booking,
    MONTH(booking_date)              AS booking_month,
    YEAR(booking_date)               AS booking_year
FROM tickets;

-- ============================================================
-- QUERY THE VIEW
-- ============================================================
SELECT * FROM user_ticket_view;

-- ============================================================
-- MONTHLY REPORT using MONTH()
-- ============================================================
SELECT
    MONTH(booking_date)  AS booking_month,
    YEAR(booking_date)   AS booking_year,
    COUNT(ticket_id)     AS tickets_sold,
    SUM(fare)            AS monthly_revenue
FROM tickets
GROUP BY YEAR(booking_date), MONTH(booking_date)
ORDER BY booking_year, booking_month;

-- ============================================================
-- DDL: DROP TABLE (demo - commented out to preserve data)
-- ============================================================
-- DROP TABLE IF EXISTS ticket_log;
-- DROP TABLE IF EXISTS tickets;
-- DROP TABLE IF EXISTS routes;
-- DROP TABLE IF EXISTS metro;
-- DROP TABLE IF EXISTS permission;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS roles;
