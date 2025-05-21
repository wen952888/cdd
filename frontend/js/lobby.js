// frontend/js/lobby.js
console.log("lobby.js: STARTED parsing");

// --- DOM Elements (在函数内部获取，或确保在DOMContentLoaded后才访问) ---
// const createRoomNameInputEl = document.getElementById('createRoomNameInput'); // 这些可以在函数内获取，或在app.js的DOMContentLoaded后初始化
// const createRoomPasswordInputEl = document.getElementById('createRoomPasswordInput');
// const createRoomButtonEl = document.getElementById('createRoomButton');
// const roomListEl = document.getElementById('roomList');
// const refreshRoomListButtonEl = document.getElementById('refreshRoomListButton');
// const lobbyMessageEl = document.getElementById('lobbyMessage'); // 不再在顶层定义

// --- Module State ---
let currentRoomList = [];
let isLoadingRooms = false;

/**
 * HTML特殊字符转义函数
 */
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return String(unsafe)
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "\"")
         .replace(/'/g, "'");
}

/**
 * 在大厅消息区域显示消息
 */
function displayLobbyMessage(message, isError = false, isSuccess = false) {
    const lobbyMessageElement = document.getElementById('lobbyMessage'); // 在函数内部获取
    if (lobbyMessageElement) {
        lobbyMessageElement.textContent = message;
        lobbyMessageElement.className = 'message-area'; // Reset classes
        if (isError) {
            lobbyMessageElement.classList.add('error');
        } else if (isSuccess) {
            lobbyMessageElement.classList.add('success');
        }
    } else {
        // 这个警告现在不应该再出现了，除非HTML中确实没有 id="lobbyMessage"
        console.warn("Lobby: Element with ID 'lobbyMessage' not found in DOM when trying to display message:", message);
    }
}

/**
 * 处理创建房间的逻辑
 */
async function handleCreateRoom() {
    console.log("Lobby: handleCreateRoom called");
    const nameInput = document.getElementById('createRoomNameInput');
    const passwordInput = document.getElementById('createRoomPasswordInput');
    const createButton = document.getElementById('createRoomButton');

    if (!nameInput || !createButton) {
        console.error("Lobby Error: Create room form elements (nameInput or createButton) not found.");
        displayLobbyMessage("创建房间表单组件缺失。", true);
        return;
    }

    const roomName = nameInput.value.trim();
    const password = passwordInput ? passwordInput.value : "";

    if (!roomName) {
        displayLobbyMessage('请输入房间名称。', true);
        return;
    }
    if (roomName.length > 30) {
        displayLobbyMessage('房间名称过长 (最多30字符)。', true);
        return;
    }

    createButton.disabled = true;
    displayLobbyMessage('正在创建房间...', false);

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Lobby Error: apiRequest function is not defined.");
            displayLobbyMessage('客户端内部错误 (API)。', true);
            createButton.disabled = false;
            return;
        }
        const result = await apiRequest('room_create.php', 'POST', { roomName, password: password || null });

        if (result.success && result.roomId) {
            displayLobbyMessage('房间创建成功！正在进入...', false, true);
            if (typeof enterRoom === 'function') {
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
                createButton.disabled = false;
            }
        } else {
            displayLobbyMessage(result.message || '创建房间失败。', true);
            createButton.disabled = false;
        }
    } catch (error) {
        displayLobbyMessage(error.message || '创建房间请求失败。', true);
        createButton.disabled = false;
    }
}

/**
 * 获取并渲染房间列表
 */
async function fetchAndRenderRoomList() {
    console.log("Lobby: fetchAndRenderRoomList called");
    const roomListElement = document.getElementById('roomList'); // 在函数内部获取
    const refreshButton = document.getElementById('refreshRoomListButton'); // 在函数内部获取

    if (isLoadingRooms) {
        console.log("Lobby: Already fetching room list.");
        return;
    }
    isLoadingRooms = true;

    if (roomListElement) roomListElement.innerHTML = '<p>正在刷新房间列表...</p>';
    if (refreshButton) refreshButton.disabled = true;

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Lobby Error: apiRequest function is not defined.");
            displayLobbyMessage('客户端内部错误 (API)。', true);
            if (roomListElement) roomListElement.innerHTML = '<p>无法加载房间列表 (配置错误)。</p>';
            isLoadingRooms = false;
            if (refreshButton) refreshButton.disabled = false;
            return;
        }
        const result = await apiRequest('room_list.php', 'GET');

        if (result.success && Array.isArray(result.rooms)) {
            currentRoomList = result.rooms;
            renderRoomListDOM(currentRoomList);
            // displayLobbyMessage(''); // 清除加载消息，或者在renderRoomListDOM成功后清除
        } else {
            displayLobbyMessage(result.message || '获取房间列表失败。', true);
            if (roomListElement) roomListElement.innerHTML = '<p>无法加载房间列表。</p>';
        }
    } catch (error) {
        displayLobbyMessage(error.message || '获取房间列表请求失败。', true);
        if (roomListElement) roomListElement.innerHTML = '<p>网络错误，无法加载房间列表。</p>';
    } finally {
        isLoadingRooms = false;
        if (refreshButton) refreshButton.disabled = false;
    }
}

