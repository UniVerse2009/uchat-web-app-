const plus = document.getElementById('plus');
const overlay = document.getElementById('overlay');
const submitCreateChat = document.getElementById('submitCreateChat');
const chatInput = document.getElementById('chatInput');
const chatListNavbar = document.getElementById('chatlist-navbar');

const BASE_URL = `${window.location.protocol}//${window.location.host}`;

// Disable dulu sampai init() selesai â€” myId belum tentu terisi kalau user keburu klik
plus.disabled = true;


plus.addEventListener('click', (e) => {
  overlay.classList.add('active');
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    overlay.classList.remove('active');
  }
});

submitCreateChat.addEventListener('click', async (e) => {
  const input = overlay.querySelector('input').value.trim();

  if (!input) {
    alert('Username tidak boleh kosong');
    return;
  }

  // Step 1: Search user by username
  const searchRes = await fetch(`${BASE_URL}/users?search=${encodeURIComponent(input)}`, {
    credentials: 'include'
  });
  const results = await searchRes.json();

  // Cari exact match dulu, kalau gak ada ambil yang pertama
  const found = results.find(u => u.username === input) || results[0];

  if (!found) {
    alert(`User "${input}" tidak ditemukan`);
    return;
  }

  if (found.id == myId) {
    alert('Tidak bisa chat dengan diri sendiri');
    return;
  }

  const response = await fetch(`${BASE_URL}/chats`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'P2P',
      participants: [found.id]
    })
  });

  if (response.ok) {
    alert('Success');
    /*overlay.classList.remove('active');
    // Refresh chat list
    const newChatList = await fetchChats();
    ChatList.innerHTML = '';
    showChatList(ChatList, newChatList);
    document.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', () => onChatItemClick(item));
    });*/
  } else {
    const err = await response.json();
    alert('Error: ' + (err.error || 'Unknown error'));
  }
});

const ChatList = document.getElementById('chatList');
const ChatView = document.getElementById('chatView');
const ChatMessage = document.getElementById('chatMessage');

let myId;
let myUsername;
let nowRoom;

function compare(incoming) {
  if (!(incoming instanceof Date)) {
    throw new TypeError("incoming harus Date");
  }
  if (!compare.current) {
    compare.current = new Date(0);
  }
  const endOfDay = new Date(compare.current);
  endOfDay.setHours(23, 59, 59, 999);
  if (incoming > endOfDay) {
    compare.current = incoming;
    return true;
  }
  return false;
}

