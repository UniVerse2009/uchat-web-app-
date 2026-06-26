const session = require('express-session');

/*
	NOTE:
	Di production, sebaiknya pakai session store seperti:
	connect-redis / connect-mongo
	Bukan MemoryStore.
*/

const isProduction = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
	name: 'chat.sid', // nama cookie biar tidak default connect.sid
	secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: false,
		secure: isProduction,           // hanya HTTPS kalau production
		sameSite: isProduction ? 'strict' : 'lax',
		maxAge: 1000 * 60 * 60 * 24      // 24 jam
	}
});

module.exports = sessionMiddleware;
