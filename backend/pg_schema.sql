-- =========================
-- 1. ENUM TYPES
-- =========================

CREATE TYPE chat_room_type AS ENUM (
	'P2P',
	'GROUP'
);

CREATE TYPE participant_role AS ENUM (
	'MEMBER',
	'ADMIN'
);

-- =========================
-- 2. USERS
-- =========================

CREATE TABLE users (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	username varchar(30) NOT NULL UNIQUE,
	password_hash varchar(255) NOT NULL,
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);

-- =========================
-- 3. CHAT ROOMS
-- =========================

CREATE TABLE chat_rooms (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	type chat_room_type NOT NULL,
	name varchar(100),
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);

-- =========================
-- 4. CHAT PARTICIPANTS
-- =========================

CREATE TABLE chat_participants (
	room_id integer NOT NULL,
	user_id integer NOT NULL,
	role participant_role NOT NULL DEFAULT 'MEMBER',
	joined_at timestamp NOT NULL DEFAULT now(),

	PRIMARY KEY (room_id, user_id),

	CONSTRAINT fk_participant_room
		FOREIGN KEY (room_id)
		REFERENCES chat_rooms(id)
		ON DELETE CASCADE,

	CONSTRAINT fk_participant_user
		FOREIGN KEY (user_id)
		REFERENCES users(id)
		ON DELETE CASCADE
);

-- =========================
-- 5. CHAT MESSAGES
-- =========================

CREATE TABLE chat_messages (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	room_id integer NOT NULL,
	sender_id integer NOT NULL,
	content text NOT NULL,
	sent_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp,
	deleted_at timestamp,

	CONSTRAINT fk_message_room
		FOREIGN KEY (room_id)
		REFERENCES chat_rooms(id)
		ON DELETE CASCADE,

	CONSTRAINT fk_message_sender
		FOREIGN KEY (sender_id)
		REFERENCES users(id)
		ON DELETE CASCADE
);

-- =========================
-- 6. INDEXES (biar chat gak lemot pas data banyak)
-- =========================

CREATE INDEX idx_messages_room
	ON chat_messages(room_id);

CREATE INDEX idx_messages_sender
	ON chat_messages(sender_id);

CREATE INDEX idx_messages_room_sent
	ON chat_messages(room_id, sent_at DESC);

CREATE INDEX idx_participants_user
	ON chat_participants(user_id);
