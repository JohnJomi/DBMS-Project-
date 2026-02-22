// controllers/userController.js
// User operations: Register, Book Ticket, View Tickets, Cancel Ticket
// + Stations by route, Zone-based fare lookup

const db = require('../db');

// ─── REGISTER ─────────────────────────────────────────────────

// POST /api/user/register
// Body: { user_name, user_email, user_mobile, user_address, password }
const registerUser = async (req, res) => {
    const { user_name, user_email, user_mobile, user_address, password } = req.body;

    if (!user_name || !user_email || !password) {
        return res.status(400).json({ error: 'user_name, user_email, and password are required.' });
    }

    try {
        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE user_email = ?', [user_email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        const [result] = await db.query(
            `INSERT INTO users (user_name, user_email, user_mobile, user_address, password, role_id)
             VALUES (?, ?, ?, ?, ?, 2)`,
            [user_name, user_email, user_mobile || '', user_address || '', password]
        );
        res.status(201).json({ message: 'User registered successfully.', user_id: result.insertId });
    } catch (err) {
        console.error('registerUser error:', err.message);
        res.status(500).json({ error: 'Failed to register user.' });
    }
};

// ─── GET STATIONS BY ROUTE ────────────────────────────────────

// GET /api/user/stations/:route_id
// Returns ordered stations on a given line, with zone info
const getStationsByRoute = async (req, res) => {
    const { route_id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT s.station_id, s.station_name, s.zone, rs.stop_order
             FROM route_stations rs
             INNER JOIN stations s ON rs.station_id = s.station_id
             WHERE rs.route_id = ?
             ORDER BY rs.stop_order ASC`,
            [route_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No stations found for this route.' });
        }

        res.json({ route_id: parseInt(route_id), stations: rows });
    } catch (err) {
        console.error('getStationsByRoute error:', err.message);
        res.status(500).json({ error: 'Failed to fetch stations.' });
    }
};

// ─── CALCULATE FARE ───────────────────────────────────────────

// GET /api/user/fare?from_station_id=&to_station_id=
// Looks up the zone of each station, then queries zone_fares
const calculateFare = async (req, res) => {
    const { from_station_id, to_station_id } = req.query;

    if (!from_station_id || !to_station_id) {
        return res.status(400).json({ error: 'from_station_id and to_station_id are required.' });
    }

    if (from_station_id === to_station_id) {
        return res.status(400).json({ error: 'From and To stations must be different.' });
    }

    try {
        // Fetch zones for both stations
        const [stations] = await db.query(
            `SELECT station_id, station_name, zone
             FROM stations
             WHERE station_id IN (?, ?)`,
            [from_station_id, to_station_id]
        );

        if (stations.length < 2) {
            return res.status(404).json({ error: 'One or both stations not found.' });
        }

        const from = stations.find(s => s.station_id == from_station_id);
        const to = stations.find(s => s.station_id == to_station_id);

        const zoneMin = Math.min(from.zone, to.zone);
        const zoneMax = Math.max(from.zone, to.zone);

        // Lookup fare in zone_fares matrix
        const [fareRows] = await db.query(
            'SELECT fare FROM zone_fares WHERE zone_min = ? AND zone_max = ?',
            [zoneMin, zoneMax]
        );

        if (fareRows.length === 0) {
            return res.status(404).json({ error: 'Fare not configured for these zones.' });
        }

        res.json({
            from_station: { id: from.station_id, name: from.station_name, zone: from.zone },
            to_station: { id: to.station_id, name: to.station_name, zone: to.zone },
            zone_min: zoneMin,
            zone_max: zoneMax,
            fare: parseFloat(fareRows[0].fare),
            currency: 'GBP'
        });
    } catch (err) {
        console.error('calculateFare error:', err.message);
        res.status(500).json({ error: 'Failed to calculate fare.' });
    }
};

// ─── BOOK TICKET ──────────────────────────────────────────────

// POST /api/user/book
// Body: { user_id, route_id, from_station_id, to_station_id, travel_date, travel_time }
// Fare is auto-calculated from zone_fares matrix
const bookTicket = async (req, res) => {
    const { user_id, route_id, from_station_id, to_station_id, travel_date, travel_time } = req.body;

    if (!user_id || !route_id || !from_station_id || !to_station_id || !travel_date || !travel_time) {
        return res.status(400).json({
            error: 'user_id, route_id, from_station_id, to_station_id, travel_date, and travel_time are required.'
        });
    }

    if (from_station_id === to_station_id) {
        return res.status(400).json({ error: 'From and To stations must be different.' });
    }

    const booking_date = `${travel_date} ${travel_time}:00`;

    try {
        // Verify user
        const [users] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

        // Verify route
        const [routes] = await db.query('SELECT route_id FROM routes WHERE route_id = ?', [route_id]);
        if (routes.length === 0) return res.status(404).json({ error: 'Route not found.' });

        // Verify both stations exist on this route
        const [stationCheck] = await db.query(
            `SELECT s.station_id, s.station_name, s.zone
             FROM stations s
             INNER JOIN route_stations rs ON s.station_id = rs.station_id
             WHERE rs.route_id = ? AND s.station_id IN (?, ?)`,
            [route_id, from_station_id, to_station_id]
        );
        if (stationCheck.length < 2) {
            return res.status(400).json({ error: 'Selected stations do not belong to this route.' });
        }

        // Calculate fare
        const fromSt = stationCheck.find(s => s.station_id == from_station_id);
        const toSt = stationCheck.find(s => s.station_id == to_station_id);
        const zoneMin = Math.min(fromSt.zone, toSt.zone);
        const zoneMax = Math.max(fromSt.zone, toSt.zone);

        const [fareRows] = await db.query(
            'SELECT fare FROM zone_fares WHERE zone_min = ? AND zone_max = ?',
            [zoneMin, zoneMax]
        );
        if (fareRows.length === 0) {
            return res.status(500).json({ error: 'Fare configuration missing for these zones.' });
        }

        const fare = parseFloat(fareRows[0].fare);

        // Insert ticket
        const [result] = await db.query(
            `INSERT INTO tickets (user_id, route_id, fare, booking_date, from_station_id, to_station_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, route_id, fare, booking_date, from_station_id, to_station_id]
        );

        res.status(201).json({
            message: 'Ticket booked successfully.',
            ticket_id: result.insertId,
            from_station: fromSt.station_name,
            to_station: toSt.station_name,
            fare,
            currency: 'GBP',
            booking_date
        });
    } catch (err) {
        console.error('bookTicket error:', err.message);
        res.status(500).json({ error: 'Failed to book ticket.' });
    }
};