function humanizeDate(obj) {
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${obj.getDate()} ${namaBulan[obj.getMonth()]} ${obj.getFullYear()}`;
}

// Konversi format chat dari server baru ke format yang dimengerti showChatList
// Server baru: { id, type, name, created_at, participants: [{id, username}] }
// Kita perlu derive other_username dari participants
function normalizeChatList(rawChats) {
  return rawChats.map(chat => {
    const others = (chat.participants || []).filter(p => p.id != myId);
    const other = others[0];
    return {
      room_id: chat.id,
      type: chat.type,
      other_username: chat.type === 'P2P'
        ? (other?.username || 'Unknown')
        : (chat.name || 'Group'),
      last_message: chat.last_message || '(belum ada pesan)',
      last_message_time: chat.last_message_time || chat.created_at,
      last_message_sender_id: chat.last_message_sender_id || null
    };
  }).sort((a, b) =>
new Date(b.last_message_time) - new Date(a.last_message_time));
}

// Konversi pesan dari server baru ke format renderChat
// Server baru: { id, room_id, sender_id, content, sent_at }
// renderChat butuh: { id, room_id, sender_id, message, sended_at, sender_username }
function normalizeMessages(rawMessages) {
  return rawMessages.map(msg => ({
    id: msg.id,
    room_id: msg.room_id,
    sender_id: msg.sender_id,
    message: msg.content,
    sended_at: msg.sent_at,
    sender_username: msg.sender_username || `User ${msg.sender_id}`
  }));
}

function showChatList(chatList, conversation) {
  conversation.forEach(item => {
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-item');
    chatItem.dataset.room_id = item.room_id;

    const chatAvatar = document.createElement('div');
    chatAvatar.classList.add('chat-avatar');
    let avatar;
    switch (item.type) {
      case 'P2P':   avatar = '👤'; break;
      case 'GROUP': avatar = '👥'; break;
      default:      avatar = '🪨';
    }
    chatAvatar.innerHTML = avatar;

    const chatMeta = document.createElement('div');
    chatMeta.classList.add('chat-meta');

    const chatTop = document.createElement('div');
    chatTop.classList.add('chat-top');

    const chatName = document.createElement('span');
    chatName.classList.add('chat-name');
    chatName.innerHTML = item.other_username;

    const chatTime = document.createElement('span');
    chatTime.classList.add('chat-time');
    const time = new Date(item.last_message_time?.replace('Z', ''));
    chatTime.textContent = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

    const chatPreview = document.createElement('div');
    chatPreview.classList.add('chat-preview');
    chatPreview.innerHTML = `<strong>${myId == item.last_message_sender_id ? 'You' : item.other_username}: </strong>${item.last_message}`;

    chatTop.appendChild(chatName);
    chatTop.appendChild(chatTime);
    chatMeta.appendChild(chatTop);
    chatMeta.appendChild(chatPreview);
    chatItem.appendChild(chatAvatar);
    chatItem.appendChild(chatMeta);
    ChatList.appendChild(chatItem);
  });
}

function renderChat(ChatMessageDOM, message) {
  ChatMessageDOM.innerHTML = '';
  message.forEach(item => {
    if (compare(new Date(item.sended_at))) {
      const dateBox = document.createElement('div');
      dateBox.classList.add('date-separator');
      dateBox.innerHTML = `<span>${humanizeDate(compare.current)}</span>`;
      ChatMessageDOM.appendChild(dateBox);
    }

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'you');

    if (item.sender_id != myId) {
      const sender = document.createElement('div');
      sender.className = 'sender';
      sender.textContent = item.sender_username;
      msgDiv.classList.replace('you', 'other');
      msgDiv.appendChild(sender);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = item.message;
    msgDiv.appendChild(bubble);

    const time = document.createElement('div');
    time.className = 'time';
    const time_ = new Date(item.sended_at?.replace('Z', ''));
    time.textContent = `${time_.getHours()}:${String(time_.getMinutes()).padStart(2, '0')}`;
    msgDiv.appendChild(time);

    ChatMessageDOM.appendChild(msgDiv);
    ChatMessageDOM.scrollTop = ChatMessageDOM.scrollHeight;
  });
}

function addChatToList(rawChat) {

	// Normalisasi dulu biar konsisten
	const [item] = normalizeChatList([rawChat]);

	// Cek apakah sudah ada
	const existing = ChatList.querySelector(
		`[data-room_id="${item.room_id}"]`
	);

	if (existing) {
		return; // jangan bikin duplikat, kita bukan kolektor bug
	}

	const chatItem = document.createElement('div');
	chatItem.classList.add('chat-item');
	chatItem.dataset.room_id = item.room_id;

	const chatAvatar = document.createElement('div');
	chatAvatar.classList.add('chat-avatar');

	let avatar;
	switch (item.type) {
		case 'P2P':   avatar = '👤'; break;
		case 'GROUP': avatar = '👥'; break;
		default:      avatar = '🪨';
	}

	chatAvatar.innerHTML = avatar;

	const chatMeta = document.createElement('div');
	chatMeta.classList.add('chat-meta');

	const chatTop = document.createElement('div');
	chatTop.classList.add('chat-top');

	const chatName = document.createElement('span');
	chatName.classList.add('chat-name');
	chatName.innerHTML = item.other_username;

	const chatTime = document.createElement('span');
	chatTime.classList.add('chat-time');

	const time = new Date(item.last_message_time?.replace('Z', ''));
	chatTime.textContent =
		`${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

	const chatPreview = document.createElement('div');
	chatPreview.classList.add('chat-preview');

	chatPreview.innerHTML =
		`<strong>${myId == item.last_message_sender_id ? 'You' : item.other_username}: </strong>${item.last_message}`;

	chatTop.appendChild(chatName);
	chatTop.appendChild(chatTime);
	chatMeta.appendChild(chatTop);
	chatMeta.appendChild(chatPreview);

	chatItem.appendChild(chatAvatar);
	chatItem.appendChild(chatMeta);

	chatItem.addEventListener('click', () => {
		onChatItemClick(chatItem);
	});

	// 🔥 taruh di paling atas
	ChatList.prepend(chatItem);
}

function updateChatPreview(message) {

	const { room_id, sender_id, sender_username, content, sent_at } = message;

	const chatItem = ChatList.querySelector(
		`[data-room_id="${room_id}"]`
	);

	// Kalau chat belum ada di sidebar (kasus jarang tapi mungkin)
	if (!chatItem) {
		console.warn('Chat not found in list, skipping preview update');
		return;
	}

	// Update waktu
	const chatTime = chatItem.querySelector('.chat-time');
	const time = new Date(sent_at?.replace('Z', ''));
	chatTime.textContent =
		`${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

	// Update preview
	const chatPreview = chatItem.querySelector('.chat-preview');

	const label =
		myId == sender_id
			? 'You'
			: sender_username;

	chatPreview.innerHTML =
		`<strong>${label}: </strong>${content}`;

	// 🔥 Pindahkan ke paling atas
	ChatList.prepend(chatItem);
}

function renderNewMessage(ChatMessageDOM, rawMessage) {

	const [item] = normalizeMessages([rawMessage]);
	console.log('RAW from socket:', rawMessage);

	// Cek apakah perlu date separator
	if (compare(new Date(item.sended_at))) {
		const dateBox = document.createElement('div');
		dateBox.classList.add('date-separator');
		dateBox.innerHTML =
			`<span>${humanizeDate(compare.current)}</span>`;
		ChatMessageDOM.appendChild(dateBox);
	}

	const msgDiv = document.createElement('div');
	msgDiv.classList.add('message');

	if (item.sender_id == myId) {
		msgDiv.classList.add('you');
	} else {
		msgDiv.classList.add('other');

		const sender = document.createElement('div');
		sender.className = 'sender';
		sender.textContent = item.sender_username;
		msgDiv.appendChild(sender);
	}

	const bubble = document.createElement('div');
	bubble.className = 'bubble';
	bubble.textContent = item.message;
	msgDiv.appendChild(bubble);

	const time = document.createElement('div');
	time.className = 'time';

	const time_ = new Date(item.sended_at?.replace('Z', ''));
	time.textContent =
		`${time_.getHours()}:${String(time_.getMinutes()).padStart(2, '0')}`;

	msgDiv.appendChild(time);

	ChatMessageDOM.appendChild(msgDiv);

	// 🔥 Smart auto-scroll
	const isNearBottom =
		ChatMessageDOM.scrollHeight -
		ChatMessageDOM.scrollTop -
		ChatMessageDOM.clientHeight < 50;

	if (isNearBottom) {
		ChatMessageDOM.scrollTop = ChatMessageDOM.scrollHeight;
	}
}

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function showTypingIndicator(text) {
  
  let indicator = document.getElementById('typingIndicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.classList.add('message', 'other');
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    indicator.appendChild(bubble);
    
    ChatMessage.appendChild(indicator);
  }
  
  const bubble = indicator.querySelector('.bubble');
  // Changed
  // bubble.textContent = text ? text : '• • •';
  bubble.innerHTML = '';
  const message = document.createElement('span');
  message.id = 'message';
  message.textContent = text ? text : '• • •';

  const load = document.createElement('div');
  load.id = 'load';

  for(let i = 0; i < 3; i++){
   const dot = document.createElement('div');
   dot.className = 'dot';
   dot.textContent = '• ';
   load.appendChild(dot);
  }

  bubble.appendChild(message);
  bubble.appendChild(load);
  ChatMessage.scrollTop = ChatMessage.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

document.getElementById('backBtn').addEventListener('click', () => {
  ChatList.classList.remove('hidden');
  ChatView.classList.remove('active');
  plus.classList.remove('hidden');
  chatListNavbar.style.display = 'flex';
});

document.getElementById('sendBtn').addEventListener('click', async () => {
  if (!nowRoom || !socket) return;
  const input = document.getElementById('chatInput');
  const value = input.value.trim();
  if (!value) return;

  const res = await fetch(`${BASE_URL}/chats/${nowRoom}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: value })  // key: content, bukan message
  });
  
  socket.emit('chat:stopTyping', nowRoom);
  typing = false;

  if (res.ok) {
    input.value = '';
    // Append pesan baru ke list tanpa re-fetch semua
    /*const newMsg = await res.json();
    const normalized = normalizeMessages([newMsg]);
    messageList.push(normalized[0]);
    compare.current = null;
    renderChat(ChatMessage, messageList);*/
  } else {
    const err = await res.json();
    alert('Gagal kirim: ' + (err.error || 'Unknown'));
  }
});

