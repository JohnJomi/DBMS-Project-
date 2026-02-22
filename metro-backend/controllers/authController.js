// controllers/authController.js
// Handles Admin and User login (no JWT, no hashing)

const db = require('../db');

// POST /api/auth/login
// Body: { email, password }
// Returns: user info + role
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const [rows] = await db.query(
            `SELECT u.user_id, u.user_name, u.user_email, u.role_id,
                    r.role_name
             FROM users u
             INNER JOIN roles r ON u.role_id = r.role_id
             WHERE u.user_email = ? AND u.password = ?`,
            [email, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = rows[0];
        res.json({
            message: 'Login successful.',
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                email: user.user_email,
                role_id: user.role_id,
                role: user.role_name
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
};

module.exports = { login };
