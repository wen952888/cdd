// frontend/js/app.js

let currentAppRoomId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('App DOM Loaded. Initializing...');
    initViews(); // from ui.js

    // --- 认证按钮 ---
    const regBtn = document.getElementById('registerButton');
    const loginBtn = document.getElementById('loginButton');
    const logoutBtn = document.getElementById('logoutButton'); // ID 确认

    // 确保 auth.js 中的函数已加载并可用
    if (typeof handleRegister === 'function') {
        if (regBtn) regBtn.addEventListener('click', handleRegister);
        else console.warn('App: Register button not found in DOM.');
    } else console.error('App Error: handleRegister function is not defined. Check auth.js loading.');

    if (typeof handleLogin === 'function') {
        if (loginBtn) loginBtn.addEventListener('click', handleLogin);
        else console.warn('App: Login button not found in DOM.');
    } else console.error('App Error: handleLogin function is not defined. Check auth.js loading.');

    if (typeof handleLogout === 'function') { // 确保 handleLogout 已定义
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        else console.warn('App: Logout button not found in DOM.');
    } else console.error('App Error: handleLogout function is not defined. Check auth.js loading.');


    // --- 大厅按钮 ---
    const createRoomBtn = document.getElementById('createRoomButton');
    const refreshRoomsBtn = document.getElementById('refreshRoomListButton');

    if (typeof handleCreateRoom === 'function') { // from lobby.js
        if (createRoomBtn) createRoomBtn.addEventListener('click', handleCreateRoom);
        else console.warn('App: Create Room button not found.');
    } else console.error('App Error: handleCreateRoom function is not defined. Check lobby.js loading.');

    if (typeof fetchAndRenderRoomList === 'function') { // from lobby.js
        if (refreshRoomsBtn) refreshRoomsBtn.addEventListener('click', fetchAndRenderRoomList);
        else console.warn('App: Refresh Room List button not found.');
    } else console.error('App Error: fetchAndRenderRoomList function is not defined. Check lobby.js loading.');


    // --- 房间按钮 ---
    const playerReadyBtn = document.getElementById('playerReadyButton');
    const leaveRoomBtn = document.getElementById('leaveRoomButton');

    if (typeof handlePlayerReady === 'function') { // from room.js
        if(playerReadyBtn) playerReadyBtn.addEventListener('click', handlePlayerReady);
        else console.warn('App: Player Ready button not found.');
    } else console.error('App Error: handlePlayerReady function is not defined. Check room.js loading.');

    if (typeof handleLeaveRoom === 'function') { // from room.js
        if(leaveRoomBtn) leaveRoomBtn.addEventListener('click', handleLeaveRoom);
        else console.warn('App: Leave Room button not found.');
    } else console.error('App Error: handleLeaveRoom function is not defined. Check room.js loading.');


    // 检查用户当前的登录状态 (这将决定初始显示的视图)
    if (typeof checkAuthStatusOnLoad === 'function') { // from auth.js
        checkAuthStatusOnLoad();
    } else {
        console.error('App Error: checkAuthStatusOnLoad function is not defined. Cannot determine initial view.');
        switchToView('auth'); // Fallback to auth view if check function is missing
    }

    console.log('App initialized.');
});

// 公共函数，用于从大厅进入房间
function enterRoom(roomId) {
    if (!roomId) return;
    console.log(`App: Entering room ${roomId}`);
    currentAppRoomId = roomId;
    if (typeof switchToView === 'function' && typeof startRoomPolling === 'function') {
        switchToView('room');    // from ui.js
        startRoomPolling(roomId); // from room.js
    } else {
        console.error('App Error: switchToView or startRoomPolling not defined for enterRoom.');
    }
}
