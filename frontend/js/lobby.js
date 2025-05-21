// frontend/js/lobby.js

// --- DOM Elements (确保这些ID与HTML一致) ---
const createRoomNameInputEl = document.getElementById('createRoomNameInput');
const createRoomPasswordInputEl = document.getElementById('createRoomPasswordInput');
const createRoomButtonEl = document.getElementById('createRoomButton');
const roomListEl = document.getElementById('roomList');
const refreshRoomListButtonEl = document.getElementById('refreshRoomListButton');
const lobbyMessageEl = document.getElementById('lobbyMessage');

let currentRoomList = []; // 用于存储从服务器获取的房间列表数据
let isLoadingRooms = false; // 防止重复加载

/**
 * 处理创建房间的逻辑
 */
async function handleCreateRoom() {
    // 确保DOM元素存在
    if (!createRoomNameInputEl || !createRoomButtonEl) {
        console.error("Lobby: Create room form elements not found.");
        displayLobbyMessage("创建房间表单元素缺失。", true);
        return;
    }

    const roomName = createRoomNameInputEl.value.trim();
    const password = createRoomPasswordInputEl ? createRoomPasswordInputEl.value : ""; // 如果密码输入框不存在，则为空

    if (!roomName) {
        displayLobbyMessage('请输入房间名称。', true);
        return;
    }
    if (roomName.length > 30) {
        displayLobbyMessage('房间名称过长 (最多30字符)。', true);
        return;
    }
    // 可以添加更多密码验证逻辑，如果需要

    createRoomButtonEl.disabled = true;
    displayLobbyMessage('正在创建房间...', false); // 提供反馈

    try {
        // apiRequest 函数应该在 auth.js 中定义并全局可用
        if (typeof apiRequest !== 'function') {
            console.error("Lobby Error: apiRequest function is not defined. Check auth.js loading.");
            displayLobbyMessage('客户端内部错误 (API 请求)。', true);
            createRoomButtonEl.disabled = false;
            return;
        }

        const result = await apiRequest('room_create.php', 'POST', { roomName, password: password || null });

        if (result.success && result.roomId) {
            displayLobbyMessage('房间创建成功！正在进入...', false, true);
            if (typeof enterRoom === 'function') { // enterRoom 在 app.js 中定义
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined globally.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
                createRoomButtonEl.disabled = false; // 如果无法进入，重新启用按钮
            }
        } else {
            displayLobbyMessage(result.message || '创建房间失败。', true);
            createRoomButtonEl.disabled = false;
        }
    } catch (error) {
        displayLobbyMessage(error.message || '创建房间请求失败。', true);
        createRoomButtonEl.disabled = false;
    }
    // finally 块不是必须的，因为我们在每个分支都处理了按钮状态
}

/**
 * 获取并渲染房间列表
 */
