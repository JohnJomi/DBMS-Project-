// controllers/adminController.js
// All admin operations: Metro, Routes, Users, Reports

const db = require('../db');

// ─── METRO ────────────────────────────────────────────────────

// POST /api/admin/metro
// Body: { metro_name, metro_num, metro_seat_num }
const addMetro = async (req, res) => {
    const { metro_name, metro_num, metro_seat_num } = req.body;
    if (!metro_name || !metro_num || !metro_seat_num) {
        return res.status(400).json({ error: 'All metro fields are required.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO metro (metro_name, metro_num, metro_seat_num) VALUES (?, ?, ?)',
            [metro_name, metro_num, metro_seat_num]
        );
        res.status(201).json({ message: 'Metro added.', metro_id: result.insertId });
    } catch (err) {
        console.error('addMetro error:', err.message);
        res.status(500).json({ error: 'Failed to add metro.' });
    }
};

// PUT /api/admin/metro/:id
// Body: { metro_name, metro_num, metro_seat_num }
const updateMetro = async (req, res) => {
    const { id } = req.params;
    const { metro_name, metro_num, metro_seat_num } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE metro SET metro_name = ?, metro_num = ?, metro_seat_num = ? WHERE metro_id = ?',
            [metro_name, metro_num, metro_seat_num, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Metro not found.' });
        }
        res.json({ message: 'Metro updated successfully.' });
    } catch (err) {
        console.error('updateMetro error:', err.message);
        res.status(500).json({ error: 'Failed to update metro.' });
    }
};

// DELETE /api/admin/metro/:id
const deleteMetro = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if any routes use this metro
        const [routes] = await db.query(
            'SELECT route_id FROM routes WHERE metro_id = ?', [id]
        );
        if (routes.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete metro. There are routes assigned to it.'
            });
        }
        const [result] = await db.query(
            'DELETE FROM metro WHERE metro_id = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Metro not found.' });
        }
        res.json({ message: 'Metro deleted successfully.' });
    } catch (err) {
        console.error('deleteMetro error:', err.message);
        res.status(500).json({ error: 'Failed to delete metro.' });
    }
};

// ─── ROUTES ───────────────────────────────────────────────────

// POST /api/admin/route
// Body: { route_name, metro_id }
const addRoute = async (req, res) => {
    const { route_name, metro_id } = req.body;
    if (!route_name || !metro_id) {
        return res.status(400).json({ error: 'route_name and metro_id are required.' });
    }
    try {
        // Verify metro exists
        const [metros] = await db.query(
            'SELECT metro_id FROM metro WHERE metro_id = ?', [metro_id]
        );
        if (metros.length === 0) {
            return res.status(404).json({ error: 'Metro not found.' });
        }
        const [result] = await db.query(
            'INSERT INTO routes (route_name, metro_id) VALUES (?, ?)',
            [route_name, metro_id]
        );
        res.status(201).json({ message: 'Route added.', route_id: result.insertId });
    } catch (err) {
        console.error('addRoute error:', err.message);
        res.status(500).json({ error: 'Failed to add route.' });
    }
};

// DELETE /api/admin/route/:id
const deleteRoute = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if tickets exist on this route
        const [tickets] = await db.query(
            'SELECT ticket_id FROM tickets WHERE route_id = ?', [id]
        );
        if (tickets.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete route. Active tickets exist on this route.'
            });
        }
        const [result] = await db.query(
            'DELETE FROM routes WHERE route_id = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Route not found.' });
        }
        res.json({ message: 'Route deleted successfully.' });
    } catch (err) {
        console.error('deleteRoute error:', err.message);
        res.status(500).json({ error: 'Failed to delete route.' });
    }
};

// GET /api/admin/metro
const getMetros = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM metro ORDER BY metro_id');
        res.json({ metros: rows });
    } catch (err) {
        console.error('getMetros error:', err.message);
        res.status(500).json({ error: 'Failed to fetch metros.' });
    }
};

