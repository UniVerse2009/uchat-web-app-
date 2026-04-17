const express = require('express');
const router = express.Router();

const userService = require('../services/user.service');
const requireAuth = require('../middlewares/auth');


/* =========================
   GET CURRENT USER
========================= */
router.get('/me', requireAuth, async (req, res, next) => {
	try {
		const userId = req.session.userId;

		const user = await userService.getCurrentUser(userId);

		res.json(user);
	} catch (err) {
		next(err);
	}
});


/* =========================
   SEARCH USER
   GET /users?search=abc
========================= */
router.get('/', requireAuth, async (req, res, next) => {
	try {
		const { search } = req.query;

		if (!search || search.trim().length < 2) {
			return res.json([]);
		}

		const users = await userService.searchUsers(search.trim());

		res.json(users);
	} catch (err) {
		next(err);
	}
});


/* =========================
   GET USER BY ID
========================= */
router.get('/:id', requireAuth, async (req, res, next) => {
	try {
		const userId = Number(req.params.id);

		const user = await userService.getUserById(userId);

		res.json(user);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
