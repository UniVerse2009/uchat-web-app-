// validation.test.js
// Fokus: bagaimana server menangani input yang malformed/ngasal (bukan serangan, bukan happy path).
// Pola umum yang dicek di semua kasus: 400 untuk request salah-bentuk vs 500 untuk server crash.
// Asumsi: ../app.js mengekspor instance Express (lihat catatan di chat).

const request = require("supertest");
const app = require("../server"); // sesuaikan path kalau struktur project beda

describe("Validation - Auth (/auth)", () => {
  const base = { username: `valuser_${Date.now()}`, password: "password123" };

  test("register: password kosong string -> 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: `${base.username}_1`, password: "" });
    expect(res.status).toBe(400);
  });

  test("register: username whitespace-only -> 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "   ", password: base.password });
    expect(res.status).toBe(400);
  });

  test("register: password tidak dikirim sama sekali -> 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: `${base.username}_2` });
    expect(res.status).toBe(400);
  });

  test("register: tipe data password salah (number bukan string) -> 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: `${base.username}_3`, password: 12345 });
    expect(res.status).not.toBe(500);
    expect(res.status).toBe(400);
  });

  test("register: username super panjang (300 char) -> tidak boleh 500", async () => {
    const longUsername = "a".repeat(300);
    const res = await request(app)
      .post("/auth/register")
      .send({ username: longUsername, password: base.password });
    // Boleh 400 (ditolak) ATAU 201 (kalau kolom DB memang tidak dibatasi),
    // yang TIDAK boleh adalah 500 (artinya constraint DB yang nge-crash, bukan validasi aplikasi).
    expect(res.status).not.toBe(500);
  });

  test("register: username dengan unicode/emoji -> tidak crash", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: `😀${base.username}_emoji`, password: base.password });
    expect(res.status).not.toBe(500);
  });

  test("login: username tidak dikirim -> 400", async () => {
    const res = await request(app).post("/auth/login").send({ password: "x" });
    expect(res.status).toBe(400);
  });
});

describe("Validation - Chats (POST /chats)", () => {
  let agent;
  let otherUserId;

  beforeAll(async () => {
    agent = request.agent(app);
    const username = `valchat_${Date.now()}`;
    await agent.post("/auth/register").send({ username, password: "password123" });
    await agent.post("/auth/login").send({ username, password: "password123" });

    // user kedua, dipakai sebagai participant yang valid di beberapa test
    const otherUsername = `valchat_other_${Date.now()}`;
    const reg = await request(app)
      .post("/auth/register")
      .send({ username: otherUsername, password: "password123" });
    otherUserId = reg.body.id;
  });

  test("type selain P2P/GROUP -> 400", async () => {
    const res = await agent.post("/chats").send({ type: "DM", participants: [otherUserId] });
    expect(res.status).toBe(400);
  });

  test("type lowercase 'p2p' (case-sensitive enum) -> 400", async () => {
    const res = await agent.post("/chats").send({ type: "p2p", participants: [otherUserId] });
    expect(res.status).toBe(400);
  });

  test("P2P dengan participants kosong -> 400", async () => {
    const res = await agent.post("/chats").send({ type: "P2P", participants: [] });
    expect(res.status).toBe(400);
  });

  test("P2P dengan participants lebih dari 1 -> 400", async () => {
    const res = await agent
      .post("/chats")
      .send({ type: "P2P", participants: [otherUserId, 999999] });
    expect(res.status).toBe(400);
  });

  test("GROUP tanpa name -> 400", async () => {
    const res = await agent.post("/chats").send({ type: "GROUP", participants: [otherUserId] });
    expect(res.status).toBe(400);
  });

  test("GROUP dengan name whitespace-only -> 400", async () => {
    const res = await agent
      .post("/chats")
      .send({ type: "GROUP", name: "   ", participants: [otherUserId] });
    expect(res.status).toBe(400);
  });

  test("GROUP dengan participants duplikat -> tidak boleh nyimpan 2 row participant sama", async () => {
    const res = await agent.post("/chats").send({
      type: "GROUP",
      name: `grup_dup_${Date.now()}`,
      participants: [otherUserId, otherUserId],
    });
    expect(res.status).not.toBe(500);
    if (res.status === 201 || res.status === 200) {
      const uniqueIds = new Set(res.body.participants.map((p) => p.id));
      expect(uniqueIds.size).toBe(res.body.participants.length);
    }
  });
});

