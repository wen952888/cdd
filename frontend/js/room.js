// frontend/js/room.js
console.log("room.js: STARTED parsing");

// --- DOM Elements (在函数内部获取，或确保在DOMContentLoaded后才初始化) ---
// const roomNameDisplayEl = document.getElementById('roomNameDisplay');
// const roomIdDisplayEl = document.getElementById('roomIdDisplay');
// const roomMessageEl = document.getElementById('room-message');
// const playerSlotsContainerEl = document.querySelector('.player-slots-container');
// const playerReadyButtonEl = document.getElementById('playerReadyButton');
// const leaveRoomButtonEl = document.getElementById('leaveRoomButton');

// --- Module State ---
let currentRoomData = null; // 存放从 room_get_state.php 获取的完整房间数据
let roomStatePollInterval = null;
const ROOM_POLL_INTERVAL_MS = 3000; // 轮询间隔统一用大写常量

/**
 * HTML特殊字符转义函数 (可以考虑放到一个公共utils.js文件中)
 */
function escapeHtmlRoom(unsafe) { // 加后缀避免与lobby.js中的同名函数潜在冲突 (如果它们作用域不同则没问题)
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
 * 在房间消息区域显示消息
 */
function displayRoomMessage(message, isError = false, isSuccess = false) {
    const roomMessageElement = document.getElementById('room-message');
    if (roomMessageElement) {
        roomMessageElement.textContent = message;
        roomMessageElement.className = 'message-area'; // Reset classes
        if (isError) {
            roomMessageElement.classList.add('error');
        } else if (isSuccess) {
            roomMessageElement.classList.add('success');
        }
    } else {
        console.warn("Room: Element with ID 'room-message' not found for message:", message);
    }
}

/**
 * 加载并显示指定房间的状态
 * @param {string} roomId - 要加载的房间ID
 */
async function loadAndDisplayRoomState(roomId) {
    if (!roomId) {
        console.error('Room: Invalid roomId for loading state. Cannot proceed.');
        stopRoomPolling(); // 停止无效的轮询
        if (typeof switchToView === 'function') switchToView('lobby'); // roomId 无效，返回大厅
        return;
    }
    // console.log(`Room: Loading state for ${roomId}`); // 轮询时此日志过于频繁

    try {
        if (typeof apiRequest !== 'function') { // apiRequest 来自 auth.js
            console.error("Room Error: apiRequest function is not defined. Check auth.js.");
            displayRoomMessage('客户端内部错误 (API)。', true);
            stopRoomPolling();
            return;
        }
        const result = await apiRequest(`room_get_state.php?roomId=${roomId}`, 'GET');

        if (result.success && result.roomId === roomId) { // 校验返回的roomId是否匹配
            currentRoomData = result; // 保存整个房间数据
            renderRoomAndWaitInterface(currentRoomData);
        } else {
            // 如果获取失败，但不是因为房间不存在或无权限，则显示错误但不一定踢出
            displayRoomMessage(result.message || `无法获取房间 ${escapeHtmlRoom(roomId)} 的状态。`, true);
            if (result.message === '房间不存在。' || (result.statusCode === 403 || result.statusCode === 404)) {
                console.warn(`Room: Room ${roomId} not found or access denied. Stopping poll and returning to lobby.`);
                stopRoomPolling();
                if (typeof switchToView === 'function') switchToView('lobby');
                if (typeof displayLobbyMessage === 'function') { // 调用 lobby.js 的消息函数
                    displayLobbyMessage(`无法进入房间 ${escapeHtmlRoom(roomId)}: ${result.message || '房间已失效'}`, true);
                }
            }
        }
    } catch (error) {
        console.error(`Room: Request to get room state for ${roomId} failed:`, error);
        displayRoomMessage(error.message || `获取房间状态请求失败 (${escapeHtmlRoom(roomId)})。`, true);
        // 严重的网络错误等，也可能需要停止轮询
        // stopRoomPolling();
        // switchToView('lobby');
    }
}

/**
 * 根据房间数据渲染房间等待/游戏界面
 * @param {object} roomData - 从服务器获取的完整房间状态
 */
function renderRoomAndWaitInterface(roomData) {
    if (!roomData || !roomData.roomId) {
        console.error('Room: Cannot render, invalid roomData provided.');
        return;
    }

    const roomNameDispEl = document.getElementById('roomNameDisplay');
    const roomIdDispEl = document.getElementById('roomIdDisplay');
    const slotsContainer = document.querySelector('.player-slots-container');
    const readyButton = document.getElementById('playerReadyButton');
    // const gameBoardEl = document.getElementById('game-board'); // 阶段三使用

    if (roomNameDispEl) roomNameDispEl.textContent = escapeHtmlRoom(roomData.roomName);
    if (roomIdDispEl) roomIdDispEl.textContent = `ID: ${escapeHtmlRoom(roomData.roomId)}`;

    // 清空旧的玩家槽位显示并根据 roomData.maxPlayers 创建槽位
    if (slotsContainer) {
        slotsContainer.innerHTML = ''; // 清空
        const maxPlayers = roomData.maxPlayers || 4; // 从房间数据获取，默认为4
        for (let i = 0; i < maxPlayers; i++) {
            const slotEl = document.createElement('div');
            slotEl.classList.add('player-slot');
            slotEl.id = `player-slot-${i}`;
            slotEl.innerHTML = '等待玩家...'; // 默认文本
            slotsContainer.appendChild(slotEl);
        }
    } else {
        console.error("Room Error: playerSlotsContainerEl not found!");
        return;
    }

    // 填充玩家信息
    if (roomData.players && Array.isArray(roomData.players)) {
        roomData.players.forEach(player => {
            const slotEl = document.getElementById(`player-slot-${player.slot}`);
            if (slotEl) {
                slotEl.classList.add('occupied');
                let playerHtml = `<div class="username">${escapeHtmlRoom(player.username)} ${player.userId === currentUser.userId ? '(你)' : ''}</div>`; // currentUser 来自 auth.js
                if (roomData.status === 'waiting') {
                    playerHtml += `<div class="status ${player.isReady ? 'ready' : 'not-ready'}">${player.isReady ? '已准备' : '未准备'}</div>`;
                } else if (roomData.status === 'playing') {
                    playerHtml += `<div class="status">手牌: ${escapeHtmlRoom(String(player.handCount || 0))}</div>`; // 确保 handCount 是数字并转义
                } else if (roomData.status === 'finished') {
                     playerHtml += `<div class="status">游戏结束</div>`;
                }
                slotEl.innerHTML = playerHtml;
                slotEl.dataset.userId = player.userId;
            } else {
                console.warn(`Room: Slot element for slot ${player.slot} not found.`);
            }
        });
    }

    // 更新准备按钮状态
    if (readyButton) {
        if (roomData.status === 'waiting' && currentUser) { // 确保 currentUser 已定义
            readyButton.classList.remove('hidden');
            const myPlayerData = roomData.players.find(p => p.userId === currentUser.userId);
            if (myPlayerData) {
                readyButton.textContent = myPlayerData.isReady ? '取消准备' : '准备';
                readyButton.disabled = false;
            } else {
                // 如果玩家不在列表中（例如刚加入，状态还没刷新过来），暂时禁用
                readyButton.textContent = '准备';
                readyButton.disabled = true;
                console.warn("Room: Current user not found in room players list for ready button state.");
            }
        } else {
            readyButton.classList.add('hidden'); // 游戏开始或结束后隐藏准备按钮
        }
    }

    // 根据 roomData.status 显示/隐藏游戏板或等待界面元素 (阶段三)
    // if (gameBoardEl) {
    //     if (roomData.status === 'playing') {
    //         gameBoardEl.classList.remove('hidden');
    //         // TODO: 渲染游戏板内容
    //     } else {
    //         gameBoardEl.classList.add('hidden');
    //     }
    // }

    // 清除之前的房间消息，除非有新的重要消息
    // displayRoomMessage(''); // 避免频繁清除可能由其他操作设置的消息
}


/**
 * 处理玩家点击准备/取消准备按钮
 */
async function handlePlayerReady() {
    console.log("Room: handlePlayerReady called");
    const readyButton = document.getElementById('playerReadyButton');

    if (!currentRoomData || !currentRoomData.roomId || !currentUser) {
        displayRoomMessage("无法更改准备状态：房间或用户信息丢失。", true);
        if (readyButton) readyButton.disabled = true;
        return;
    }
    if (currentRoomData.status !== 'waiting') {
        displayRoomMessage('游戏已开始或结束，无法更改准备状态。', true);
        if (readyButton) readyButton.classList.add('hidden'); // 非等待状态隐藏按钮
        return;
    }

    const myPlayer = currentRoomData.players.find(p => p.userId === currentUser.userId);
    if (!myPlayer) {
        displayRoomMessage('错误：未在房间中找到您的信息。请尝试刷新。', true);
        if (readyButton) readyButton.disabled = true;
        return;
    }

    const newReadyState = !myPlayer.isReady;
    if (readyButton) readyButton.disabled = true; // 禁用按钮，防止重复点击
    displayRoomMessage(`正在${newReadyState ? '设置准备' : '取消准备'}...`);

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Room Error: apiRequest function is not defined.");
            displayRoomMessage('客户端内部错误 (API)。', true);
            if (readyButton) readyButton.disabled = false; // 出错时恢复按钮
            return;
        }
        const result = await apiRequest('room_player_set_ready.php', 'POST', {
            roomId: currentRoomData.roomId,
            isReady: newReadyState
        });

        if (result.success) {
            displayRoomMessage(result.message || `已${newReadyState ? '准备' : '取消准备'}！`, false, result.success);
            // 状态会通过下一次轮询更新，或者可以立即请求一次
            // 为快速反馈，可以立即请求一次状态，但要注意避免与轮询冲突
            // loadAndDisplayRoomState(currentRoomData.roomId); // 立即刷新
            // 如果后端返回了更新后的房间状态，可以直接使用 result.roomState (如果API设计如此)
        } else {
            displayRoomMessage(result.message || '设置准备状态失败。', true);
        }
    } catch (error) {
        displayRoomMessage(error.message || '设置准备状态请求失败。', true);
    } finally {
        // 按钮的禁用状态会在下一次 loadAndDisplayRoomState (通过轮询) 中根据新状态更新
        // 或者在这里根据操作结果决定是否立即启用，但通常等待轮询更稳妥
        // if (readyButton) readyButton.disabled = false; // 如果不依赖轮询快速反馈，可以在这里启用
    }
}

