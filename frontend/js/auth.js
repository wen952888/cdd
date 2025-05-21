// frontend/js/auth.js
// ... (大部分代码不变) ...

async function handleLogin() {
    // ... (之前的逻辑) ...
    try {
        const result = await apiRequest('auth_login.php', 'POST', { username, password });
        if (result.success) {
            currentUser = { userId: result.userId, username: result.username };
            if (lobbyUsernameEl) lobbyUsernameEl.textContent = currentUser.username;
            // displayAuthMessage('登录成功！', false, true); // 消息可以由 lobbyMessageEl 显示
            switchToView('lobby');
            if (typeof fetchAndRenderRoomList === 'function') { // 确保 lobby.js 已加载
                fetchAndRenderRoomList();
            }
        } else {
            displayAuthMessage(result.message || '登录失败。', true);
        }
    } catch (error) {
        displayAuthMessage(error.message || '登录请求失败，请检查网络。', true);
    } finally {
        loginButton.disabled = false;
    }
}

async function checkAuthStatusOnLoad() {
    try {
        const result = await apiRequest('auth_check.php', 'GET');
        if (result.success && result.data.loggedIn) {
            currentUser = { userId: result.data.userId, username: result.data.username };
            if (lobbyUsernameEl) lobbyUsernameEl.textContent = currentUser.username;
            console.log('User already logged in:', currentUser.username);
            switchToView('lobby');
            if (typeof fetchAndRenderRoomList === 'function') { // 确保 lobby.js 已加载
                fetchAndRenderRoomList();
            }
        } else {
            console.log('User not logged in.');
            switchToView('auth');
        }
    } catch (error) {
        console.error('Failed to check auth status:', error);
        // displayAuthMessage('无法连接到服务器检查登录状态。', true); // 这个消息区可能在auth-view，切换后才显示
        switchToView('auth');
        // 可以在 auth-view 加载后显示这个错误
        setTimeout(() => displayAuthMessage('无法连接到服务器检查登录状态。', true), 100);
    }
}

// ... (其余代码不变) ...
