// validators/message.schema.js
// Dipakai di 2 tempat: POST /chats/:chatId/messages (kirim) dan PATCH /message/:messageId (edit).
// Keduanya pakai schema content yang sama karena rule-nya identik.
//
// Menutup temuan validation.test.js:
// - content kosong string -> 400
// - content whitespace/newline-only -> 400 (.trim() lalu .min(1) menolak hasil trim kosong)
// - content tidak dikirim -> 400
// - content tipe data salah (number) -> 400 (Joi menolak tipe sebelum nyampe query insert)
// - content 50.000 karakter -> 400 (sebelumnya 500 crash, sekarang ditolak rapi oleh .max())
// - messageId non-numeric / negatif / di luar range integer -> 400 (messageIdParamSchema)

const Joi = require("joi");

const POSTGRES_INT_MAX = 2147483647;

// max(5000) adalah angka asumsi gue — sesuaikan kalau lo punya batas lain yang lebih
// cocok buat use-case chat (misal 2000 atau 10000), karena tidak ada acuan eksplisit
// dari kode lama soal batas panjang pesan.
const messageContentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required().messages({
    "string.empty": "content tidak boleh kosong/whitespace",
    "string.max": "content maksimal 5000 karakter",
    "any.required": "content wajib diisi",
  }),
});

// Dipakai untuk param :messageId di PATCH/DELETE /message/:messageId.
const messageIdParamSchema = Joi.object({
  messageId: Joi.number()
    .integer()
    .positive()
    .max(POSTGRES_INT_MAX)
    .required()
    .messages({
      "number.base": "messageId harus berupa angka",
      "number.max": "messageId di luar rentang yang valid",
      "any.required": "messageId wajib diisi",
    }),
});

module.exports = { messageContentSchema, messageIdParamSchema };
