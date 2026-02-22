// routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST   /api/user/register                    - Register new user
// GET    /api/user/stations/:route_id           - Get ordered stations for a line
// GET    /api/user/fare?from_station_id=&to=   - Zone-based fare lookup
// POST   /api/user/book                         - Book a ticket (fare auto-calculated)
// GET    /api/user/tickets/:user_id             - View my tickets
// DELETE /api/user/cancel/:id                   - Cancel a ticket

router.post('/register', userController.registerUser);
router.get('/stations/:route_id', userController.getStationsByRoute);
router.get('/fare', userController.calculateFare);
router.post('/book', userController.bookTicket);
router.get('/tickets/:user_id', userController.getMyTickets);
router.delete('/cancel/:id', userController.cancelTicket);

module.exports = router;
