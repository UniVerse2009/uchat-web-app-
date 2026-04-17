const express = require('express');
const http = require('http');
const cors = require('cors');

const sessionMiddleware = require('./config/session');
const initSocket = require('./config/socket');

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const messageRoutes = require('./routes/message.routes');
const userRoutes = require('./routes/user.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

/* =========================
   GLOBAL MIDDLEWARE
========================= */

app.use(express.json());

app.use(cors({
	origin: true,
	credentials: true
}));

app.use(sessionMiddleware);

/* =========================
   ROUTES
========================= */

app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/message', messageRoutes);
app.use('/users', userRoutes);

app.use("/public", publicRoutes);

app.use("/public", express.static("public", {
	index: false
}));

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
	const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	console.log("Akses route yang tidak ada: ", fullUrl);
	res.status(404).json({
		error: 'Route not found'
	});
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
	console.error(err);

	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error'
	});
});

/* =========================
   SOCKET INITIALIZATION
========================= */

const io = initSocket(server, sessionMiddleware);
app.set('io', io);

/* =========================
   START SERVER
========================= */

server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running on port ${PORT}`);
});