/*let typing = false;
let stopTypingTimeout;

chatInput.addEventListener('input', (a) => {
	if (!nowRoom || !socket) return;

	if (!typing) {
		socket.emit('chat:typing', {chatId: nowRoom, content: a.target.value});
		typing = true;
	}

	clearTimeout(stopTypingTimeout);

	stopTypingTimeout = setTimeout(() => {
		socket.emit('chat:stopTyping', nowRoom);
		typing = false;
	}, 300); // debounce stop
});*/

let debounceTimer = null;
let maxWaitTimer = null;
let lastContent = '';
let firstKeystrokeTime = null;

let lastSentContent = '';

chatInput.addEventListener('input', (e) => {
  if (!nowRoom || !socket) return;
  
  lastContent = e.target.value; // jangan trim dulu
  
  // debounce
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(triggerSend, 500);
  
  // max wait
  if (!maxWaitTimer) {
    maxWaitTimer = setTimeout(triggerSend, 1500);
  }
});

function triggerSend() {
  clearTimeout(debounceTimer);
  clearTimeout(maxWaitTimer);
  maxWaitTimer = null;
  
  sendPreview();
}

function sendPreview() {
	if (!lastContent) {
		socket.emit('chat:stopTyping', { chatId: nowRoom });
	} else {
		socket.emit('chat:typing', {
			chatId: nowRoom,
			content: lastContent
		});
	}

	clearTimeout(debounceTimer);
	clearTimeout(maxWaitTimer);

	firstKeystrokeTime = null;
}



