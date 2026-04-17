const bcrypt = require('bcrypt');
const userRepo = require('../repositories/user.repo');

/* =========================
   UTIL: Build Error
========================= */
function buildError(message, status = 400) {
	const error = new Error(message);
	error.status = status;
	return error;
}

/* =========================
   LOGIN
========================= */
async function login(username, password) {

	if (!username || !password) {
		throw buildError('Username and password are required', 400);
	}

	const user = await userRepo.findByUsername(username);

	if (!user) {
		throw buildError('Invalid credentials', 401);
	}

	const match = await bcrypt.compare(password, user.password_hash);

	if (!match) {
		throw buildError('Invalid credentials', 401);
	}

	return sanitizeUser(user);
}

/* =========================
   REGISTER
========================= */
async function register(username, password) {

	if (!username || !password) {
		throw buildError('Username and password are required', 400);
	}

	if (password.length < 6) {
		throw buildError('Password must be at least 6 characters', 400);
	}

	const existing = await userRepo.findByUsername(username);

	if (existing) {
		throw buildError('Username already taken', 409);
	}

	const hash = await bcrypt.hash(password, 10);

	const newUser = await userRepo.create(username, hash);

	return sanitizeUser(newUser);
}

/* =========================
   GET BY ID
========================= */
async function getById(id) {

	if (!id) {
		throw buildError('User id is required', 400);
	}

	const user = await userRepo.findById(id);

	if (!user) {
		throw buildError('User not found', 404);
	}

	return sanitizeUser(user);
}

/* =========================
   SANITIZE
========================= */
function sanitizeUser(user) {
	return {
		id: user.id,
		username: user.username
	};
}

module.exports = {
	login,
	register,
	getById
};