/**
 * 根据房间数据渲染DOM列表
 */
function renderRoomListDOM(rooms) {
    const roomListContainer = document.getElementById('roomList'); // 在函数内部获取
    if (!roomListContainer) {
        console.error("Lobby: roomList (DOM element for room list container) not found.");
        return;
    }
    roomListContainer.innerHTML = '';

    if (!rooms || rooms.length === 0) {
        roomListContainer.innerHTML = '<p>当前没有可加入的房间。您可以创建一个新房间！</p>';
        return;
    }

    rooms.forEach(room => {
        const item = document.createElement('div');
        item.classList.add('room-item');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${escapeHtml(room.name)} (${escapeHtml(String(room.current_players))}/${escapeHtml(String(room.max_players))})`;

        const creatorSpan = document.createElement('span');
        creatorSpan.textContent = `创建者: ${escapeHtml(room.creator_username || '未知')}`;

        const passwordSpan = document.createElement('span');
        passwordSpan.textContent = room.has_password ? '🔒 有密码' : '无密码';

        item.appendChild(nameSpan);
        item.appendChild(creatorSpan);
        item.appendChild(passwordSpan);

        const joinButton = document.createElement('button');
        joinButton.textContent = '加入房间';
        if (parseInt(room.current_players, 10) >= parseInt(room.max_players, 10)) {
            joinButton.disabled = true;
            joinButton.title = '房间已满员';
        }

        joinButton.onclick = () => {
            if (typeof handleJoinRoom === 'function') {
                handleJoinRoom(room.id, room.has_password);
            } else {
                console.error('Lobby Error: handleJoinRoom function is not defined.');
                displayLobbyMessage('加入房间功能异常。', true);
            }
        };

        item.appendChild(joinButton);
        roomListContainer.appendChild(item);
    });
    displayLobbyMessage(''); // 渲染成功后清除 "正在加载" 等消息
}

/**
 * 处理加入房间的逻辑
 */
async function handleJoinRoom(roomId, hasPassword) {
    console.log(`Lobby: handleJoinRoom called for roomId: ${roomId}, hasPassword: ${hasPassword}`);
    const roomListElementForButtons = document.getElementById('roomList'); // 获取按钮容器

    let passwordAttempt = "";
    if (hasPassword) {
        const roomForPrompt = currentRoomList.find(r => r.id === roomId);
        const roomNameForPrompt = roomForPrompt ? escapeHtml(roomForPrompt.name) : escapeHtml(roomId);
        const promptMessage = `房间 "${roomNameForPrompt}" 需要密码，请输入:`;
        passwordAttempt = prompt(promptMessage);

        if (passwordAttempt === null) {
            console.log('Lobby: Join room cancelled by user.');
            return;
        }
    }

    displayLobbyMessage(`正在加入房间 ${escapeHtml(roomId)}...`);
    const joinButtons = roomListElementForButtons ? roomListElementForButtons.querySelectorAll('.room-item button') : [];
    joinButtons.forEach(btn => { btn.disabled = true; });

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Lobby Error: apiRequest function is not defined.");
            displayLobbyMessage('客户端内部错误 (API)。', true);
            joinButtons.forEach(btn => { btn.disabled = false; });
            return;
        }
        const result = await apiRequest('room_join.php', 'POST', { roomId, password: passwordAttempt });

        if (result.success && result.roomId) {
            // displayLobbyMessage('成功加入房间！正在进入...', false, true); // 进入房间后，大厅消息会被隐藏
            if (typeof enterRoom === 'function') {
                enterRoom(result.roomId); // 这个函数会切换视图并停止大厅的活动
            } else {
                console.error('Lobby Error: enterRoom function is not defined.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
                if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); // 重新启用按钮
            }
        } else {
            displayLobbyMessage(result.message || '加入房间失败。', true);
            if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); // 刷新列表并重新启用按钮
        }
    } catch (error) {
        displayLobbyMessage(error.message || '加入房间请求失败。', true);
        if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); // 刷新列表并重新启用按钮
    }
}

console.log("lobby.js: FINISHED parsing (theoretically)");
