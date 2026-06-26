// validators/user.schema.js
//
// GET /users/:id — di route aslinya SAMA SEKALI tidak ada guard sebelum `Number(req.params.id)`
// ditembak ke userService.getUserById(). Tidak ada middleware lain semacam requireChatMember
// di jalur ini, jadi cukup pasang validate() di depan, tidak ada isu urutan middleware seperti
// kasus chat kemarin.
//
// Menutup temuan validation.test.js:
// - GET /users/:id dengan id negatif -> 400 (sebelumnya 404 "rapi" secara kebetulan,
//   sekarang ditolak lebih awal dan lebih jujur sebagai 400 "request salah bentuk")
// - GET /users/:id dengan id di luar range integer Postgres -> 400 (sebelumnya 500)
// - GET /users/:id dengan id non-numeric ("abc") -> 400

const Joi = require("joi");

const POSTGRES_INT_MAX = 2147483647;

const userIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .max(POSTGRES_INT_MAX)
    .required()
    .messages({
      "number.base": "id harus berupa angka",
      "number.max": "id di luar rentang yang valid",
      "any.required": "id wajib diisi",
    }),
});

// GET /users?search=... — sengaja TIDAK menambahkan .min(2) di sini.
// Aturan "search < 2 karakter -> balikin array kosong []" itu business rule yang sudah
// ditangani di controller (bukan error 400), dan itu keputusan yang benar: search pendek
// bukan "request salah bentuk", cuma "belum cukup untuk diproses". Joi di sini cuma jaga-jaga
// kalau search dikirim dengan tipe aneh (misal ?search[]=a yang di-parse Express jadi array/object),
// supaya tidak nyangkut di .trim() yang ngarepin string dan bikin 500.
const searchQuerySchema = Joi.object({
  search: Joi.string().trim().allow("").optional().messages({
    "string.base": "search harus berupa teks",
  }),
});

module.exports = { userIdParamSchema, searchQuerySchema };