/**
 * 处理玩家点击离开房间按钮
 */
async function handleLeaveRoom() {
    console.log("Room: handleLeaveRoom called");
    const leaveBtn = document.getElementById('leaveRoomButton');

    if (!currentRoomData || !currentRoomData.roomId) {
        console.warn("Room: No current room data to leave from. Switching to lobby.");
        if (typeof switchToView === 'function') switchToView('lobby');
        return;
    }
    stopRoomPolling(); // 离开房间前停止轮询
    if (leaveBtn) leaveBtn.disabled = true;
    displayRoomMessage('正在离开房间...');

    try {
        if (typeof apiRequest !== 'function') {
            console.error("Room Error: apiRequest function is not defined.");
            displayRoomMessage('客户端内部错误 (API)。', true);
            if (leaveBtn) leaveBtn.disabled = false;
            return;
        }
        const result = await apiRequest('room_leave.php', 'POST', { roomId: currentRoomData.roomId });
        // 离开房间操作通常总是让前端认为成功，以便切换视图
        if (typeof displayLobbyMessage === 'function') {
            displayLobbyMessage(result.message || '已离开房间。', false, result.success);
        }
    } catch (error) {
        console.error("Room: Leave room request failed:", error);
        if (typeof displayLobbyMessage === 'function') {
            displayLobbyMessage(error.message || '离开房间请求失败。', true);
        }
    } finally {
        currentRoomData = null; // 清理当前房间数据
        if (leaveBtn) leaveBtn.disabled = false; // 理论上已切换视图，此按钮不可见
        if (typeof switchToView === 'function') switchToView('lobby');
        if (typeof fetchAndRenderRoomList === 'function') { // 确保 lobby.js 的函数可用
            fetchAndRenderRoomList(); // 返回大厅后刷新房间列表
        }
    }
}