let typingTimeout = null;

let messageList;
let chatList;

async function fetchChats() {
  // GET /chats â€” ambil semua chat user yang login
  // Tapi server hanya return { id, type, name, created_at } tanpa participants
  // Kita perlu fetch detail tiap chat untuk dapat participants
  const response = await fetch(`${BASE_URL}/chats`, {
    method: 'GET',
    credentials: 'include'
  });
  const rawList = await response.json();

  // Fetch detail tiap chat (biar dapat participants)
  const detailed = await Promise.all(
    rawList.map(c =>
      fetch(`${BASE_URL}/chats/${c.id}`, { credentials: 'include' })
        .then(r => r.json())
    )
  );
  return normalizeChatList(detailed);
}

async function fetchMessages(roomId) {
  const response = await fetch(
    `${BASE_URL}/chats/${roomId}/messages?limit=1000&offset=0`,
    { method: 'GET', credentials: 'include' }
  );
  const raw = await response.json();
  return normalizeMessages(raw);
}

async function fetchMyId() {
  const response = await fetch(`${BASE_URL}/users/me`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.id;
}

async function fetchMyUsername() {
  const response = await fetch(`${BASE_URL}/users/me`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.username;
}



async function onChatItemClick(item) {
  compare.current = null;
  nowRoom = item.dataset.room_id;

  messageList = await fetchMessages(nowRoom);
  myId = await fetchMyId();

  if (isMobile()) {
    ChatList.classList.add('hidden');
    ChatView.classList.add('active');
    plus.classList.add('hidden');
    chatListNavbar.style.display = 'none';
  }

  renderChat(ChatMessage, messageList);
  //setupChatSocket(nowRoom);
}

async function init() {

  // Satu fetch untuk dapat myId dan myUsername sekaligus
  const me = await fetch(`${BASE_URL}/users/me`, { credentials: 'include' }).then(r => r.json());
  myId = me.id;
  myUsername = me.username;
  
  // Baru enable setelah myId pasti terisi
  plus.disabled = false;
  try{
  renderSkeleton();
  chatList = await fetchChats();
  try{
    setupSocket(chatList.map(e => e.room_id));
  }catch(e){
    console.log('Socket error: ', e);
  }
  ChatList.innerHTML = '';
  showChatList(ChatList, chatList);
  }catch(e){
    ChatList.innerHTML = '<p style="padding:16px;">Gagal memuat chat</p>';
  }

  document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => onChatItemClick(item));
  });
}

