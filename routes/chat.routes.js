const express = require('express');
const router = express.Router();

const chatService = require('../services/chat.service');
const requireAuth = require('../middlewares/auth');
const requireChatMember = require('../middlewares/chat');

/* =========================
   GET USER CHATS
========================= */
router.get('/', requireAuth, async (req, res, next) => {
	try {
		const userId = req.session.userId;

		const chats = await chatService.getUserChats(userId);

		res.json(chats);
	} catch (err) {
		next(err);
	}
});


/* =========================
   CREATE CHAT
========================= */
router.post('/', requireAuth, async (req, res, next) => {
	try {
		const userId = req.session.userId;
		const { type, participants, name } = req.body;

		const result = await chatService.createChat({
			creatorId: userId,
			type,
			participants,
			name
		});

		const { chat, isNew } = result;

		if(isNew){
			const io = req.app.get('io');

			const allUsers = [userId, ...participants];

			for (const userId of allUsers) {
				io.to(`user_${userId}`).emit('chat:new', chat);
			}
		}

		res.status(isNew ? 201 : 200).json(chat);
	} catch (err) {
		next(err);
	}
});


/* =========================
   GET CHAT DETAIL
========================= */
router.get('/:chatId',
	requireAuth,
	requireChatMember,
	async (req, res, next) => {
		try {
			const { chatId } = req.params;

			const chat = await chatService.getChatById(
				Number(chatId)
			);

			res.json(chat);
		} catch (err) {
			next(err);
		}
	}
);


/* =========================
   DELETE / LEAVE CHAT
========================= */
router.delete('/:chatId',
	requireAuth,
	requireChatMember,
	async (req, res, next) => {
		try {
			const userId = req.session.userId;
			const { chatId } = req.params;

			await chatService.leaveChat({
				chatId: Number(chatId),
				userId
			});

			res.status(204).send();
		} catch (err) {
			next(err);
		}
	}
);


/* =========================
   GET MESSAGES
========================= */
router.get('/:chatId/messages',
	requireAuth,
	requireChatMember,
	async (req, res, next) => {
		try {
			const { chatId } = req.params;
			const { limit = 20, offset = 0 } = req.query;

			const messages = await chatService.getMessages({
				chatId: Number(chatId),
				limit: Number(limit),
				offset: Number(offset)
			});

			res.json(messages);
		} catch (err) {
			next(err);
		}
	}
);


/* =========================
   SEND MESSAGE
========================= */
router.post('/:chatId/messages',
	requireAuth,
	requireChatMember,
	async (req, res, next) => {
		try {
			const userId = req.session.userId;
			const { chatId } = req.params;
			const { content } = req.body;

			const message = await chatService.sendMessage({
				chatId: Number(chatId),
				senderId: userId,
				content
			});

			const io = req.app.get('io');
			io.to(`chat_${chatId}`).emit('message:new', message);

			res.status(201).json(message);
		} catch (err) {
			next(err);
		}
	}
);

module.exports = router;
