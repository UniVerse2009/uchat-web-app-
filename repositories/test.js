/*const bcrypt = require('bcrypt');

const myPassword = "Secret123";
const saltRounds = 10; // Standar keamanan saat ini

// --- Pendekatan Asynchronous (Terbaik) ---
bcrypt.hash(myPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error("Terjadi kesalahan:", err);
        return;
    }
    console.log("Hash Asynchronous:", hash);
});

// --- Pendekatan Async/Await (Lebih Bersih) ---
async function hashPassword() {
    const hash = await bcrypt.hash(myPassword, saltRounds);
    console.log("Hash dengan Async/Await:", hash);
}

hashPassword();*/

const { findByUsername, findById } = require("./user.repo");
(async() => {
	console.log(await findById(1));
})();