if (window.visualViewport) {
	window.visualViewport.addEventListener('resize', () => {
		// Pastikan kita sedang berada di dalam chat room
		if (nowRoom) {
			ChatMessage.scrollTop = ChatMessage.scrollHeight;
		}
	});
} else {
	// Fallback untuk browser HP versi lama yang tidak support visualViewport
	window.addEventListener('resize', () => {
		if (nowRoom) {
			ChatMessage.scrollTop = ChatMessage.scrollHeight;
		}
	});
}

const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
  /*const confirmLogout = confirm('Logout?');
  if (!confirmLogout) return;*/
  
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (socket) {
      socket.disconnect();
    }
    
    location.reload();
  } catch (err) {
    alert('Gagal logout');
  }
});

function renderSkeleton(count = 6) {
  ChatList.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'skeleton-item';
    
    item.innerHTML = `
			<div class="skeleton-avatar"></div>
			<div class="skeleton-content">
				<div class="skeleton-line long"></div>
				<div class="skeleton-line short"></div>
			</div>
		`;
    
    ChatList.appendChild(item);
  }
}

let socket;
/*=========WS=========*/
function setupSocket(roomIds){
socket = io(`${BASE_URL}`, {
	withCredentials: true
});
socket.on('connect', () => {
	console.log('Socket connected:', socket.id);
	for(const room_id of roomIds){
	  socket.emit('chat:join', room_id);
	}
});
socket.on('chat:new', (chat) => {
	console.log('New chat created:', chat);
	addChatToList(chat);
	socket.emit('chat:join', chat.id);
});
socket.on('message:new', (message) => {
	console.log('There new message:', message);

	// Update preview chat list
	updateChatPreview(message);

	// Kalau sedang buka chat itu
	if (nowRoom == message.room_id) {
		messageList.push(message);
		renderNewMessage(ChatMessage, message);
	}
});

socket.on('chat:typing', ({ chatId, userId, content }) => {
	// Jangan tampilkan kalau itu diri sendiri
	if (userId == myId) return;

	// Hanya tampil kalau sedang buka room itu
	if (chatId != nowRoom) return;

	showTypingIndicator(content);

	// Reset timeout biar gak flicker
	clearTimeout(typingTimeout);
	typingTimeout = setTimeout(() => {
		hideTypingIndicator();
	}, 2000); // 2 detik tanpa event → hilang
});


socket.on('chat:stopTyping', ({ chatId, userId }) => {

	/*if (userId == myId) return;*/
	if (chatId != nowRoom) return;

	hideTypingIndicator();
});
}
/*=====================*/

init();
