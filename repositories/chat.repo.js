const { query } = require('../database');


/* =========================
   FIND CHAT BY ID
========================= */
async function findById(chatId) {
	/*const rows = await query(
		`SELECT id, type, name, created_at
		 FROM chat_rooms
		 WHERE id = ?`,
		[chatId]
	);

	return rows[0] || null;*/


	const rows = await query(
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
     WHERE c.id = ?`,
    [chatId]
  );
  return rows[0] || null;
}


/* =========================
   FIND CHATS BY USER
========================= */
async function findByUserId(userId) {
	return await query(
		`SELECT c.id, c.type, c.name, c.created_at
		 FROM chat_rooms c
		 JOIN chat_participants cp
		   ON cp.room_id = c.id
		 WHERE cp.user_id = ?
		 ORDER BY c.created_at DESC`,
		[userId]
	);
}


/* =========================
   CREATE CHAT
========================= */
/*async function create({ type, name }) {
	const result = await query(
		`INSERT INTO chat_rooms (type, name)
		 VALUES (?, ?)`,
		[type, name]
	);

	return {
		id: result.insertId,
		type,
		name
	};
}*/
async function create({ type, name }) {
	const result = await query(
		`INSERT INTO chat_rooms (type, name)
		 VALUES (?, ?)`,
		[type, name]
	);

	const chatId = result.insertId;

	const [chat] = await query(
		`SELECT 
			c.id,
			c.type,
			c.name,
			c.created_at,
			NULL AS last_message,
			c.created_at AS last_message_time,
			NULL AS last_message_sender_id
		FROM chat_rooms c
		WHERE c.id = ?`,
		[chatId]
	);

	return chat;
}


async function getParticipants(chatId) {
	return await query(
		`SELECT u.id, u.username
		 FROM chat_participants cp
		 JOIN users u ON u.id = cp.user_id
		 WHERE cp.room_id = ?`,
		[chatId]
	);
}


/* =========================
   FIND EXISTING P2P CHAT
========================= */
async function findExistingP2P(userA, userB) {
	const rows = await query(
		`SELECT c.id, c.type, c.name, c.created_at
		 FROM chat_rooms c
		 JOIN chat_participants cp1
		   ON cp1.room_id = c.id AND cp1.user_id = ?
		 JOIN chat_participants cp2
		   ON cp2.room_id = c.id AND cp2.user_id = ?
		 WHERE c.type = 'P2P'
		 LIMIT 1`,
		[userA, userB]
	);

	return rows[0] || null;
}



/* =========================
   ADD PARTICIPANTS
========================= */
async function addParticipants(chatId, userIds) {
	const values = userIds.map(userId => [chatId, userId]);

	await query(
		`INSERT INTO chat_participants (room_id, user_id)
		 VALUES ?`,
		[values]
	);
}


/* =========================
   CHECK PARTICIPANT
========================= */
async function isParticipant(chatId, userId) {
	const rows = await query(
		`SELECT 1
		 FROM chat_participants
		 WHERE room_id = ?
		   AND user_id = ?
		 LIMIT 1`,
		[chatId, userId]
	);

	return rows.length > 0;
}


async function removeParticipant(chatId, userId) {
	await query(
		`DELETE FROM chat_participants
		 WHERE room_id = ?
		   AND user_id = ?`,
		[chatId, userId]
	);
}

async function countParticipants(chatId) {
	const rows = await query(
		`SELECT COUNT(*) as total
		 FROM chat_participants
		 WHERE room_id = ?`,
		[chatId]
	);

	return rows[0].total;
}

async function deleteChat(chatId) {
	await query(
		`DELETE FROM chat_rooms
		 WHERE id = ?`,
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