// GET /api/admin/routes
const getRoutes = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.route_id, r.route_name, r.metro_id, m.metro_name
             FROM routes r
             LEFT JOIN metro m ON r.metro_id = m.metro_id
             ORDER BY r.route_id`
        );
        res.json({ routes: rows });
    } catch (err) {
        console.error('getRoutes error:', err.message);
        res.status(500).json({ error: 'Failed to fetch routes.' });
    }
};

// POST /api/admin/station
// Body: { route_id, station_name, zone }
const addStation = async (req, res) => {
    const { route_id, station_name, zone } = req.body;
    if (!route_id || !station_name || !zone) {
        return res.status(400).json({ error: 'route_id, station_name, and zone are required.' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert Station
        const [stationResult] = await connection.query(
            'INSERT INTO stations (station_name, zone) VALUES (?, ?)',
            [station_name, zone]
        );
        const stationId = stationResult.insertId;

        // 2. Get next stop order for this route
        const [orderResult] = await connection.query(
            'SELECT MAX(stop_order) as max_order FROM route_stations WHERE route_id = ?',
            [route_id]
        );
        const nextOrder = (orderResult[0].max_order || 0) + 1;

        // 3. Link Station to Route
        await connection.query(
            'INSERT INTO route_stations (route_id, station_id, stop_order) VALUES (?, ?, ?)',
            [route_id, stationId, nextOrder]
        );

        await connection.commit();
        res.status(201).json({ message: 'Station added successfully.', station_id: stationId });
    } catch (err) {
        await connection.rollback();
        console.error('addStation error:', err.message);
        res.status(500).json({ error: 'Failed to add station.' });
    } finally {
        connection.release();
    }
};


// ─── USERS ────────────────────────────────────────────────────

// GET /api/admin/users
// Returns all users with their role names (LEFT JOIN)
const getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                u.user_id,
                UPPER(u.user_name)   AS user_name,
                LOWER(u.user_email)  AS user_email,
                u.user_mobile,
                u.user_address,
                r.role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.role_id
             ORDER BY u.user_id`
        );
        res.json({ users: rows });
    } catch (err) {
        console.error('getAllUsers error:', err.message);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

// ─── REPORTS ──────────────────────────────────────────────────

// GET /api/admin/reports
// Total tickets sold + total revenue
const getReports = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                COUNT(ticket_id)  AS total_tickets,
                SUM(fare)         AS total_revenue,
                AVG(fare)         AS avg_fare,
                MAX(fare)         AS max_fare,
                MIN(fare)         AS min_fare
             FROM tickets`
        );
        res.json({ report: rows[0] });
    } catch (err) {
        console.error('getReports error:', err.message);
        res.status(500).json({ error: 'Failed to fetch report.' });
    }
};

// GET /api/admin/reports/routes
// Route-wise ticket count and revenue (GROUP BY + HAVING + INNER JOIN)
const getRouteReport = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                r.route_name,
                m.metro_name,
                COUNT(t.ticket_id) AS ticket_count,
                SUM(t.fare)        AS total_revenue
             FROM tickets t
             INNER JOIN routes r ON t.route_id = r.route_id
             INNER JOIN metro  m ON r.metro_id  = m.metro_id
             GROUP BY r.route_id, r.route_name, m.metro_name
             HAVING ticket_count > 0
             ORDER BY total_revenue DESC`
        );
        res.json({ route_report: rows });
    } catch (err) {
        console.error('getRouteReport error:', err.message);
        res.status(500).json({ error: 'Failed to fetch route report.' });
    }
};

// GET /api/admin/reports/monthly
// Monthly ticket count and revenue using MONTH() and YEAR()
const getMonthlyReport = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                YEAR(booking_date)  AS booking_year,
                MONTH(booking_date) AS booking_month,
                COUNT(ticket_id)    AS tickets_sold,
                SUM(fare)           AS monthly_revenue,
                AVG(fare)           AS avg_fare
             FROM tickets
             GROUP BY YEAR(booking_date), MONTH(booking_date)
             ORDER BY booking_year DESC, booking_month DESC`
        );
        res.json({ monthly_report: rows });
    } catch (err) {
        console.error('getMonthlyReport error:', err.message);
        res.status(500).json({ error: 'Failed to fetch monthly report.' });
    }
};

module.exports = {
    getMetros,
    getRoutes,
    addMetro,
    updateMetro,
    deleteMetro,
    addRoute,
    deleteRoute,
    getAllUsers,
    getReports,
    getRouteReport,
    getMonthlyReport,
    addStation
};
