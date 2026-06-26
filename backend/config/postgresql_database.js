const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

// fungsi query utama
async function query(text, params) {
	try {
		return await pool.query(text, params);
	} catch (err) {
		console.error("DB Query Error:", err.message);
		throw err;
	}
}

async function testConnection() {
	console.log("TEST database con");
	try {
		const result = await pool.query("SELECT NOW()");
		console.log("✅ DB Connected Successfully:", result.rows[0]);
	} catch (err) {
		console.error("❌ DB Connection Failed:", err.message);
	}
}

// jalankan sekali saat startup
// testConnection();

module.exports = { query, pool };
