/**
 * user-flow.test.js
 *
 * Integration test untuk UChat — mensimulasikan satu siklus penuh
 * pemakaian app oleh 2 user (Alice & Bob), bukan unit test per-endpoint.
 *
 * CATATAN PENTING SEBELUM JALAN:
 * 1. Ganti `require("../app")` di bawah sesuai lokasi sebenarnya file yang
 *    mengekspor instance Express `app` (BUKAN file yang langsung
 *    `server.listen()`). Kalau di project lo app & server masih digabung
 *    jadi satu file yang langsung listen, ini PR tersendiri yang wajib
 *    dibenerin dulu — supertest butuh `app` mentah, bukan server yang
 *    sudah nempel ke port.
 * 2. Pastikan NODE_ENV=test / .env.test mengarah ke database TEST,
 *    bukan database dev/prod. Test ini akan men-TRUNCATE tabel di akhir.
 * 3. Jalankan dengan: NODE_ENV=test npx jest user-flow.test.js --runInBand
 *    (--runInBand penting karena flow ini stateful & berurutan, bukan
 *    dirancang untuk jalan paralel)
 */

// This test use production database!!!!!!
const request = require("supertest");
const { pool } = require("../config/postgresql_database");

// Sesuaikan path ini ke file yang mengekspor `app` Express
const app = require("../server");

