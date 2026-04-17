const { query } = require('../database');


/* =========================
   FIND BY ID
========================= */
async function findById(messageId) {
	const rows = await query(
		`SELECT id, room_id, sender_id, content, sent_at, updated_at
		 FROM chat_messages
		 WHERE id = ?`,
		[messageId]
	);

	return rows[0] || null;
}


/* =========================
   FIND BY CHAT
========================= */
async function findByChatId(chatId, { limit, offset }) {
	/*return await query(
		`SELECT id, room_id, sender_id, content, sent_at
		 FROM chat_messages
		 WHERE room_id = ?
		 ORDER BY sent_at DESC
		 LIMIT ?
		 OFFSET ?`,
		[chatId, limit, offset]
	);*/

	return await query(
  `SELECT m.id, m.room_id, m.sender_id, m.content, m.sent_at,
          u.username AS sender_username
   FROM chat_messages m
   JOIN users u ON u.id = m.sender_id
   WHERE m.room_id = ?
   ORDER BY m.sent_at ASC
   LIMIT ?
   OFFSET ?`,
  [chatId, limit, offset]
);
}


/* =========================
   CREATE MESSAGE
========================= */
async function create({ chatId, senderId, content }) {
	const result = await query(
		`INSERT INTO chat_messages (room_id, sender_id, content)
		 VALUES (?, ?, ?)`,
		[chatId, senderId, content]
	);

	const rows = await query(
		`SELECT m.id,
		        m.room_id,
		        m.sender_id,
		        u.username AS sender_username,
		        m.content,
		        m.sent_at
		 FROM chat_messages m
		 JOIN users u ON u.id = m.sender_id
		 WHERE m.id = ?`,
		[result.insertId]
	);

	return rows[0] || null;
}


/* =========================
   UPDATE CONTENT
========================= */
async function updateContent(messageId, content) {
	await query(
		`UPDATE chat_messages
		 SET content = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
		[content, messageId]
	);

	return await findById(messageId);
}


/* =========================
   REMOVE MESSAGE
========================= */
async function remove(messageId) {
	return await query(
		`DELETE FROM chat_messages
		 WHERE id = ?`,
		[messageId]
	);
}


module.exports = {
	findById,
	findByChatId,
	create,
	updateContent,
	remove
};