async function fetchAndRenderRoomList() {
    if (isLoadingRooms) {
        console.log("Lobby: Already loading rooms.");
        return;
    }
    isLoadingRooms = true;

    if (roomListEl) roomListEl.innerHTML = '<p>正在刷新房间列表...</p>';
    if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = true;

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Lobby Error: apiRequest function is not defined.");
            displayLobbyMessage('客户端内部错误 (API 请求)。', true);
            if (roomListEl) roomListEl.innerHTML = '<p>无法加载房间列表 (配置错误)。</p>';
            isLoadingRooms = false;
            if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = false;
            return;
        }
        const result = await apiRequest('room_list.php', 'GET');

        if (result.success && Array.isArray(result.rooms)) {
            currentRoomList = result.rooms; // 更新缓存的房间列表
            renderRoomListDOM(currentRoomList);
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

/**
 * 根据房间数据渲染DOM列表
 * @param {Array} rooms - 从服务器获取的房间对象数组
 */
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

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${escapeHtml(room.name)} (${room.current_players}/${room.max_players})`;

        const creatorSpan = document.createElement('span');
        // 确保 room.creator_username 存在
        creatorSpan.textContent = `创建者: ${escapeHtml(room.creator_username || '未知')}`;

        const passwordSpan = document.createElement('span');
        passwordSpan.textContent = room.has_password ? '🔒' : '无密码'; // 后端返回的是 has_password

        item.appendChild(nameSpan);
        item.appendChild(creatorSpan);
        item.appendChild(passwordSpan);

        const joinButton = document.createElement('button');
        joinButton.textContent = '加入';
        // 确保 current_players 和 max_players 是数字类型进行比较
        if (parseInt(room.current_players, 10) >= parseInt(room.max_players, 10)) {
            joinButton.disabled = true;
            joinButton.title = '房间已满';
        }

        // onclick 事件处理器
        joinButton.onclick = () => { // 这是一个箭头函数
            if (typeof handleJoinRoom === 'function') {
                handleJoinRoom(room.id, room.has_password); // 调用 handleJoinRoom
            } else {
                console.error('Lobby Error: handleJoinRoom function is not defined.');
                displayLobbyMessage('加入房间功能异常。', true);
            }
        }; // 确保这里正确闭合

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
    let passwordAttempt = ""; // 初始化为空字符串，以便无密码房间也能通过
    if (hasPassword) {
        const roomForPrompt = currentRoomList.find(r => r.id === roomId);
        const roomNameForPrompt = roomForPrompt ? escapeHtml(roomForPrompt.name) : roomId;
        const promptMessage = `房间 "${roomNameForPrompt}" 需要密码，请输入:`;
        passwordAttempt = prompt(promptMessage);

        if (passwordAttempt === null) { // 用户点击了“取消”
            console.log('Lobby: Join room cancelled by user.');
            return;
        }
    }

    displayLobbyMessage(`正在加入房间 ${escapeHtml(roomId)}...`);
    // 禁用所有加入按钮或显示全局加载状态，防止重复点击
    const joinButtons = roomListEl ? roomListEl.querySelectorAll('.room-item button') : [];
    joinButtons.forEach(btn => btn.disabled = true);

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Lobby Error: apiRequest function is not defined.");
            displayLobbyMessage('客户端内部错误 (API 请求)。', true);
            joinButtons.forEach(btn => btn.disabled = false); // 重新启用按钮
            return;
        }
        const result = await apiRequest('room_join.php', 'POST', { roomId, password: passwordAttempt });

        if (result.success && result.roomId) {
            displayLobbyMessage('成功加入房间！正在进入...', false, true);
            if (typeof enterRoom === 'function') { // enterRoom 在 app.js 定义
                enterRoom(result.roomId);
            } else {
                console.error('Lobby Error: enterRoom function is not defined globally.');
                displayLobbyMessage('进入房间失败 (内部错误)。', true);
                // 如果无法进入房间，需要重新启用大厅的按钮
                joinButtons.forEach(btn => btn.disabled = false);
                if (refreshRoomListButtonEl) refreshRoomListButtonEl.disabled = false; // 也启用刷新按钮
            }
        } else {
            displayLobbyMessage(result.message || '加入房间失败。', true);
            // 加入失败，重新获取房间列表以更新状态（可能房间满了或密码错了）
            fetchAndRenderRoomList(); // 这会重新启用按钮
        }
    } catch (error) {
        displayLobbyMessage(error.message || '加入房间请求失败。', true);
        fetchAndRenderRoomList(); // 出错也刷新列表并启用按钮
    }
    // finally 块不再需要显式启用按钮，因为 fetchAndRenderRoomList 会处理
}

/**
 * 在大厅消息区域显示消息
 * @param {string} message - 要显示的消息
 * @param {boolean} isError - 是否为错误消息
 * @param {boolean} isSuccess - 是否为成功消息
 */
function displayLobbyMessage(message, isError = false, isSuccess = false) {
    if (lobbyMessageEl) {
        lobbyMessageEl.textContent = message;
        lobbyMessageEl.className = 'message-area'; // Reset classes
        if (isError) lobbyMessageEl.classList.add('error');
        if (isSuccess) lobbyMessageEl.classList.add('success');
    } else {
        console.warn("Lobby: lobbyMessageEl not found for message:", message);
    }
}

/**
 * HTML特殊字符转义
 * @param {*} unsafe - 可能包含HTML特殊字符的字符串
 * @returns {string} - 转义后的字符串
 */
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
