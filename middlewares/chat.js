const chatRepo = require('../repositories/chat.repo');

const createError = (status, message) => {
	const err = new Error(message);
	err.status = status;
	return err;
};

module.exports = async function requireChatMember(req, res, next) {

	try {
		const userId = req.session.userId;
		const { chatId } = req.params;

		const numericChatId = Number(chatId);

		if (!numericChatId || Number.isNaN(numericChatId)) {
			return next(createError(400, 'Invalid chat id'));
		}

		const isMember = await chatRepo.isParticipant(
			numericChatId,
			userId
		);

		if (!isMember) {
			return next(createError(403, 'Not a chat participant'));
		}

		next();

	} catch (err) {
		next(err);
	}
};
