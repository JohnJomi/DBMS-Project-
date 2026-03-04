const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'metro_db',
        });

        // 1. Ensure tables exist without modifying schemas explicitly 
        await pool.query(`CREATE TABLE IF NOT EXISTS Passenger (passenger_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS Station (station_id INT AUTO_INCREMENT PRIMARY KEY, station_name VARCHAR(100) NOT NULL)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS Route (route_id INT AUTO_INCREMENT PRIMARY KEY, source_station INT, destination_station INT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS Ticket (ticket_id INT AUTO_INCREMENT PRIMARY KEY, passenger_id INT, route_id INT, travel_date DATETIME, fare DECIMAL(10,2), status VARCHAR(50))`);

        // 2. Safely insert minimal sample data if not exists
        const [passengers] = await pool.query('SELECT * FROM Passenger LIMIT 1');
        if (passengers.length === 0) {
            await pool.query("INSERT INTO Passenger (name) VALUES ('John Doe')");
            await pool.query("INSERT INTO Station (station_name) VALUES ('Central Station'), ('Airport Terminal')");
            await pool.query("INSERT INTO Route (source_station, destination_station) VALUES (1, 2)");
            await pool.query("INSERT INTO Ticket (passenger_id, route_id, travel_date, fare, status) VALUES (1, 1, '2026-03-01 10:00:00', 45.00, 'Confirmed')");
        }

        // 3. Execute User Query
        const query = `
SELECT p.name,
       s1.station_name AS source,
       s2.station_name AS destination,
       t.travel_date,
       t.fare,
       t.status
FROM Ticket t
JOIN Passenger p ON t.passenger_id = p.passenger_id
JOIN Route r ON t.route_id = r.route_id
JOIN Station s1 ON r.source_station = s1.station_id
JOIN Station s2 ON r.destination_station = s2.station_id;
        `.trim();

        console.log('--- EXECUTING QUERY ---\n');
        console.log(query);
        console.log('\n--- QUERY RESULT ---');

        const [rows] = await pool.query(query);
        console.table(rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
