// frontend/js/auth.js

// --- DOM Elements ---
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const registerButton = document.getElementById('registerButton');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const authMessageEl = document.getElementById('authMessage');
const logoutButton = document.getElementById('logoutButton');
const lobbyUsernameEl = document.getElementById('lobbyUsername');


// --- State ---
let currentUser = null; // { userId, username }

// --- API Calls ---
async function apiRequest(endpoint, method = 'POST', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(API_BASE_URL + endpoint, {...options, credentials: 'include'});
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || `HTTP error ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        throw error;
    }
}

async function handleRegister() {
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage('请输入用户名和密码。', true);
        return;
    }

    registerButton.disabled = true;
    try {
        const result = await apiRequest('auth_register.php', 'POST', { username, password });
        displayAuthMessage(result.message, !result.success, result.success);
        if (result.success) {
            regUsernameInput.value = '';
            regPasswordInput.value = '';
        }
    } catch (error) {
        displayAuthMessage(error.message || '注册失败，请检查网络或联系管理员。', true);
    } finally {
        registerButton.disabled = false;
    }
}

async function handleLogin() {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage('请输入用户名和密码。', true);
        return;
    }
    loginButton.disabled = true;
    try {
        const result = await apiRequest('auth_login.php', 'POST', { username, password });
        if (result.success) {
            currentUser = { userId: result.userId, username: result.username };
            if (lobbyUsernameEl) lobbyUsernameEl.textContent = currentUser.username;
            displayAuthMessage('登录成功！', false, true);
            switchToView('lobby'); // <--- 参数是 'lobby' (ui.js 中的键名)
        } else {
            displayAuthMessage(result.message || '登录失败。', true);
        }
    } catch (error) {
        displayAuthMessage(error.message || '登录请求失败，请检查网络。', true);
    } finally {
        loginButton.disabled = false;
    }
}

async function handleLogout() {
    logoutButton.disabled = true;
    try {
        const result = await apiRequest('auth_logout.php', 'POST');
        if (result.success) {
            currentUser = null;
            // displayAuthMessage('已退出登录。'); // 消息现在由 auth-view 自己管理
            switchToView('auth'); // <--- 参数是 'auth' (ui.js 中的键名)
            loginUsernameInput.value = '';
            loginPasswordInput.value = '';
        } else {
            displayAuthMessage(result.message || '退出登录时发生错误。', true);
            switchToView('auth'); // <--- 参数是 'auth'
        }
    } catch (error) {
        displayAuthMessage(error.message || '退出请求失败。', true);
        switchToView('auth'); // <--- 参数是 'auth'
    } finally {
        logoutButton.disabled = false;
    }
}

async function checkAuthStatusOnLoad() {
    try {
        const result = await apiRequest('auth_check.php', 'GET');
        if (result.success && result.data.loggedIn) {
            currentUser = { userId: result.data.userId, username: result.data.username };
            if (lobbyUsernameEl) lobbyUsernameEl.textContent = currentUser.username;
            console.log('User already logged in:', currentUser.username);
            switchToView('lobby'); // <--- 参数是 'lobby' (ui.js 中的键名)
        } else {
            console.log('User not logged in.'); // 这个日志你看到了
            switchToView('auth');  // <--- 修改这里！参数改为 'auth'
        }
    } catch (error) {
        console.error('Failed to check auth status:', error);
        displayAuthMessage('无法连接到服务器检查登录状态。', true);
        switchToView('auth');      // <--- 修改这里！参数改为 'auth'
    }
}


function displayAuthMessage(message, isError = false, isSuccess = false) {
    if (authMessageEl) {
        authMessageEl.textContent = message;
        authMessageEl.className = 'message-area';
        if (isError) authMessageEl.classList.add('error');
        if (isSuccess) authMessageEl.classList.add('success');
    }
}
