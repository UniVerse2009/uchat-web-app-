UChat — Real-Time Chat Application

A full-stack real-time messaging application built with Node.js, Express, MySQL, and Socket.IO. Supports peer-to-peer (P2P) chat rooms with live event broadcasting, session-based authentication, and a layered server architecture.

---

Table of Contents

- "Overview" (#overview)
- "Features" (#features)
- "Tech Stack" (#tech-stack)
- "Architecture" (#architecture)
- "Database Schema" (#database-schema)
- "API Reference" (#api-reference)
- "WebSocket Events" (#websocket-events)
- "Getting Started" (#getting-started)
- "Project Structure" (#project-structure)
- "Design Decisions" (#design-decisions)

---

Overview

UChat is a lightweight, extensible chat backend designed with clear separation of concerns across Repository, Service, and Route layers. The application handles real-time communication via Socket.IO, with the WebSocket layer sharing the same session middleware as the HTTP layer to maintain a unified authentication context.

«⚠️ Note: Group chat functionality is currently only a structural placeholder (stub). The core logic is not fully implemented yet and exists mainly as a foundation for future development.»

---

Features

- Session-based authentication — login, register, and logout with "express-session" and "bcrypt" password hashing
- P2P chat rooms — fully functional one-on-one conversations
- Group chat (stub) — structure exists but not fully implemented
- Real-time messaging — messages, edits, and deletions are broadcast instantly via Socket.IO
- Real-time typing indicator (aggressive) — broadcasts actual typing content, giving a “preview” of what the other user is writing
- Message history — paginated message retrieval with "limit" and "offset"
- User search — fuzzy username lookup using SQL "LIKE" queries
- Authorization guards — route-level and socket-level middleware ensure only authenticated participants can access rooms
- Auto-cleanup — chat rooms are deleted when no longer relevant

---

Tech Stack

Layer| Technology
Runtime| Node.js
HTTP Framework| Express.js
Real-Time| Socket.IO
Database| MySQL 2
Authentication| express-session + bcrypt

---

Architecture

The server follows a three-layer architecture:

Route Layer      →  Handles HTTP/WebSocket I/O, delegates to services
Service Layer    →  Encapsulates business logic and validation
Repository Layer →  Owns all SQL queries; returns plain objects

Routes stay clean, services handle logic, repositories deal with SQL.

---

Database Schema

Core tables:

- "users" — credentials
- "chat_rooms" — room metadata ("type": "P2P" | "GROUP")
- "chat_participants" — join table
- "chat_messages" — message storage

A correlated subquery is used to fetch the last message per room efficiently.

---

API Reference

(All endpoints require session unless stated otherwise)

Auth — "/auth"

Method| Endpoint| Description
"POST"| "/auth/login"| Login
"POST"| "/auth/register"| Register
"POST"| "/auth/logout"| Logout
"GET"| "/auth/me"| Current user

Chats — "/chats"

Method| Endpoint| Description
"GET"| "/chats"| List chats
"POST"| "/chats"| Create chat
"GET"| "/chats/:chatId"| Chat detail
"DELETE"| "/chats/:chatId"| Leave chat
"GET"| "/chats/:chatId/messages"| Message history
"POST"| "/chats/:chatId/messages"| Send message

Messages — "/message"

Method| Endpoint| Description
"PATCH"| "/message/:messageId"| Edit message
"DELETE"| "/message/:messageId"| Delete message

Users — "/users"

Method| Endpoint| Description
"GET"| "/users/me"| Current user
"GET"| "/users?search=..."| Search users
"GET"| "/users/:id"| Get user

---

WebSocket Events

Client → Server

Event| Description
"chat:join"| Join room
"chat:leave"| Leave room
"chat:typing"| Send typing content
"chat:stopTyping"| Stop typing

Server → Client

Event| Description
"message:new"| New message
"message:updated"| Edited message
"message:deleted"| Deleted message
"chat:typing"| Other user typing (with content)
"chat:stopTyping"| Stop typing

---

Getting Started

Prerequisites

- Node.js ≥ 18
- MySQL running locally

Installation

git clone https://github.com/your-username/uchat.git
cd uchat

npm install

mysql -u root -p < schema.sql

node server.js

---

Running the App

When running:

node server.js

The server will:

- Start the API at "http://0.0.0.0:3000"
- Serve frontend files via:

/public/login.html
/public/chat.html

So the project includes a minimal frontend that is directly accessible from the same server.

---

⚠️ Security Notes

- Database credentials are hardcoded in "database.js"
- Session secret has a hardcoded fallback in "config/session.js"
- This setup is not safe for production

Use environment variables properly if this project is ever deployed.

---

Project Structure

├── server.js
├── database.js
├── config/
├── repositories/
├── services/
├── routes/
├── middlewares/

---

Design Decisions

Why session-based auth instead of JWT?
Session cookies simplify Socket.IO authentication since both HTTP and WebSocket share the same middleware.

Why MySQL?
Chat systems are inherently relational. SQL fits naturally for users, rooms, and messages.

Why typing indicator sends content?
Instead of a generic “user is typing” signal, this app sends actual draft content in real-time.
This creates a more interactive (and slightly intrusive) chat experience.

Why group chat is incomplete?
It exists as a structural placeholder so the system can be extended cleanly without redesigning the core architecture later.

---

License

MIT