describe("Validation - Messages (content)", () => {
  let agent;
  let chatId;

  beforeAll(async () => {
    agent = request.agent(app);
    const username = `valmsg_${Date.now()}`;
    await agent.post("/auth/register").send({ username, password: "password123" });
    await agent.post("/auth/login").send({ username, password: "password123" });

    const otherUsername = `valmsg_other_${Date.now()}`;
    const reg = await request(app)
      .post("/auth/register")
      .send({ username: otherUsername, password: "password123" });

    const chatRes = await agent
      .post("/chats")
      .send({ type: "P2P", participants: [reg.body.id] });
    chatId = chatRes.body.id;
  });

  test("content kosong string -> 400", async () => {
    const res = await agent.post(`/chats/${chatId}/messages`).send({ content: "" });
    expect(res.status).toBe(400);
  });

  test("content whitespace/newline-only -> 400", async () => {
    const res = await agent.post(`/chats/${chatId}/messages`).send({ content: "\n\n\n   " });
    expect(res.status).toBe(400);
  });

  test("content tidak dikirim -> 400", async () => {
    const res = await agent.post(`/chats/${chatId}/messages`).send({});
    expect(res.status).toBe(400);
  });

  test("content sangat panjang (50.000 char) -> tidak boleh 500", async () => {
    const res = await agent
      .post(`/chats/${chatId}/messages`)
      .send({ content: "x".repeat(50000) });
    expect(res.status).not.toBe(500);
  });

  test("content tipe data salah (number) -> 400", async () => {
    const res = await agent.post(`/chats/${chatId}/messages`).send({ content: 12345 });
    expect(res.status).toBe(400);
  });
});

describe("Validation - Query params (limit/offset/search)", () => {
  let agent;
  let chatId;

  beforeAll(async () => {
    agent = request.agent(app);
    const username = `valquery_${Date.now()}`;
    await agent.post("/auth/register").send({ username, password: "password123" });
    await agent.post("/auth/login").send({ username, password: "password123" });

    const otherUsername = `valquery_other_${Date.now()}`;
    const reg = await request(app)
      .post("/auth/register")
      .send({ username: otherUsername, password: "password123" });

    const chatRes = await agent
      .post("/chats")
      .send({ type: "P2P", participants: [reg.body.id] });
    chatId = chatRes.body.id;
  });

  test("limit non-numeric ('abc') -> 400", async () => {
    const res = await agent.get(`/chats/${chatId}/messages?limit=abc`);
    expect(res.status).toBe(400);
  });

  test("limit negatif -> ditolak/dinormalisasi, bukan dipakai mentah ke SQL", async () => {
    const res = await agent.get(`/chats/${chatId}/messages?limit=-5`);
    expect(res.status).not.toBe(500);
  });

  test("offset negatif -> tidak boleh 500", async () => {
    const res = await agent.get(`/chats/${chatId}/messages?offset=-100`);
    expect(res.status).not.toBe(500);
  });

  test("limit sangat besar (99999) -> tidak crash (idealnya ada cap)", async () => {
    const res = await agent.get(`/chats/${chatId}/messages?limit=99999`);
    expect(res.status).not.toBe(500);
  });

  test("search 1 karakter -> balikin array kosong", async () => {
    const res = await agent.get("/users?search=a");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("search tidak dikirim -> tetap array, bukan 500", async () => {
    const res = await agent.get("/users");
    expect(res.status).not.toBe(500);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("Validation - Path params (tipe ID)", () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    const username = `valid_${Date.now()}`;
    await agent.post("/auth/register").send({ username, password: "password123" });
    await agent.post("/auth/login").send({ username, password: "password123" });
  });

  test("GET /chats/:id dengan id non-numeric -> 400, bukan 500", async () => {
    const res = await agent.get("/chats/abc");
    expect(res.status).not.toBe(500);
    expect(res.status).toBe(400);
  });

  test("GET /users/:id dengan id negatif -> 400, bukan 500", async () => {
    const res = await agent.get("/users/-1");
    expect(res.status).not.toBe(500);
    expect(res.status).toBe(400);
  });

  test("GET /chats/:id dengan id di luar range integer Postgres -> tidak boleh 500, harus 400", async () => {
    // Postgres integer max ~2147483647. Ini angka jauh di atas itu.
    const res = await agent.get("/chats/999999999999999999999");
    expect(res.status).toBe(400);
  });

  test("GET /users/:id dengan id di luar range integer -> tidak boleh 500, harus 400", async () => {
    const res = await agent.get("/users/999999999999999999999");
    expect(res.status).toBe(400);
  });
});

afterAll(async () => {
  // Cleanup: truncate semua tabel terkait, sesuai kesepakatan strategi cleanup.
  // Sesuaikan dengan module koneksi pg yang dipakai di project (pool/db.js).
  const {pool} = require("../config/postgresql_database"); // sesuaikan path
  await pool.query(
    "TRUNCATE users, chat_rooms, chat_participants, chat_messages RESTART IDENTITY CASCADE"
  );
  await pool.end();
  await app.close();
});