describe("User Flow: pemakaian normal UChat oleh 2 user", () => {
  const suffix = Date.now();
  const alice = { username: `alice_${suffix}`, password: "Passw0rd!123" };
  const bob = { username: `bob_${suffix}`, password: "Passw0rd!456" };

  // Agent terpisah supaya cookie session Alice & Bob tidak ketukar
  const agentAlice = request.agent(app);
  const agentBob = request.agent(app);

  // State yang dibawa antar step
  let aliceId, bobId, chatId, message1Id;

  afterAll(async () => {
    await pool.query(
      "TRUNCATE TABLE chat_messages, chat_participants, chat_rooms, users RESTART IDENTITY CASCADE"
    );
    await pool.end();
    await app.close();
  });

  // 1. Register Alice
  it("registers Alice", async () => {
    const res = await request(app).post("/auth/register").send(alice);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.username).toBe(alice.username);
    aliceId = res.body.id;
  });

  // 2. Register Bob
  it("registers Bob", async () => {
    const res = await request(app).post("/auth/register").send(bob);
    expect(res.status).toBe(201);
    expect(res.body.username).toBe(bob.username);
    bobId = res.body.id;
  });

  // 3. Login Alice
  it("logs Alice in and persists session cookie", async () => {
    const res = await agentAlice.post("/auth/login").send(alice);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(aliceId);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  // 4. GET /auth/me (Alice)
  it("confirms Alice's identity via /auth/me", async () => {
    const res = await agentAlice.get("/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: aliceId, username: alice.username });
  });

  // 5. Alice cari Bob lewat search
  it("lets Alice find Bob via user search", async () => {
    const res = await agentAlice.get("/users").query({ search: "bob" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((u) => u.id === bobId);
    expect(found).toBeDefined();
    expect(found.username).toBe(bob.username);
  });

  // 6. Alice lihat profil Bob via GET /users/:id
  it("lets Alice view Bob's profile by id before starting a chat", async () => {
    const res = await agentAlice.get(`/users/${bobId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: bobId, username: bob.username });
  });

  // 7. Alice buat chat P2P ke Bob
  it("lets Alice create a P2P chat with Bob", async () => {
    const res = await agentAlice
      .post("/chats")
      .send({ type: "P2P", participants: [bobId] });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("P2P");
    expect(res.body.participants.map((p) => p.id)).toEqual(
      expect.arrayContaining([aliceId, bobId])
    );
    chatId = res.body.id;
  });

  // 8. Alice kirim pesan pertama
  it("lets Alice send the first message", async () => {
    const res = await agentAlice
      .post(`/chats/${chatId}/messages`)
      .send({ content: "Hai Bob, apa kabar?" });
    expect(res.status).toBe(201);
    expect(res.body.sender_id).toBe(aliceId);
    expect(res.body.content).toBe("Hai Bob, apa kabar?");
    message1Id = res.body.id;
  });

  // 9. Login Bob (agent kedua, cookie terpisah dari Alice)
  it("logs Bob in on a separate session", async () => {
    const res = await agentBob.post("/auth/login").send(bob);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(bobId);
  });

  // 10. Bob lihat daftar chat-nya
  it("shows the new chat in Bob's chat list", async () => {
    const res = await agentBob.get("/chats");
    expect(res.status).toBe(200);
    expect(res.body.some((c) => c.id === chatId)).toBe(true);
  });

  // 11. Bob baca pesan dari Alice
  it("lets Bob read Alice's message", async () => {
    const res = await agentBob.get(`/chats/${chatId}/messages`);
    expect(res.status).toBe(200);
    const msg = res.body.find((m) => m.id === message1Id);
    expect(msg).toBeDefined();
    expect(msg.content).toBe("Hai Bob, apa kabar?");
    expect(msg.sender_username).toBe(alice.username);
  });

  // 12. Bob balas pesan
  it("lets Bob reply", async () => {
    const res = await agentBob
      .post(`/chats/${chatId}/messages`)
      .send({ content: "Baik, lagi nge-test API nih" });
    expect(res.status).toBe(201);
    expect(res.body.sender_id).toBe(bobId);
  });

  // 13. Alice edit pesan pertamanya
  it("lets Alice edit her own message", async () => {
    const res = await agentAlice
      .patch(`/message/${message1Id}`)
      .send({ content: "Hai Bob, apa kabar? (edited)" });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("Hai Bob, apa kabar? (edited)");
  });

  // 14. Verifikasi hasil edit muncul saat fetch ulang
  it("reflects the edited content when messages are re-fetched", async () => {
    const res = await agentBob.get(`/chats/${chatId}/messages`);
    const msg = res.body.find((m) => m.id === message1Id);
    expect(msg.content).toBe("Hai Bob, apa kabar? (edited)");
  });

  // 15. Alice hapus pesan yang sudah diedit
  it("lets Alice delete her own message", async () => {
    const res = await agentAlice.delete(`/message/${message1Id}`);
    expect(res.status).toBe(204);
  });

  // 16. Pastikan pesan beneran hilang dari daftar
  it("confirms the deleted message no longer appears in the list", async () => {
    const res = await agentBob.get(`/chats/${chatId}/messages`);
    expect(res.body.find((m) => m.id === message1Id)).toBeUndefined();
  });

  // 17. Bob keluar dari chat
  it("lets Bob leave the chat", async () => {
    const res = await agentBob.delete(`/chats/${chatId}`);
    expect(res.status).toBe(204);
  });

  // 18. Chat sudah tidak muncul di daftar Bob
  it("removes the chat from Bob's list after leaving", async () => {
    const res = await agentBob.get("/chats");
    expect(res.body.some((c) => c.id === chatId)).toBe(false);
  });

  // 19. Alice juga keluar dari chat (peserta jadi 0)
  it("lets Alice leave the chat as the last remaining participant", async () => {
    const res = await agentAlice.delete(`/chats/${chatId}`);
    expect(res.status).toBe(404);
  });

  // 20. Pastikan room beneran terhapus dari DB, bukan cuma "kosong"
  it("confirms the chat room is actually deleted, not just emptied", async () => {
    const res = await agentAlice.get(`/chats/${chatId}`);
    expect(res.status).toBe(404);
  });

  // 21. Alice logout
  it("logs Alice out", async () => {
    const res = await agentAlice.post("/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });

  // 22. Session Alice beneran mati setelah logout
  it("rejects access to protected routes after logout", async () => {
    const res = await agentAlice.get("/auth/me");
    expect(res.status).toBe(401);
  });
});
