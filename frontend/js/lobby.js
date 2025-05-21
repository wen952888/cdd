// frontend/js/lobby.js

// --- DOM Elements ---
const createRoomNameInputEl = document.getElementById('createRoomNameInput');
const createRoomPasswordInputEl = document.getElementById('createRoomPasswordInput');
const createRoomButtonEl = document.getElementById('createRoomButton');
const roomListEl = document.getElementById('roomList');
const refreshRoomListButtonEl = document.getElementById('refreshRoomListButton');
const lobbyMessageEl = document.getElementById('lobbyMessage');

let currentRoomList = [];
let isLoadingRooms = false;

async function handleCreateRoom() {
    const roomName = createRoomNameInputEl.value.trim();
    const password = createRoomPasswordInputEl.value; // 空字符串或值

    if (!roomName) {
        displayLobbyMessage('请输入房间名称。', true);
        return;
    }
    // 更多前端验证...

    createRoomButtonEl.disabled = true;
    try {
        const result = await apiRequest('room_create.php', 'POST', { roomName, password: password || null });
        if (result.success && result.roomId) {
            displayLobbyMessage('房间创建成功！正在进入...', false, true);
            // 调用 app.js 或 room.js 中的函数进入房间视图
            enterRoom(result.roomId); // 假设 app.js 中有 enterRoom 函数
        } else {
            displayLobbyMessage(result.message || '创建房间失败。', true);
        }
    } catch (error) {
        displayLobbyMessage(error.message || '创建房间请求失败。', true);
    } finally {
        createRoomButtonEl.disabled = false;
    }
}

async function fetchAndRenderRoomList() {
    if (isLoadingRooms) return;
    isLoadingRooms = true;
    if (roomListEl) roomListEl.innerHTML = '<p>正在刷新房间列表...</p>';
    refreshRoomListButtonEl.disabled = true;

    try {
        const result = await apiRequest('room_list.php', 'GET');
        if (result.success && Array.isArray(result.rooms)) {
            currentRoomList = result.rooms;
            renderRoomList(currentRoomList);
            displayLobbyMessage(''); // 清除之前的消息
        } else {
            displayLobbyMessage(result.message || '获取房间列表失败。', true);
            if (roomListEl) roomListEl.innerHTML = '<p>无法加载房间列表。</p>';
        }
    } catch (error) {
        displayLobbyMessage(error.message || '获取房间列表请求失败。', true);
        if (roomListEl) roomListEl.innerHTML = '<p>网络错误，无法加载房间列表。</p>';
    } finally {
        isLoadingRooms = false;
        refreshRoomListButtonEl.disabled = false;
    }
}

function renderRoomList(rooms) {
    if (!roomListEl) return;
    roomListEl.innerHTML = '';
    if (rooms.length === 0) {
        roomListEl.innerHTML = '<p>当前没有可加入的房间。创建一个？</p>';
        return;
    }

    rooms.forEach(room => {
        const item = document.createElement('div');
        item.classList.add('room-item');
        item.innerHTML = `
            <span>${escapeHtml(room.name)} (${room.current_players}/${room.max_players})</span>
            <span>创建者: ${escapeHtml(room.creator_username)}</span>
            <span>${room.has_password ? '🔒' : '无密码'}</span>
        `;
        const joinButton = document.createElement('button');
        joinButton.textContent = '加入';
        if (room.current_players >= room.max_players) {
            joinButton.disabled = true;
            joinButton.title = '房间已满';
        }
        joinButton.onclick = () => handleJoinRoom(room.id, room.has_password);
        item.appendChild(joinButton);
        roomListEl.appendChild(item);
    });
}

async function handleJoinRoom(roomId, hasPassword) {
    let passwordAttempt = null;
    if (hasPassword) {
        passwordAttempt = prompt(`房间 "${currentRoomList.find(r=>r.id === roomId)?.name || roomId}" 需要密码，请输入:`);
        if (passwordAttempt === null) return; // 用户取消
    }

    // 可以在这里禁用所有加入按钮，显示加载状态
    displayLobbyMessage(`正在加入房间 ${roomId}...`);
    try {
        const result = await apiRequest('room_join.php', 'POST', { roomId, password: passwordAttempt });
        if (result.success && result.roomId) {
            displayLobbyMessage('成功加入房间！正在进入...', false, true);
            enterRoom(result.roomId); // 调用 app.js 或 room.js 中的函数进入房间视图
        } else {
            displayLobbyMessage(result.message || '加入房间失败。', true);
        }
    } catch (error) {
        displayLobbyMessage(error.message || '加入房间请求失败。', true);
    }
}


function displayLobbyMessage(message, isError = false, isSuccess = false) {
    if (lobbyMessageEl) {
        lobbyMessageEl.textContent = message;
        lobbyMessageEl.className = 'message-area'; // Reset classes
        if (isError) lobbyMessageEl.classList.add('error');
        if (isSuccess) lobbyMessageEl.classList.add('success');
    }
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, """)
         .replace(/'/g, "'");
}

// 在 lobby.js 加载时自动获取一次房间列表
// fetchAndRenderRoomList(); // 或者在 app.js 中，当切换到 lobby 视图时调用
