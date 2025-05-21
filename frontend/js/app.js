// frontend/js/app.js

let currentAppRoomId = null; // 在 app.js 级别也追踪一下当前房间ID

document.addEventListener('DOMContentLoaded', () => {
    console.log('App DOM Loaded. Initializing...');
    initViews();

    // --- 认证按钮 ---
    const regBtn = document.getElementById('registerButton');
    const loginBtn = document.getElementById('loginButton');
    const logoutBtn = document.getElementById('logoutButton');
    if (regBtn) regBtn.addEventListener('click', handleRegister);
    else console.warn('Register button not found');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    else console.warn('Login button not found');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    else console.warn('Logout button not found');

    // --- 大厅按钮 ---
    const createRoomBtn = document.getElementById('createRoomButton');
    const refreshRoomsBtn = document.getElementById('refreshRoomListButton');
    if (createRoomBtn) createRoomBtn.addEventListener('click', handleCreateRoom); // handleCreateRoom 在 lobby.js
    else console.warn('Create Room button not found');
    if (refreshRoomsBtn) refreshRoomsBtn.addEventListener('click', fetchAndRenderRoomList); // fetchAndRenderRoomList 在 lobby.js
    else console.warn('Refresh Room List button not found');

    // --- 房间按钮 ---
    const playerReadyBtn = document.getElementById('playerReadyButton');
    const leaveRoomBtn = document.getElementById('leaveRoomButton');
    if(playerReadyBtn) playerReadyBtn.addEventListener('click', handlePlayerReady); // handlePlayerReady 在 room.js
    else console.warn('Player Ready button not found');
    if(leaveRoomBtn) leaveRoomBtn.addEventListener('click', handleLeaveRoom); // handleLeaveRoom 在 room.js
    else console.warn('Leave Room button not found');


    checkAuthStatusOnLoad(); // 这会决定初始视图 (auth or lobby)

    console.log('App initialized.');
});

// 公共函数，用于从大厅进入房间
function enterRoom(roomId) {
    if (!roomId) return;
    console.log(`App: Entering room ${roomId}`);
    currentAppRoomId = roomId; // 更新 app 级别的房间ID
    switchToView('room');    // 切换到房间视图
    startRoomPolling(roomId); // room.js 中的函数，开始轮询该房间的状态
}

// 在 auth.js 的 handleLogin 成功后，以及 checkAuthStatusOnLoad 发现已登录时，
// 需要调用 fetchAndRenderRoomList() 来加载大厅的房间列表。
// 可以在 switchToView('lobby') 之后直接调用，或者在 auth.js 中调用。
// 我们在 auth.js 中修改，使其在切换到 lobby 后调用。
// frontend/js/auth.js 修改:
// ...
// if (result.success) {
//     ...
//     switchToView('lobby');
//     if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); // 添加此行
// }
// ...
// 在 checkAuthStatusOnLoad 中类似:
// if (result.success && result.data.loggedIn) {
//     ...
//     switchToView('lobby');
//     if (typeof fetchAndRenderRoomList === 'function') fetchAndRenderRoomList(); // 添加此行
// }
// ...
