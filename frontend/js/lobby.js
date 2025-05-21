// frontend/js/lobby.js
console.log("lobby.js: STARTED parsing"); // 调试信息：文件开始解析

// --- DOM Elements (确保这些ID与HTML中的ID一致) ---
const createRoomNameInputEl = document.getElementById('createRoomNameInput');
const createRoomPasswordInputEl = document.getElementById('createRoomPasswordInput');
const createRoomButtonEl = document.getElementById('createRoomButton');
const roomListEl = document.getElementById('roomList');
const refreshRoomListButtonEl = document.getElementById('refreshRoomListButton');
const lobbyMessageEl = document.getElementById('lobbyMessage');

// --- Module State ---
let currentRoomList = []; // 缓存从服务器获取的房间列表
let isLoadingRooms = false; // 防止重复请求的标志

/**
 * HTML特殊字符转义函数 (确保在使用用户输入或服务器数据到HTML时调用)
 * @param {*} unsafe - 可能包含HTML特殊字符的字符串
 * @returns {string} - 转义后的字符串
 */
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return String(unsafe) // 确保是字符串类型
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "\"") // 正确转义双引号
         .replace(/'/g, "'"); // 转义单引号
}

/**
 * 在大厅消息区域显示消息
 * @param {string} message - 要显示的消息
 * @param {boolean} [isError=false] - 是否为错误消息
 * @param {boolean} [isSuccess=false] - 是否为成功消息
 */
function displayLobbyMessage(message, isError = false, isSuccess = false) {
    if (lobbyMessageEl) {
        lobbyMessageEl.textContent = message;
        lobbyMessageEl.className = 'message-area'; // 重置类
        if (isError) {
            lobbyMessageEl.classList.add('error');
        } else if (isSuccess) {
            lobbyMessageEl.classList.add('success');
        }
    } else {
        console.warn("Lobby: lobbyMessageEl not found for message:", message);
    }
}

/**
 * 处理创建房间的逻辑
 */
async function handleCreateRoom() {
    console.log("Lobby: handleCreateRoom called");
    if (!createRoomNameInputEl || !createRoomButtonEl) {
        console.error("Lobby Error: Create room form elements not found in DOM.");
        displayLobbyMessage("创建房间表单组件缺失。", true);
        return;
    }

    const roomName = createRoomNameInputEl.value.trim();
    const password = createRoomPasswordInputEl ? createRoomPasswordInputEl.value : "";

    if (!roomName) {
        displayLobbyMessage('请输入房间名称。', true);
        return;
    }
    if (roomName.length > 30) {
        displayLobbyMessage('房间名称过长 (最多30字符)。', true);
        return;
    }
    // 可以根据需要添加密码长度等其他验证

    createRoomButtonEl.disabled = true;
    displayLobbyMessage('正在创建房间...', false);

    try {
        if (typeof apiRequest !== 'function') { // apiRequest 来自 auth.js
            console.error("Lobby Error: apiRequest function is not defined. Check auth.js.");
            displayLobbyMessage('客户端内部错误 (API)。', true);
            createRoomButtonEl.disabled = false;
            return;
        }
        const result = await apiRequest('room_create.php', 'POST', { roomName, password: password || null });

        if (result.success && result.roomId) {
            displayLobbyMessage('房间创建成功！正在进入...', false, true);
            if (typeof enterRoom === 'function') { // enterRoom 来自 app.js
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined. Check app.js.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
                createRoomButtonEl.disabled = false;
            }
        } else {
            displayLobbyMessage(result.message || '创建房间失败。', true);
            createRoomButtonEl.disabled = false;
        }
    } catch (error) {
        displayLobbyMessage(error.message || '创建房间请求失败。', true);
        createRoomButtonEl.disabled = false;
    }
}

/**
 * 获取并渲染房间列表
 */
