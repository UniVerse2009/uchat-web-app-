UChat — Real-Time Chat Application

A full-stack real-time messaging application built with Node.js, Express, PostgreSQL, and Socket.IO. Supports peer-to-peer (P2P) chat rooms with live event broadcasting, session-based authentication, and a layered server architecture.

---

Table of Contents

- "Overview" (#overview)
- "Features" (#features)
- "Tech Stack" (#tech-stack)
- "Architecture" (#architecture)
- "Database Schema" (#database-schema)
- "Repository Implementations" (#repository-implementations)
- "API Reference" (#api-reference)
- "WebSocket Events" (#websocket-events)
- "Getting Started" (#getting-started)
- "Running the App" (#running-the-app)
- "Testing" (#testing)
- "Security Notes" (#security-notes)
- "Project Structure" (#project-structure)
- "Design Decisions" (#design-decisions)

---

Overview

UChat is a lightweight, extensible real-time chat application designed with clear separation of concerns across Repository, Service, and Route layers.

The backend shares the same session middleware between the HTTP and WebSocket layers, allowing both protocols to operate under the same authentication context.

Unlike previous versions, the project now separates the frontend and backend into independent directories. This layout makes it easier to deploy the frontend and backend independently while preserving the same backend architecture.

«⚠️ Note: Group chat functionality is currently only a structural placeholder (stub). The core logic is not fully implemented yet and exists mainly as a foundation for future development.»

---

Features

- Session-based authentication — login, register, and logout with "express-session" and "bcrypt"
- P2P chat rooms — fully functional one-on-one conversations
- Group chat (stub) — structure exists but not fully implemented
- Real-time messaging — messages, edits, and deletions are broadcast instantly via Socket.IO
- Real-time typing indicator (aggressive) — broadcasts actual typing content
- Message history — paginated retrieval using "limit" and "offset"
- User search — fuzzy username lookup
- Authorization guards — HTTP and Socket.IO middleware
- Automatic room cleanup when no participants remain
- Interchangeable repository layer supporting PostgreSQL and MySQL

---

Tech Stack

Layer| Technology
Frontend| HTML, CSS, Vanilla JavaScript
Runtime| Node.js
HTTP Framework| Express.js
Real-Time| Socket.IO
Database| PostgreSQL (Supabase)
Authentication| express-session + bcrypt

---

Architecture

The backend follows a three-layer architecture:

Route Layer      → Handles HTTP/WebSocket I/O
Service Layer    → Business logic & validation
Repository Layer → Database abstraction

Deployment architecture:

Frontend (Static HTML/CSS/JS)
            │
            ▼
Backend (Express + Socket.IO)
            │
            ▼
PostgreSQL (Supabase)

This separation allows the frontend and backend to be deployed independently.

---

Database Schema

Core tables:

- "users"
- "chat_rooms"
- "chat_participants"
- "chat_messages"

A correlated subquery is used to efficiently retrieve the latest message for each room.

The project currently provides two SQL schemas:

- "backend/pg_schema.sql" (default)
- "backend/schema.sql" (legacy MySQL)

---

Repository Implementations

The repository layer currently provides two interchangeable implementations:

repositories/
├── mysql/
└── postgresql/

Both implementations expose the same interface, allowing the backend to switch database engines simply by changing the imported repository implementation.

The PostgreSQL implementation is now the default.

«Future versions may replace this approach with an ORM.»

---

API Reference

«All endpoints require a valid session unless stated otherwise.»

Auth — "/auth"

Method| Endpoint| Description
"POST"| "/auth/login"| Login
"POST"| "/auth/register"| Register
"POST"| "/auth/logout"| Logout
"GET"| "/auth/me"| Current authenticated user

Chats — "/chats"

Method| Endpoint| Description
"GET"| "/chats"| List all user chats
"POST"| "/chats"| Create new chat
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
"GET"| "/users/:id"| User profile

---

WebSocket Events

Client → Server

Event| Description
"chat:join"| Join chat room
"chat:leave"| Leave chat room
"chat:typing"| Send typing content
"chat:stopTyping"| Stop typing

Server → Client

Event| Description
"message:new"| New message
"message:updated"| Edited message
"message:deleted"| Deleted message
"chat:typing"| Typing preview
"chat:stopTyping"| Stop typing

---

Getting Started

Prerequisites

- Node.js ≥ 18
- PostgreSQL (or Supabase)

Installation

git clone https://github.com/UniVerse2009/uchat-web-app-.git

cd uchat/backend

npm install

psql < pg_schema.sql

node server.js

---

Running the App

The project now consists of two independent applications.

Backend

The backend exposes:

- REST API
- Socket.IO server
- Authentication
- Business logic
- Repository layer

Run from:

backend/

Frontend

The frontend contains static assets:

- HTML
- CSS
- Vanilla JavaScript

located under:

frontend/

The frontend can be served by any static hosting provider while the backend runs independently.

---

Testing

The backend includes a small collection of tests under:

backend/tests/

Current tests include:

- Validation tests
- Security tests
- User flow tests

Some services also include service-level test files alongside their implementations.

---

Security Notes

- Database credentials should be supplied through environment variables.
- Session secrets should never be hardcoded.
- Production deployments should always use HTTPS and secure cookies.
- Repository implementations intentionally isolate SQL from business logic to simplify future migrations.

---

Project Structure

.
├── backend
│   ├── config
│   ├── middlewares
│   ├── repositories
│   │   ├── mysql
│   │   └── postgresql
│   ├── routes
│   ├── schemas
│   ├── services
│   ├── tests
│   ├── server.js
│   ├── schema.sql
│   └── pg_schema.sql
│
├── frontend
│   ├── chat.html
│   ├── login.html
│   ├── *.css
│   ├── *.js
│   └── splash
│
├── dist
├── bundler.js
└── README.md

---

Design Decisions

Why session-based authentication instead of JWT?

Session cookies simplify Socket.IO authentication because HTTP and WebSocket share the same middleware.

Why PostgreSQL?

PostgreSQL is now the default database backend due to its richer SQL features and cloud-hosted compatibility with Supabase.

Why keep MySQL repositories?

Maintaining both implementations makes database migration easier while preserving the same repository interface. The active implementation can be changed by replacing the imported repository module.

Why Repository Layer?

Keeping SQL isolated inside repositories allows the Service layer to remain database-agnostic and simplifies future migration to an ORM.

Why typing indicator sends content?

Instead of broadcasting only a generic typing notification, UChat sends the user's current draft to provide a more interactive (and slightly intrusive) messaging experience.

Why group chat is incomplete?

The structural foundation already exists, allowing future expansion without redesigning the overall architecture.

---

License

MIT
