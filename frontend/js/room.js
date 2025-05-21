// frontend/js/room.js

// --- DOM Elements ---
const roomNameDisplayEl = document.getElementById('roomNameDisplay');
const roomIdDisplayEl = document.getElementById('roomIdDisplay');
const roomMessageEl = document.getElementById('room-message');
const playerSlotsContainerEl = document.querySelector('.player-slots-container'); // 获取父容器
const playerReadyButtonEl = document.getElementById('playerReadyButton');
const leaveRoomButtonEl = document.getElementById('leaveRoomButton');

// --- State ---
let currentRoomData = null; // 存放从 room_get_state.php 获取的完整房间数据
let roomStatePollInterval = null;
const POLL_INTERVAL_MS = 3000; // 3秒轮询一次

async function loadAndDisplayRoomState(roomId) {
    if (!roomId) {
        console.error('Room: Invalid roomId for loading state.');
        switchToView('lobby'); // roomId 无效，返回大厅
        return;
    }
    console.log(`Room: Loading state for ${roomId}`);
    try {
        const result = await apiRequest(`room_get_state.php?roomId=${roomId}`, 'GET');
        if (result.success) {
            currentRoomData = result; // 保存整个房间数据
            renderRoomAndWaitInterface(currentRoomData);
        } else {
            displayRoomMessage(result.message || `无法获取房间 ${roomId} 的状态。`, true);
            // 如果房间不存在或无权访问，可能需要将用户踢回大厅
            if (result.message === '房间不存在。' || result.message === '您不在此房间中或房间不存在。') {
                stopRoomPolling();
                switchToView('lobby');
                // 可以在 lobby.js 中显示一个更持久的错误消息
                // displayLobbyMessage(`无法进入房间 ${roomId}: ${result.message}`, true);
            }
        }
    } catch (error) {
        displayRoomMessage(error.message || `获取房间状态请求失败 (${roomId})。`, true);
        // 网络错误等，可能也需要踢回大厅或显示重试按钮
    }
}

function renderRoomAndWaitInterface(roomData) {
    if (!roomData || !roomData.roomId) {
        console.error('Room: Cannot render, invalid roomData.');
        return;
    }

    if (roomNameDisplayEl) roomNameDisplayEl.textContent = escapeHtml(roomData.roomName);
    if (roomIdDisplayEl) roomIdDisplayEl.textContent = `ID: ${escapeHtml(roomData.roomId)}`;

    // 清空旧的玩家槽位显示
    if (playerSlotsContainerEl) {
        for (let i = 0; i < MAX_ROOM_PLAYERS; i++) { // 假设 MAX_ROOM_PLAYERS 在某处定义 (例如 api_config.js 或直接用4)
            const slotEl = document.getElementById(`player-slot-${i}`);
            if (slotEl) {
                slotEl.innerHTML = '等待玩家...';
                slotEl.classList.remove('occupied');
                // 清除可能存在的特定玩家数据属性
                slotEl.dataset.userId = '';
            }
        }
    } else {
        console.error("Room: playerSlotsContainerEl not found!");
        return;
    }

    // 填充玩家信息
    if (roomData.players && Array.isArray(roomData.players)) {
        roomData.players.forEach(player => {
            const slotEl = document.getElementById(`player-slot-${player.slot}`);
            if (slotEl) {
                slotEl.classList.add('occupied');
                let playerHtml = `<div class="username">${escapeHtml(player.username)} ${player.userId === currentUser.userId ? '(你)' : ''}</div>`;
                if (roomData.status === 'waiting') {
                    playerHtml += `<div class="status ${player.isReady ? 'ready' : 'not-ready'}">${player.isReady ? '已准备' : '未准备'}</div>`;
                } else if (roomData.status === 'playing') {
                    // 阶段三：显示手牌数量等游戏信息
                    playerHtml += `<div class="status">手牌: ${player.handCount || 0}</div>`;
                }
                slotEl.innerHTML = playerHtml;
                slotEl.dataset.userId = player.userId; // 存储userId方便后续操作
            }
        });
    }

    // 更新准备按钮状态
    if (playerReadyButtonEl) {
        if (roomData.status === 'waiting') {
            playerReadyButtonEl.classList.remove('hidden');
            const myPlayerData = roomData.players.find(p => p.userId === currentUser.userId);
            if (myPlayerData) {
                playerReadyButtonEl.textContent = myPlayerData.isReady ? '取消准备' : '准备';
                playerReadyButtonEl.disabled = false;
            } else {
                 playerReadyButtonEl.textContent = '准备'; // 理论上不应该发生
                 playerReadyButtonEl.disabled = true;
            }
        } else {
            playerReadyButtonEl.classList.add('hidden'); // 游戏开始后隐藏准备按钮
        }
    }

    // TODO: 根据 roomData.status 显示/隐藏游戏板或等待界面元素

    // 清除之前的房间消息
    // displayRoomMessage('');
}


