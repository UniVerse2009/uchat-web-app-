const userRepo = require('../repositories/user.repo');

const createError = (status, message) => {
	const err = new Error(message);
	err.status = status;
	return err;
};


/* =========================
   GET CURRENT USER
========================= */
async function getCurrentUser(userId) {

	const user = await userRepo.findById(userId);

	if (!user) {
		throw createError(404, 'User not found');
	}

	return {
		id: user.id,
		username: user.username
	};
}


/* =========================
   GET USER BY ID
========================= */
async function getUserById(userId) {

	if (!userId || Number.isNaN(userId)) {
		throw createError(400, 'Invalid user id');
	}

	const user = await userRepo.findById(userId);

	if (!user) {
		throw createError(404, 'User not found');
	}

	return {
		id: user.id,
		username: user.username
	};
}


/* =========================
   SEARCH USERS
========================= */
async function searchUsers(searchTerm) {

	// Batasi supaya tidak jadi brute-force endpoint
	const users = await userRepo.searchByUsername(searchTerm, 10);

	return users.map(u => ({
		id: u.id,
		username: u.username
	}));
}


module.exports = {
	getCurrentUser,
	getUserById,
	searchUsers
};
