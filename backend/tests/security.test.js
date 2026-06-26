const request = require("supertest");
const { pool } = require("../config/postgresql_database");
const app = require("../server");

describe("Security Tests", () => {

let alice;
let bob;
let charlie;

let aliceId;
let bobId;
let charlieId;

let roomABId;
let aliceMessageId;

beforeAll(async () => {

	alice = request.agent(app);
	bob = request.agent(app);
	charlie = request.agent(app);

	// register users
	console.log("AKAN MASUK TAHAP REGISTER");

	const aliceRegister = await alice
		.post("/auth/register")
		.send({
			username: "alice",
			password: "password123"
		});

	aliceId = aliceRegister.body.id;

	const bobRegister = await bob
		.post("/auth/register")
		.send({
			username: "bob",
			password: "password123"
		});

	bobId = bobRegister.body.id;

	const charlieRegister = await charlie
		.post("/auth/register")
		.send({
			username: "charlie",
			password: "password123"
		});

	charlieId = charlieRegister.body.id;

	console.log("AKAN MASUK TAHAP LOGIN");

	// login users

	await alice.post("/auth/login").send({
		username: "alice",
		password: "password123"
	});

	await bob.post("/auth/login").send({
		username: "bob",
		password: "password123"
	});

	await charlie.post("/auth/login").send({
		username: "charlie",
		password: "password123"
	});

	console.log("SELESAI LOGIN");

	// create room Alice <-> Bob

	const room = await alice
		.post("/chats")
		.send({
			type: "P2P",
			participants: [bobId]
		});

	roomABId = room.body.id;

	// console.log(`SELESAI BUAT ROOM. Room ID: ${roomABId}`);

	// create message by Alice

	const message = await alice
		.post(`/chats/${roomABId}/messages`)
		.send({
			content: "secret message"
		});

	aliceMessageId = message.body.id;

	console.log("SELESAI BUAT MESSAGE");

});

describe("Auth Bypass", () => {

	const endpoints = [
		["get", "/auth/me"],
		["get", "/chats"],
		["post", "/chats"],
		["get", `/chats/1`],
		["delete", `/chats/1`],
		["get", `/chats/1/messages`],
		["post", `/chats/1/messages`],
		["patch", `/message/1`],
		["delete", `/message/1`],
		["get", "/users/me"],
		["get", "/users"],
		["get", "/users/1"]
	];

	test.each(endpoints)(
		"%s %s requires authentication",
		async (method, url) => {

			const res = await request(app)[method](url);

			expect(res.status).toBe(401);

		}
	);

	it("rejects forged session cookie", async () => {

		const res = await request(app)
			.get("/auth/me")
			.set("Cookie", [
				"connect.sid=fake-session"
			]);

		expect(res.status).toBe(401);

	});

	it("invalidates session after logout", async () => {

		const temp = request.agent(app);

		await temp.post("/auth/register").send({
			username: "logout_test",
			password: "password123"
		});

		await temp.post("/auth/login").send({
			username: "logout_test",
			password: "password123"
		});

		expect(
			(await temp.get("/auth/me")).status
		).toBe(200);

		await temp.post("/auth/logout");

		expect(
			(await temp.get("/auth/me")).status
		).toBe(401);

	});

});

describe("Chat Authorization", () => {

	it("prevents non-member from reading chat", async () => {

		const res = await charlie.get(`/chats/${roomABId}`);

		expect(res.status).toBe(403);

	});

	it("prevents non-member from reading messages", async () => {

		const res = await charlie.get(
			`/chats/${roomABId}/messages`
		);

		expect(res.status).toBe(403);

	});

	it("prevents non-member from sending messages", async () => {

		const res = await charlie
			.post(`/chats/${roomABId}/messages`)
			.send({
				content: "hacked"
			});

		expect(res.status).toBe(403);

	});

	it("prevents non-member from leaving room", async () => {

		const res = await charlie.delete(
			`/chats/${roomABId}`
		);

		expect(res.status).toBe(403);

	});

});

describe("Message Ownership", () => {

	it("allows owner to edit own message", async () => {

		const res = await alice
			.patch(`/message/${aliceMessageId}`)
			.send({
				content: "edited"
			});

		expect(res.status).toBe(200);

	});

	it("prevents another user from editing message", async () => {

		const res = await bob
			.patch(`/message/${aliceMessageId}`)
			.send({
				content: "evil edit"
			});

		expect(res.status).toBe(403);

	});

	it("prevents another user from deleting message", async () => {

		const res = await bob.delete(
			`/message/${aliceMessageId}`
		);

		expect(res.status).toBe(403);

	});

});

describe("IDOR", () => {

	it("prevents room access by changing chatId", async () => {

		const res = await charlie.get(
			`/chats/${roomABId}`
		);

		expect(res.status).toBe(403);

	});

	it("prevents room message access by changing chatId", async () => {

		const res = await charlie.get(
			`/chats/${roomABId}/messages`
		);

		expect(res.status).toBe(403);

	});

});

describe("Session Security", () => {

	it("keeps Alice and Bob sessions isolated", async () => {

		const aliceMe = await alice.get("/auth/me");
		const bobMe = await bob.get("/auth/me");

		expect(aliceMe.body.id).toBe(aliceId);
		expect(bobMe.body.id).toBe(bobId);

	});

	it("does not leak identity between sessions", async () => {

		const aliceMe = await alice.get("/auth/me");

		expect(aliceMe.body.username)
			.not.toBe("bob");

	});

});

describe("SQL Injection", () => {

	it("rejects login SQL injection", async () => {

		const res = await request(app)
			.post("/auth/login")
			.send({
				username: "' OR 1=1 --",
				password: "anything"
			});

		expect(res.status).not.toBe(200);

	});

	it("handles search SQL injection safely", async () => {

		const res = await alice.get(
			"/users?search=' OR 1=1 --"
		);

		expect(res.status).toBe(200);

	});

	it("handles chat name SQL injection safely", async () => {

		const res = await alice
			.post("/chats")
			.send({
				type: "GROUP",
				name: "' OR 1=1 --",
				participants: [bobId]
			});

		expect([200, 201]).toContain(
			res.status
		);

	});

	it("handles message SQL injection safely", async () => {

		const res = await alice
			.post(`/chats/${roomABId}/messages`)
			.send({
				content: "'; DROP TABLE users; --"
			});

		expect(res.status).toBe(201);

	});

});

describe("Information Disclosure", () => {

	it("does not leak chat data on forbidden access", async () => {

		const res = await charlie.get(
			`/chats/${roomABId}`
		);

		expect(res.status).toBe(403);

		expect(res.body.participants)
			.toBeUndefined();

	});

	it("does not expose stack traces", async () => {

		const res = await request(app)
			.get("/chats/999999999");

		expect(
			JSON.stringify(res.body)
		).not.toMatch(/stack|error.*at/i);

	});

});

afterAll(async () => {

	await pool.query(
		"TRUNCATE TABLE chat_messages, chat_participants, chat_rooms, users RESTART IDENTITY CASCADE"
	);

	await pool.end();
	await app.close();

	});

});
