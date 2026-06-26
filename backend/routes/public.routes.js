const express = require('express');
const router = express.Router();


router.get('/chat.html', (req, res, next) => {
	if(!req.session || !req.session.userId){
		console.log("ada orang");
		return res.redirect('login.html');
	}
	next();
}, (req, res, next) => {
	next();
});

module.exports = router;
