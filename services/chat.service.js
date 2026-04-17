/* =========================
   NEED TRANSACTION FEATURES
========================= */


const chatRepo = require('../repositories/chat.repo');
const userRepo = require('../repositories/user.repo');
const messageRepo = require('../repositories/message.repo');

const createError = (status, message) => {
	const err = new Error(message);
	err.status = status;
	return err;
};


/* =========================
   GET USER CHATS
========================= */
async function getUserChats(userId) {
	return await chatRepo.findByUserId(userId);
}


/* =========================
   CREATE CHAT
========================= */
async function createChat({ creatorId, type, participants = [], name }) {

	if (!['P2P', 'GROUP'].includes(type)) {
		throw createError(400, 'Invalid chat type');
	}

	if (type === 'P2P' && participants.length !== 1) {
		throw createError(400, 'P2P chat must have exactly one participant');
	}

	if (type === 'P2P') {

		const otherUserId = participants[0];

		if (creatorId === otherUserId) {
			throw createError(400, 'Cannot create P2P chat with yourself');
		}

		const existing = await chatRepo.findExistingP2P(
			creatorId,
			otherUserId
		);

		if (existing) {
			return {
				chat: existing,
				isNew: false
			};
		}
	}

	// Ensure users exist
	const allUserIds = [creatorId, ...participants];
	for (const userId of allUserIds) {
		const user = await userRepo.findById(userId);
		if (!user) {
			throw createError(404, `User ${userId} not found`);
		}
	}

	// Create chat
	const chat = await chatRepo.create({
		type,
		name: type === 'GROUP' ? name : null
	});

	// Add participants (including creator)
	await chatRepo.addParticipants(chat.id, allUserIds);

	chat.participants = await chatRepo.getParticipants(chat.id);

	return {
		chat,
		isNew: true
	};

	/*
		NOTE:
		For now, there are not difference between creator and participant. They all will be MEMBER aa default
		Even so, the creatorId are first participant.
		In future, maybe first index participants in GROUP type chat can be assume to group ADMIN
	*/
}


/* =========================
   GET CHAT DETAIL
========================= */
async function getChatById(chatId) {

	const chat = await chatRepo.findById(chatId);

	if (!chat) {
		throw createError(404, 'Chat not found');
	}

	const participants = await chatRepo.getParticipants(chatId);

	return {
		...chat,
		participants
	};
}


/* =========================
   LEAVE CHAT
========================= */
async function leaveChat({ chatId, userId }) {

	const chat = await chatRepo.findById(chatId);
	if (!chat) {
		throw createError(404, 'Chat not found');
	}

	const isMember = await chatRepo.isParticipant(chatId, userId);
	if (!isMember) {
		throw createError(403, 'Not a participant');
	}

	await chatRepo.removeParticipant(chatId, userId);

	const remaining = await chatRepo.countParticipants(chatId);

	if (
		remaining <= 0 && chat.type === 'GROUP' ||
		remaining <= 1 && chat.type === 'P2P'

	)await chatRepo.deleteChat(chatId);
}


/* =========================
   GET MESSAGES
========================= */
async function getMessages({ chatId, limit, offset }) {

	const chat = await chatRepo.findById(chatId);
	if (!chat) {
		throw createError(404, 'Chat not found');
	}

	return await messageRepo.findByChatId(chatId, { limit, offset });
}


/* =========================
   SEND MESSAGE
========================= */
async function sendMessage({ chatId, senderId, content }) {
	/*
		NOTE:
		If chatId is not valid, error are indirectly cuaght by isParticipants
	*/

	if (!content || !content.trim()) {
		throw createError(400, 'Message content required');
	}

	const isMember = await chatRepo.isParticipant(chatId, senderId);
	if (!isMember) {
		throw createError(403, 'Not a chat participant');
	}

	return await messageRepo.create({
		chatId,
		senderId,
		content
	});
}


/* =========================
   EDIT MESSAGE
========================= */
async function editMessage({ messageId, userId, content }) {

	const message = await messageRepo.findById(messageId);
	if (!message) {
		throw createError(404, 'Message not found');
	}

	if (message.sender_id !== userId) {
		throw createError(403, 'Cannot edit others message');
	}

	if (!content || !content.trim()) {
		throw createError(400, 'Message content required');
	}

	return await messageRepo.updateContent(messageId, content);
}


/* =========================
   DELETE MESSAGE
========================= */
async function deleteMessage({ messageId, userId }) {

	const message = await messageRepo.findById(messageId);
	if (!message) {
		throw createError(404, 'Message not found');
	}

	if (message.sender_id !== userId) {
		throw createError(403, 'Cannot delete others message');
	}

	return await messageRepo.remove(messageId);
}


module.exports = {
	getUserChats,
	createChat,
	getChatById,
	leaveChat,
	getMessages,
	sendMessage,
	editMessage,
	deleteMessage
};
