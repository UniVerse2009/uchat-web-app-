const db = require("../../config/postgresql_database");

/* =========================
   FIND BY ID
========================= */
async function findById(messageId) {
	const result = await db.query(
		`SELECT id, room_id, sender_id, content, sent_at, updated_at
		 FROM chat_messages
		 WHERE id = $1`,
		[messageId]
	);

	return result.rows[0] || null;
}

/* =========================
   FIND BY CHAT
========================= */
async function findByChatId(chatId, { limit = 50, offset = 0 }) {
	const result = await db.query(
		`SELECT m.id,
		        m.room_id,
		        m.sender_id,
		        m.content,
		        m.sent_at,
		        u.username AS sender_username
		 FROM chat_messages m
		 JOIN users u ON u.id = m.sender_id
		 WHERE m.room_id = $1
		 ORDER BY m.sent_at ASC
		 LIMIT $2
		 OFFSET $3`,
		[chatId, limit, offset]
	);

	return result.rows;
}

/* =========================
   CREATE MESSAGE
========================= */
async function create({ chatId, senderId, content }) {
	const result = await db.query(
		`INSERT INTO chat_messages (room_id, sender_id, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, room_id, sender_id, content, sent_at`,
		[chatId, senderId, content]
	);

	const message = result.rows[0];

	// ambil username biar response sama seperti versi MySQL kamu
	const userResult = await db.query(
		`SELECT username
		 FROM users
		 WHERE id = $1`,
		[senderId]
	);

	return {
		...message,
		sender_username: userResult.rows[0]?.username || null
	};
}

/* =========================
   UPDATE CONTENT
========================= */
async function updateContent(messageId, content) {
	await db.query(
		`UPDATE chat_messages
		 SET content = $1,
		     updated_at = now()
		 WHERE id = $2`,
		[content, messageId]
	);

	return findById(messageId);
}

/* =========================
   REMOVE MESSAGE
========================= */
async function remove(messageId) {
	const result = await db.query(
		`DELETE FROM chat_messages
		 WHERE id = $1
		 RETURNING id`,
		[messageId]
	);

	return result.rows[0] || null;
}

module.exports = {
	findById,
	findByChatId,
	create,
	updateContent,
	remove
};