async function handlePlayerReady() {
    if (!currentRoomData || !currentRoomData.roomId || !currentUser) return;
    if (currentRoomData.status !== 'waiting') {
        displayRoomMessage('游戏已开始或结束，无法更改准备状态。', true);
        return;
    }

    const myPlayer = currentRoomData.players.find(p => p.userId === currentUser.userId);
    if (!myPlayer) {
        displayRoomMessage('错误：未在房间中找到您的信息。', true);
        return;
    }

    const newReadyState = !myPlayer.isReady;
    playerReadyButtonEl.disabled = true;

    try {
        // 后端需要一个新的API: room_player_set_ready.php
        const result = await apiRequest('room_player_set_ready.php', 'POST', {
            roomId: currentRoomData.roomId,
            isReady: newReadyState
        });
        if (result.success) {
            // displayRoomMessage(`已${newReadyState ? '准备' : '取消准备'}！`, false, true);
            // 后端成功后，状态会通过下一次轮询更新，或者后端可以立即返回更新后的房间状态
            // 为快速反馈，可以立即请求一次状态
            loadAndDisplayRoomState(currentRoomData.roomId);
        } else {
            displayRoomMessage(result.message || '设置准备状态失败。', true);
        }
    } catch (error) {
        displayRoomMessage(error.message || '设置准备状态请求失败。', true);
    } finally {
        // 按钮的禁用状态会在下一次 loadAndDisplayRoomState 中根据新状态更新
        // playerReadyButtonEl.disabled = false; // 或者在这里立即启用，等待轮询更新文本
    }
}

async function handleLeaveRoom() {
    if (!currentRoomData || !currentRoomData.roomId) {
        switchToView('lobby'); // 如果没有房间信息，直接回大厅
        return;
    }
    stopRoomPolling(); // 离开房间前停止轮询
    leaveRoomButtonEl.disabled = true;

    try {
        // 后端需要一个新的API: room_leave.php
        const result = await apiRequest('room_leave.php', 'POST', { roomId: currentRoomData.roomId });
        if (result.success) {
            // displayLobbyMessage('已成功离开房间。', false, true); // 消息应显示在大厅
        } else {
            // displayLobbyMessage(result.message || '离开房间失败。', true);
        }
    } catch (error) {
        // displayLobbyMessage(error.message || '离开房间请求失败。', true);
    } finally {
        currentRoomData = null; // 清理当前房间数据
        leaveRoomButtonEl.disabled = false;
        switchToView('lobby');
        // 切换到大厅后，lobby.js应该会刷新房间列表
        if (typeof fetchAndRenderRoomList === 'function') { // 确保 lobby.js 的函数可用
            fetchAndRenderRoomList();
        }
    }
}


function startRoomPolling(roomId) {
    stopRoomPolling(); // 先确保之前的停止
    if (!roomId) return;
    console.log(`Room: Starting polling for ${roomId}`);
    // 立即执行一次
    loadAndDisplayRoomState(roomId);
    roomStatePollInterval = setInterval(() => {
        if (currentViewId === 'room' && currentRoomData && currentRoomData.roomId === roomId) { // 只在当前房间视图且roomId匹配时轮询
            loadAndDisplayRoomState(roomId);
        } else {
            console.log('Room: Polling condition not met, stopping or skipping poll.');
            stopRoomPolling(); // 如果条件不满足（例如切换了视图），停止轮询
        }
    }, POLL_INTERVAL_MS);
}

function stopRoomPolling() {
    if (roomStatePollInterval) {
        console.log('Room: Stopping polling.');
        clearInterval(roomStatePollInterval);
        roomStatePollInterval = null;
    }
}

function displayRoomMessage(message, isError = false, isSuccess = false) {
    if (roomMessageEl) {
        roomMessageEl.textContent = message;
        roomMessageEl.className = 'message-area'; // Reset classes
        if (isError) roomMessageEl.classList.add('error');
        if (isSuccess) roomMessageEl.classList.add('success');
    }
}
