const db = require("../../config/postgresql_database");

/* =========================
   FIND BY USERNAME
========================= */
async function findByUsername(username) {
	const result = await db.query(
		`SELECT id, username, password_hash
		 FROM users
		 WHERE username = $1
		 LIMIT 1`,
		[username]
	);

	return result.rows[0] || null;
}

/* =========================
   FIND BY ID
========================= */
async function findById(id) {
	const result = await db.query(
		`SELECT id, username
		 FROM users
		 WHERE id = $1
		 LIMIT 1`,
		[id]
	);

	return result.rows[0] || null;
}

/* =========================
   CREATE USER
========================= */
async function create(username, hashedPassword) {
	const result = await db.query(
		`INSERT INTO users (username, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, username`,
		[username, hashedPassword]
	);

	return result.rows[0];
}

/* =========================
   CHECK EXISTS
========================= */
async function existsByUsername(username) {
	const result = await db.query(
		`SELECT 1
		 FROM users
		 WHERE username = $1
		 LIMIT 1`,
		[username]
	);

	return result.rows.length > 0;
}

/* =========================
   SEARCH USERNAME
========================= */
async function searchByUsername(searchTerm, limit = 10) {
	// hati-hati LIKE injection → tetap aman karena parameterized
	const result = await db.query(
		`SELECT id, username
		 FROM users
		 WHERE username ILIKE $1
		 ORDER BY username ASC
		 LIMIT $2`,
		[`%${searchTerm}%`, limit]
	);

	return result.rows;
}

module.exports = {
	findByUsername,
	findById,
	create,
	existsByUsername,
	searchByUsername
};
