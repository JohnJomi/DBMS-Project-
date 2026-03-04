// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// ─── Metro ────────────────────────────────────────────────────
// POST   /api/admin/metro           - Add metro
// PUT    /api/admin/metro/:id       - Update metro
// DELETE /api/admin/metro/:id       - Delete metro

router.get('/metro', adminController.getMetros);
router.post('/metro', adminController.addMetro);
router.put('/metro/:id', adminController.updateMetro);
router.delete('/metro/:id', adminController.deleteMetro);

// ─── Routes ───────────────────────────────────────────────────
// GET    /api/admin/routes          - List all routes
// POST   /api/admin/route           - Add route
// DELETE /api/admin/route/:id       - Delete route

router.get('/routes', adminController.getRoutes);
router.post('/route', adminController.addRoute);
router.delete('/route/:id', adminController.deleteRoute);
router.post('/station', adminController.addStation);

// ─── Users ────────────────────────────────────────────────────
// GET /api/admin/users              - View all users

router.get('/users', adminController.getAllUsers);

// ─── Reports ──────────────────────────────────────────────────
// GET /api/admin/reports            - Total tickets + revenue
// GET /api/admin/reports/routes     - Route-wise ticket count
// GET /api/admin/reports/monthly    - Monthly report

router.get('/reports', adminController.getReports);
router.get('/reports/routes', adminController.getRouteReport);
router.get('/reports/monthly', adminController.getMonthlyReport);
router.get('/seat-availability', adminController.getSeatAvailability);

module.exports = router;
