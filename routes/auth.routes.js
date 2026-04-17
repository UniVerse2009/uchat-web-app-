const express = require('express');
const router = express.Router();

const authService = require('../services/auth.service');

/* =========================
   LOGIN
========================= */
router.post('/login', async (req, res, next) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				error: 'Username and password are required'
			});
		}

		const user = await authService.login(username, password);

		req.session.userId = user.id;

		res.json({
			id: user.id,
			username: user.username
		});

	} catch (err) {
		next(err);
	}
});


/* =========================
   REGISTER
========================= */
router.post('/register', async (req, res, next) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				error: 'Username and password are required'
			});
		}

		const newUser = await authService.register(username, password);

		res.status(201).json({
			id: newUser.id,
			username: newUser.username
		});

	} catch (err) {
		next(err);
	}
});


/* =========================
   LOGOUT
========================= */
router.post('/logout', (req, res, next) => {
	req.session.destroy(err => {
		if (err) return next(err);

		res.clearCookie('chat.sid');
		res.json({ message: 'Logged out successfully' });
	});
});


/* =========================
   GET CURRENT USER
========================= */
router.get('/me', async (req, res, next) => {
	try {
		if (!req.session.userId) {
			return res.status(401).json({
				error: 'Unauthorized'
			});
		}

		const user = await authService.getById(req.session.userId);

		res.json({
			id: user.id,
			username: user.username
		});

	} catch (err) {
		next(err);
	}
});

module.exports = router;
