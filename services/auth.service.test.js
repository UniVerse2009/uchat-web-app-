const UserService = require('./user.service');

(async() => {
	console.log(await UserService.register('ThirdArif', 'Sct8765'));
})();
