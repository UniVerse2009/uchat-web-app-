const express = require('express');
const router = express.Router();

const chatService = require('../services/chat.service');
const requireAuth = require('../middlewares/auth');
const requireChatMember = require('../middlewares/chat');

/* =========================
   EDIT MESSAGE
========================= */
router.patch('/:messageId',
	requireAuth,
	async (req, res, next) => {
		try {
			const userId = req.session.userId;
			const { messageId } = req.params;
			const { content } = req.body;

			const updated = await chatService.editMessage({
				messageId: Number(messageId),
				userId,
				content
			});

			const io = req.app.get('io');
			io.to(`chat_${updated.room_id}`).emit('message:updated', updated);

			res.json(updated);
		} catch (err) {
			next(err);
		}
	}
);


/* =========================
   DELETE MESSAGE
========================= */
router.delete('/:messageId',
	requireAuth,
	async (req, res, next) => {
		try {
			const userId = req.session.userId;
			const { messageId } = req.params;

			const deleted = await chatService.deleteMessage({
				messageId: Number(messageId),
				userId
			});

			const io = req.app.get('io');
			io.to(`chat_${deleted.room_id}`).emit('message:deleted', {
				id: messageId
			});

			res.status(204).send();
		} catch (err) {
			next(err);
		}
	}
);

module.exports = router;
