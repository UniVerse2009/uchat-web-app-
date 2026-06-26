const db = require("../../config/postgresql_database");

/* =========================
   FIND CHAT BY ID
========================= */
async function findById(chatId) {
	const result = await db.query(
		`SELECT c.id, c.type, c.name, c.created_at,
		 lm.content   AS last_message,
		 lm.sent_at   AS last_message_time,
		 lm.sender_id AS last_message_sender_id
	 FROM chat_rooms c
	 LEFT JOIN (
		 SELECT room_id, content, sent_at, sender_id
		 FROM chat_messages
		 WHERE (room_id, sent_at) IN (
			 SELECT room_id, MAX(sent_at)
			 FROM chat_messages
			 GROUP BY room_id
		 )
	 ) lm ON lm.room_id = c.id
	 WHERE c.id = $1`,
		[chatId]
	);

	return result.rows[0] || null;
}

/* =========================
   FIND CHATS BY USER
========================= */
async function findByUserId(userId) {
	const result = await db.query(
		`SELECT c.id, c.type, c.name, c.created_at
		 FROM chat_rooms c
		 JOIN chat_participants cp
		   ON cp.room_id = c.id
		 WHERE cp.user_id = $1
		 ORDER BY c.created_at DESC`,
		[userId]
	);

	return result.rows;
}

/* =========================
   CREATE CHAT
========================= */
async function create({ type, name }) {
	const result = await db.query(
		`INSERT INTO chat_rooms (type, name)
		 VALUES ($1, $2)
		 RETURNING id, type, name, created_at`,
		[type, name]
	);

	const chat = result.rows[0];

	// simulasikan last_message field biar sama seperti MySQL version
	return {
		...chat,
		last_message: null,
		last_message_time: chat.created_at,
		last_message_sender_id: null
	};
}

/* =========================
   GET PARTICIPANTS
========================= */
async function getParticipants(chatId) {
	const result = await db.query(
		`SELECT u.id, u.username
		 FROM chat_participants cp
		 JOIN users u ON u.id = cp.user_id
		 WHERE cp.room_id = $1`,
		[chatId]
	);

	return result.rows;
}

/* =========================
   FIND EXISTING P2P CHAT
========================= */
async function findExistingP2P(userA, userB) {
	const result = await db.query(
		`SELECT c.id, c.type, c.name, c.created_at
		 FROM chat_rooms c
		 JOIN chat_participants cp1
		   ON cp1.room_id = c.id AND cp1.user_id = $1
		 JOIN chat_participants cp2
		   ON cp2.room_id = c.id AND cp2.user_id = $2
		 WHERE c.type = 'P2P'
		 LIMIT 1`,
		[userA, userB]
	);

	return result.rows[0] || null;
}

/* =========================
   ADD PARTICIPANTS
========================= */
async function addParticipants(chatId, userIds) {
	if (!userIds.length) return;

	const values = [];
	const params = [];

	let i = 1;

	for (const userId of userIds) {
		values.push(`($1, $${i + 1})`);
		params.push(userId);
		i++;
	}

	await db.query(
		`INSERT INTO chat_participants (room_id, user_id)
		 VALUES ${values.join(",")}`,
		[chatId, ...params]
	);
}

/* =========================
   CHECK PARTICIPANT
========================= */
async function isParticipant(chatId, userId) {
	const result = await db.query(
		`SELECT 1
		 FROM chat_participants
		 WHERE room_id = $1
		   AND user_id = $2
		 LIMIT 1`,
		[chatId, userId]
	);

	return result.rows.length > 0;
}

/* =========================
   REMOVE PARTICIPANT
========================= */
async function removeParticipant(chatId, userId) {
	await db.query(
		`DELETE FROM chat_participants
		 WHERE room_id = $1
		   AND user_id = $2`,
		[chatId, userId]
	);
}

/* =========================
   COUNT PARTICIPANTS
========================= */
async function countParticipants(chatId) {
	const result = await db.query(
		`SELECT COUNT(*) as total
		 FROM chat_participants
		 WHERE room_id = $1`,
		[chatId]
	);

	return parseInt(result.rows[0].total, 10);
}

/* =========================
   DELETE CHAT
========================= */
async function deleteChat(chatId) {
	await db.query(
		`DELETE FROM chat_rooms
		 WHERE id = $1`,
		[chatId]
	);
}

module.exports = {
	findById,
	findByUserId,
	create,
	findExistingP2P,
	addParticipants,
	isParticipant,
	getParticipants,
	removeParticipant,
	countParticipants,
	deleteChat
};
