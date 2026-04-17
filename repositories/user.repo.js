const { query } = require('../database');

/* =========================
   FIND BY USERNAME
========================= */
async function findByUsername(username) {

	const sql = `
		SELECT id, username, password_hash
		FROM users
		WHERE username = ?
		LIMIT 1
	`;

	const rows = await query(sql, [username]);

	return rows[0] || null;
}


/* =========================
   FIND BY ID
========================= */
async function findById(id) {

	const sql = `
		SELECT id, username
		FROM users
		WHERE id = ?
		LIMIT 1
	`;

	const rows = await query(sql, [id]);

	return rows[0] || null;
}


/* =========================
   CREATE USER
========================= */
async function create(username, hashedPassword) {

	const sql = `
		INSERT INTO users (username, password_hash)
		VALUES (?, ?)
	`;

	const result = await query(sql, [username, hashedPassword]);

	return {
		id: result.insertId,
		username
	};
}


/* =========================
   CHECK EXISTS
========================= */
async function existsByUsername(username) {

	const sql = `
		SELECT 1
		FROM users
		WHERE username = ?
		LIMIT 1
	`;

	const rows = await query(sql, [username]);

	return rows.length > 0;
}

async function searchByUsername(searchTerm, limit = 10) {
	/*
		This code have high severity at security. See by your self what the query is
	*/

	return await query(
		`SELECT id, username
		 FROM users
		 WHERE username LIKE ?
		 ORDER BY username ASC
		 LIMIT ?`,
		[`%${searchTerm}%`, limit]
	);
}


module.exports = {
	findByUsername,
	findById,
	create,
	existsByUsername,
	searchByUsername
};