// ─── VIEW MY TICKETS ──────────────────────────────────────────

// GET /api/user/tickets/:user_id
const getMyTickets = async (req, res) => {
    const { user_id } = req.params;

    try {
        const [users] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

        const [rows] = await db.query(
            `SELECT
                t.ticket_id,
                t.fare,
                t.booking_date,
                r.route_name,
                sf.station_name  AS from_station,
                st.station_name  AS to_station,
                sf.zone          AS from_zone,
                st.zone          AS to_zone,
                DATEDIFF(NOW(), t.booking_date) AS days_ago,
                MONTH(t.booking_date)           AS booking_month,
                YEAR(t.booking_date)            AS booking_year
             FROM tickets t
             INNER JOIN routes r  ON t.route_id         = r.route_id
             LEFT  JOIN stations sf ON t.from_station_id = sf.station_id
             LEFT  JOIN stations st ON t.to_station_id   = st.station_id
             WHERE t.user_id = ?
             ORDER BY t.booking_date DESC`,
            [user_id]
        );

        res.json({
            user_id: parseInt(user_id),
            tickets: rows,
            total_fare: rows.reduce((sum, t) => sum + parseFloat(t.fare), 0)
        });
    } catch (err) {
        console.error('getMyTickets error:', err.message);
        res.status(500).json({ error: 'Failed to fetch tickets.' });
    }
};

// ─── CANCEL TICKET ────────────────────────────────────────────

// DELETE /api/user/cancel/:id
const cancelTicket = async (req, res) => {
    const { id } = req.params;

    try {
        const [tickets] = await db.query('SELECT ticket_id FROM tickets WHERE ticket_id = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found.' });

        await db.query('DELETE FROM tickets WHERE ticket_id = ?', [id]);

        res.json({
            message: 'Ticket cancelled successfully.',
            ticket_id: parseInt(id),
            note: 'Cancellation logged automatically via database trigger.'
        });
    } catch (err) {
        console.error('cancelTicket error:', err.message);
        res.status(500).json({ error: 'Failed to cancel ticket.' });
    }
};

module.exports = { registerUser, getStationsByRoute, calculateFare, bookTicket, getMyTickets, cancelTicket };
