// validators/auth.schema.js
// Menutup temuan validation.test.js:
// - username whitespace-only -> 400 (.trim() lalu .min() menolak hasil trim kosong)
// - password number -> 400 (Joi menolak tipe non-string sebelum sampai bcrypt)
// - password tidak dikirim -> 400
// - username super panjang -> 400 (dibatasi .max(), bukan nyangkut di constraint DB)
// - username emoji/unicode -> tetap lolos (cuma dibatasi panjang, tidak dibatasi charset)
// Sekaligus menutup temuan security.test.js: field asing seperti { role: "admin" }
// otomatis dibuang oleh middleware validate() (stripUnknown), jadi tidak perlu rule khusus di sini.

const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Username tidak boleh kosong",
      "string.min": "Username minimal 3 karakter",
      "string.max": "Username maksimal 50 karakter",
      "any.required": "Username wajib diisi",
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      "string.empty": "Password tidak boleh kosong",
      "string.min": "Password minimal 6 karakter",
      "string.max": "Password maksimal 100 karakter",
      "any.required": "Password wajib diisi",
    }),
});

// Login sengaja dipisah dari register: constraint panjang/format tidak relevan saat login
// (akun lama bisa saja dibuat sebelum aturan ini ada), cukup pastikan field ada dan bertipe string.
const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    "string.empty": "Username tidak boleh kosong",
    "any.required": "Username wajib diisi",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong",
    "any.required": "Password wajib diisi",
  }),
});

module.exports = { registerSchema, loginSchema };
