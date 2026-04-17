const ChatService = require("./chat.service");

(async() => {
	/*console.log(await ChatService.createChat({
		creatorId: 3,
		type: 'P2P',
		participants: [4],
		name: 'Some Group'
	}));*/

	// console.log(await ChatService.getChatById(1));


	// Not return something
	/*console.log(await ChatService.leaveChat({
		chatId: 2,
		userId: 3
	}));*/

	/*console.log(await ChatService.sendMessage({
		chatId: 1,
		senderId: 1,
		content: 'icikwir'
	}));*/

	/*console.log(await ChatService.getMessages({
		chatId: 1,
		limit: 2,
		offset: 1
	}));*/

	console.log(await ChatService.deleteMessage({
		messageId: 4,
		userId: 1,
	}));
})();
