// validators/chat.schema.js
// Menutup temuan validation.test.js:
// - type selain P2P/GROUP, atau lowercase "p2p" -> 400 (.valid() case-sensitive by design)
// - P2P participants kosong / >1 -> 400 (.length(1) via .when)
// - GROUP tanpa name / name whitespace -> 400 (.required() via .when, .trim().min(1))
// - participants duplikat -> 400 (.unique())
// - chatId non-numeric / negatif / di luar range integer Postgres -> 400 (chatIdParamSchema)
// - limit=abc / limit negatif / offset negatif / limit kelewat besar -> dinormalisasi (paginationSchema)
//
// CATATAN PENTING (di luar kemampuan Joi):
// Validasi "P2P ke diri sendiri" (participants: [ownId]) TIDAK bisa dicek di sini, karena
// schema ini hanya melihat req.body, sedangkan id user yang login ada di req.session/req.user.
// Itu tetap harus dicek manual di service/controller layer (bandingkan creatorId vs participants).

const Joi = require("joi");

const POSTGRES_INT_MAX = 2147483647;

const createChatSchema = Joi.object({
  type: Joi.string().valid("P2P", "GROUP").required().messages({
    "any.only": "type harus P2P atau GROUP (case-sensitive)",
    "any.required": "type wajib diisi",
  }),

  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .when("type", {
      is: "GROUP",
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.empty": "name tidak boleh kosong/whitespace",
      "any.required": "name wajib diisi untuk chat GROUP",
    }),

  participants: Joi.array()
    .items(Joi.number().integer().positive().max(POSTGRES_INT_MAX))
    .unique()
    .when("type", {
      is: "P2P",
      then: Joi.array().length(1).required(),
      otherwise: Joi.array().min(1).required(),
    })
    .messages({
      "array.unique": "participants tidak boleh ada ID duplikat",
      "array.length": "chat P2P harus tepat 1 participant",
      "array.min": "chat GROUP minimal 1 participant",
      "any.required": "participants wajib diisi",
    }),
});

// Dipakai untuk param :chatId di GET/DELETE /chats/:chatId dan nested route messages-nya.
const chatIdParamSchema = Joi.object({
  chatId: Joi.number()
    .integer()
    .positive()
    .max(POSTGRES_INT_MAX)
    .required()
    .messages({
      "number.base": "chatId harus berupa angka",
      "number.max": "chatId di luar rentang yang valid",
      "any.required": "chatId wajib diisi",
    }),
});

// Dipakai untuk query ?limit=&offset= di GET /chats/:chatId/messages.
// default + clamp dipakai supaya nilai aneh dinormalisasi, bukan ditolak 400 —
// karena ini query opsional, lebih ramah kalau "diperbaiki diam-diam" daripada bikin request gagal.
const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = { createChatSchema, chatIdParamSchema, paginationSchema };