/**
 * 开始对当前房间状态进行轮询
 * @param {string} roomId - 要轮询的房间ID
 */
function startRoomPolling(roomId) {
    stopRoomPolling(); // 先确保之前的轮询已停止
    if (!roomId) {
        console.error("Room: Cannot start polling without a roomId.");
        return;
    }
    currentRoomData = { roomId: roomId }; // 初始设置一个带roomId的currentRoomData，避免第一次轮询条件不满足
    console.log(`Room: Starting polling for ${roomId} every ${ROOM_POLL_INTERVAL_MS}ms`);

    loadAndDisplayRoomState(roomId); // 立即执行一次获取初始状态

    roomStatePollInterval = setInterval(() => {
        // 确保仍在房间视图，并且是同一个房间ID，并且用户已登录
        if (currentViewId === 'room' && currentRoomData && currentRoomData.roomId === roomId && currentUser) {
            loadAndDisplayRoomState(roomId);
        } else {
            console.log('Room: Polling condition no longer met, stopping poll. View:', currentViewId, 'Room:', currentRoomData?.roomId, 'Target:', roomId);
            stopRoomPolling();
        }
    }, ROOM_POLL_INTERVAL_MS);
}

/**
 * 停止房间状态轮询
 */
function stopRoomPolling() {
    if (roomStatePollInterval) {
        console.log('Room: Stopping polling.');
        clearInterval(roomStatePollInterval);
        roomStatePollInterval = null;
    }
}

console.log("room.js: FINISHED parsing (theoretically)");
