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
        // credentials 'include' is important for sending/receiving session cookies
        const response = await fetch(API_BASE_URL + endpoint, {...options, credentials: 'include'});
        const responseData = await response.json();
        if (!response.ok) {
            // 如果响应状态码不是 2xx，也尝试从 responseData 中获取 message
            throw new Error(responseData.message || `HTTP error ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        throw error; // Re-throw to be caught by caller
    }
}

async function handleRegister() {
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage('请输入用户名和密码。', true);
        return;
    }
    // 可以在这里添加更多前端验证

    registerButton.disabled = true;
    try {
        const result = await apiRequest('auth_register.php', 'POST', { username, password });
        displayAuthMessage(result.message, !result.success, result.success);
        if (result.success) {
            regUsernameInput.value = '';
            regPasswordInput.value = '';
            // 可选：注册成功后自动尝试登录或提示用户登录
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
            // 调用 UI 函数切换到大厅视图
            switchToView('lobby-view');
            // TODO: 在下一阶段，这里会加载房间列表
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
        const result = await apiRequest('auth_logout.php', 'POST'); // Logout通常是POST
        if (result.success) {
            currentUser = null;
            displayAuthMessage('已退出登录。'); // 可以在登录视图显示
            // 调用 UI 函数切换到登录视图
            switchToView('auth-view');
            loginUsernameInput.value = ''; // 清空登录表单
            loginPasswordInput.value = '';
        } else {
            // 一般来说logout总会成功清除session，即使后端有小问题
            displayAuthMessage(result.message || '退出登录时发生错误。', true);
             switchToView('auth-view'); // 无论如何都尝试切换
        }
    } catch (error) {
        displayAuthMessage(error.message || '退出请求失败。', true);
        switchToView('auth-view'); // 发生网络错误也尝试切换
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
            switchToView('lobby-view');
            // TODO: 在下一阶段，这里会加载房间列表
        } else {
            console.log('User not logged in.');
            switchToView('auth-view');
        }
    } catch (error) {
        console.error('Failed to check auth status:', error);
        displayAuthMessage('无法连接到服务器检查登录状态。', true);
        switchToView('auth-view'); // 如果检查失败，默认显示登录
    }
}


function displayAuthMessage(message, isError = false, isSuccess = false) {
    if (authMessageEl) {
        authMessageEl.textContent = message;
        authMessageEl.className = 'message-area'; // Reset classes
        if (isError) authMessageEl.classList.add('error');
        if (isSuccess) authMessageEl.classList.add('success');
    }
}

// --- Event Listeners (将在 app.js 中统一管理) ---
// registerButton?.addEventListener('click', handleRegister);
// loginButton?.addEventListener('click', handleLogin);
// logoutButton?.addEventListener('click', handleLogout);
