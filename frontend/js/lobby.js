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
    if (roomName.length > 30) { // 示例：限制房间名长度
        displayLobbyMessage('房间名称过长 (最多30字符)。', true);
        return;
    }

    createRoomButtonEl.disabled = true;
    try {
        const result = await apiRequest('room_create.php', 'POST', { roomName, password: password || null });
        if (result.success && result.roomId) {
            displayLobbyMessage('房间创建成功！正在进入...', false, true);
            // enterRoom 是在 app.js 中定义的全局函数
            if (typeof enterRoom === 'function') {
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined globally.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
            }
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
    if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = true;

    try {
        const result = await apiRequest('room_list.php', 'GET'); // apiRequest 在 auth.js 中定义并全局可用
        if (result.success && Array.isArray(result.rooms)) {
            currentRoomList = result.rooms;
            renderRoomListDOM(currentRoomList); // 调用新的渲染函数
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
        if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = false;
    }
}

// 将渲染逻辑独立出来，方便维护
function renderRoomListDOM(rooms) {
    if (!roomListEl) {
        console.error("Lobby: roomListEl not found for rendering.");
        return;
    }
    roomListEl.innerHTML = ''; // 清空现有列表
    if (!rooms || rooms.length === 0) {
        roomListEl.innerHTML = '<p>当前没有可加入的房间。创建一个？</p>';
        return;
    }

    rooms.forEach(room => {
        const item = document.createElement('div');
        item.classList.add('room-item');

        // 使用 textContent 或 innerHTML 配合 escapeHtml 来防止 XSS
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${escapeHtml(room.name)} (${room.current_players}/${room.max_players})`;

        const creatorSpan = document.createElement('span');
        creatorSpan.textContent = `创建者: ${escapeHtml(room.creator_username)}`;

        const passwordSpan = document.createElement('span');
        passwordSpan.textContent = room.has_password ? '🔒' : '无密码';

        item.appendChild(nameSpan);
        item.appendChild(creatorSpan);
        item.appendChild(passwordSpan);

        const joinButton = document.createElement('button');
        joinButton.textContent = '加入';
        if (parseInt(room.current_players, 10) >= parseInt(room.max_players, 10)) {
            joinButton.disabled = true;
            joinButton.title = '房间已满';
        }
        // 确保 handleJoinRoom 是全局可访问的，或者通过参数传递
        joinButton.onclick = () => {
            if (typeof handleJoinRoom === 'function') {
                handleJoinRoom(room.id, room.has_password);
            } else {
                console.error('Lobby Error: handleJoinRoom function is not defined.');
            }
        }; // 这是第133行可能出错的地方，确保括号正确

        item.appendChild(joinButton);
        roomListEl.appendChild(item);
    });
}

async function handleJoinRoom(roomId, hasPassword) {
    let passwordAttempt = null;
    if (hasPassword) {
        // 查找房间名用于提示，如果找不到，则只用roomId
        const roomForPrompt = currentRoomList.find(r => r.id === roomId);
        const promptMessage = `房间 "${roomForPrompt ? escapeHtml(roomForPrompt.name) : roomId}" 需要密码，请输入:`;
        passwordAttempt = prompt(promptMessage); // prompt 返回 null 如果用户取消
        if (passwordAttempt === null) {
            console.log('Join room cancelled by user.');
            return;
        }
    }

    displayLobbyMessage(`正在加入房间 ${roomId}...`);
    // 禁用所有加入按钮或显示全局加载状态，防止重复点击
    document.querySelectorAll('#roomList .room-item button').forEach(btn => btn.disabled = true);

    try {
        const result = await apiRequest('room_join.php', 'POST', { roomId, password: passwordAttempt });
        if (result.success && result.roomId) {
            displayLobbyMessage('成功加入房间！正在进入...', false, true);
            if (typeof enterRoom === 'function') { // enterRoom 在 app.js 定义
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
            }
        } else {
            displayLobbyMessage(result.message || '加入房间失败。', true);
        }
    } catch (error) {
        displayLobbyMessage(error.message || '加入房间请求失败。', true);
    } finally {
        // 重新启用加入按钮（或者在成功加入后，大厅视图会被隐藏，所以可能不需要）
        // 但如果加入失败，应该重新启用
        if (currentViewId === 'lobby') { // 仅当仍在lobby视图时才操作按钮
             fetchAndRenderRoomList(); // 刷新列表以更新按钮状态和房间人数
        }
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