async function fetchAndRenderRoomList() {
    console.log("Lobby: fetchAndRenderRoomList called");
    if (isLoadingRooms) {
        console.log("Lobby: Already fetching room list.");
        return;
    }
    isLoadingRooms = true;

    if (roomListEl) roomListEl.innerHTML = '<p>正在刷新房间列表...</p>';
    if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = true;

    try {
        if (typeof apiRequest !== 'function') { // apiRequest 来自 auth.js
            console.error("Lobby Error: apiRequest function is not defined. Check auth.js.");
            displayLobbyMessage('客户端内部错误 (API)。', true);
            if (roomListEl) roomListEl.innerHTML = '<p>无法加载房间列表 (配置错误)。</p>';
            isLoadingRooms = false;
            if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = false;
            return;
        }
        const result = await apiRequest('room_list.php', 'GET');

        if (result.success && Array.isArray(result.rooms)) {
            currentRoomList = result.rooms;
            renderRoomListDOM(currentRoomList); // 调用独立的渲染函数
            displayLobbyMessage(''); // 清除加载消息
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

/**
 * 根据房间数据渲染DOM列表
 * @param {Array} rooms - 从服务器获取的房间对象数组
 */
function renderRoomListDOM(rooms) {
    if (!roomListEl) {
        console.error("Lobby: roomListEl (DOM element for room list) not found for rendering.");
        return;
    }
    roomListEl.innerHTML = ''; // 清空现有列表

    if (!rooms || rooms.length === 0) {
        roomListEl.innerHTML = '<p>当前没有可加入的房间。您可以创建一个新房间！</p>';
        return;
    }

    rooms.forEach(room => {
        const item = document.createElement('div');
        item.classList.add('room-item');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${escapeHtml(room.name)} (${escapeHtml(String(room.current_players))}/${escapeHtml(String(room.max_players))})`; // 确保数字也转义（虽然通常安全）

        const creatorSpan = document.createElement('span');
        creatorSpan.textContent = `创建者: ${escapeHtml(room.creator_username || '未知')}`;

        const passwordSpan = document.createElement('span');
        passwordSpan.textContent = room.has_password ? '🔒 有密码' : '无密码'; // 更明确的文本

        item.appendChild(nameSpan);
        item.appendChild(creatorSpan);
        item.appendChild(passwordSpan);

        const joinButton = document.createElement('button');
        joinButton.textContent = '加入房间';
        if (parseInt(room.current_players, 10) >= parseInt(room.max_players, 10)) {
            joinButton.disabled = true;
            joinButton.title = '房间已满员';
        }

        // onclick 事件处理器，确保括号和分号正确
        joinButton.onclick = () => { // 开始箭头函数
            if (typeof handleJoinRoom === 'function') {
                handleJoinRoom(room.id, room.has_password); // 调用 handleJoinRoom
            } else {
                console.error('Lobby Error: handleJoinRoom function is not defined. Check lobby.js.');
                displayLobbyMessage('加入房间功能异常。', true);
            }
        }; // 结束箭头函数和赋值语句

        item.appendChild(joinButton);
        roomListEl.appendChild(item);
    });
}

/**
 * 处理加入房间的逻辑
 * @param {string} roomId - 要加入的房间ID
 * @param {boolean} hasPassword - 房间是否有密码
 */
async function handleJoinRoom(roomId, hasPassword) {
    console.log(`Lobby: handleJoinRoom called for roomId: ${roomId}, hasPassword: ${hasPassword}`);
    let passwordAttempt = ""; // 对于无密码房间，传递空字符串

    if (hasPassword) {
        const roomForPrompt = currentRoomList.find(r => r.id === roomId);
        const roomNameForPrompt = roomForPrompt ? escapeHtml(roomForPrompt.name) : escapeHtml(roomId);
        const promptMessage = `房间 "${roomNameForPrompt}" 需要密码，请输入:`;
        passwordAttempt = prompt(promptMessage);

        if (passwordAttempt === null) { // 用户点击了“取消”
            console.log('Lobby: Join room cancelled by user.');
            return; // 不进行任何操作
        }
    }

    displayLobbyMessage(`正在加入房间 ${escapeHtml(roomId)}...`);
    const joinButtons = roomListEl ? roomListEl.querySelectorAll('.room-item button') : [];
    joinButtons.forEach(btn => { btn.disabled = true; }); // 禁用所有加入按钮

    try {
        if (typeof apiRequest !== 'function') { // apiRequest 来自 auth.js
            console.error("Lobby Error: apiRequest function is not defined. Check auth.js.");
            displayLobbyMessage('客户端内部错误 (API)。', true);
            joinButtons.forEach(btn => { btn.disabled = false; }); // 重新启用按钮
            return;
        }
        const result = await apiRequest('room_join.php', 'POST', { roomId, password: passwordAttempt });

        if (result.success && result.roomId) {
            displayLobbyMessage('成功加入房间！正在进入...', false, true);
            if (typeof enterRoom === 'function') { // enterRoom 来自 app.js
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined. Check app.js.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
                // 如果无法进入房间，需要重新启用大厅的按钮
                joinButtons.forEach(btn => { btn.disabled = false; });
                if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = false;
            }
        } else {
            displayLobbyMessage(result.message || '加入房间失败。', true);
            // 加入失败，刷新房间列表以更新状态（可能房间满了或密码错了，按钮会重新计算是否禁用）
            if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); else console.error("Lobby Error: fetchAndRenderRoomList not defined after failed join.");
        }
    } catch (error) {
        displayLobbyMessage(error.message || '加入房间请求失败。', true);
        if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); else console.error("Lobby Error: fetchAndRenderRoomList not defined after join request error.");
    }
    // finally 块不是必须的，因为 fetchAndRenderRoomList 会处理按钮的启用状态
    // 但为了确保，如果仍在 lobby 视图，可以再次调用
    // if (currentViewId === 'lobby' && typeof fetchAndRenderRoomList === 'function') {
    //     fetchAndRenderRoomList();
    // }
}

console.log("lobby.js: FINISHED parsing (theoretically)"); // 调试信息：文件结束解析
