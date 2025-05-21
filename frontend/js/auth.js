// frontend/js/auth.js

// --- DOM Elements (确保这些ID与HTML一致) ---
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const registerButtonEl = document.getElementById('registerButton'); // 使用 El 后缀避免与函数名混淆
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const loginButtonEl = document.getElementById('loginButton');   // 使用 El 后缀
const authMessageEl = document.getElementById('authMessage');
const logoutButtonEl = document.getElementById('logoutButton');  // 使用 El 后缀
const lobbyUsernameEl = document.getElementById('lobbyUsername');

// --- State ---
let currentUser = null; // { userId, username }

// --- Helper: Display Auth Message (定义在文件顶部，确保后续函数可用) ---
function displayAuthMessage(message, isError = false, isSuccess = false) {
    if (authMessageEl) {
        authMessageEl.textContent = message;
        authMessageEl.className = 'message-area'; // Reset classes
        if (isError) authMessageEl.classList.add('error');
        if (isSuccess) authMessageEl.classList.add('success');
    } else {
        console.warn("Auth: authMessageEl not found in DOM for message:", message);
    }
}

// --- Helper: API Request (定义在文件顶部，确保后续函数可用) ---
async function apiRequest(endpoint, method = 'POST', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);

    // 确保 API_BASE_URL 已定义 (应在 api_config.js 中)
    if (typeof API_BASE_URL === 'undefined') {
        console.error("Auth Error: API_BASE_URL is not defined. Check api_config.js.");
        displayAuthMessage("客户端配置错误 (API URL)。", true); // 显示给用户
        throw new Error("API_BASE_URL is not defined.");
    }

    try {
        const response = await fetch(API_BASE_URL + endpoint, {...options, credentials: 'include'});
        const responseData = await response.json(); // 尝试解析JSON
        if (!response.ok) {
            // 后端应该在错误时也返回JSON message
            throw new Error(responseData.message || `HTTP error ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        // 不要在这里显示UI消息，让调用者决定如何处理错误信息
        throw error;
    }
}

// --- Auth Functions ---
async function handleRegister() {
    // 确保元素存在
    if (!regUsernameInput || !regPasswordInput || !registerButtonEl) {
        console.error("Auth: Register form elements not found.");
        displayAuthMessage("注册表单元素缺失。", true);
        return;
    }
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage('请输入用户名和密码。', true);
        return;
    }
    if (username.length < 3 || password.length < 6) {
        displayAuthMessage('用户名至少3位，密码至少6位。', true);
        return;
    }

    registerButtonEl.disabled = true;
    try {
        const result = await apiRequest('auth_register.php', 'POST', { username, password });
        displayAuthMessage(result.message, !result.success, result.success); // 使用 result.success 判断错误或成功
        if (result.success) {
            regUsernameInput.value = '';
            regPasswordInput.value = '';
        }
    } catch (error) { // apiRequest 抛出的错误
        displayAuthMessage(error.message || '注册请求失败，请检查网络或联系管理员。', true);
    } finally {
        registerButtonEl.disabled = false;
    }
}

async function handleLogin() {
    if (!loginUsernameInput || !loginPasswordInput || !loginButtonEl) {
        console.error("Auth: Login form elements not found.");
        displayAuthMessage("登录表单元素缺失。", true);
        return;
    }
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) {
        displayAuthMessage('请输入用户名和密码。', true);
        return;
    }
    loginButtonEl.disabled = true;
    try {
        const result = await apiRequest('auth_login.php', 'POST', { username, password });
        if (result.success) {
            currentUser = { userId: result.userId, username: result.username };
            if (lobbyUsernameEl) lobbyUsernameEl.textContent = currentUser.username;
            // displayAuthMessage('登录成功！', false, true); // 登录成功消息可以由大厅显示或不显示
            if (typeof switchToView === 'function' && typeof fetchAndRenderRoomList === 'function') {
                switchToView('lobby');
                fetchAndRenderRoomList();
            } else {
                console.error("Auth Error: switchToView or fetchAndRenderRoomList not defined.");
            }
        } else {
            displayAuthMessage(result.message || '登录失败。', true);
        }
    } catch (error) {
        displayAuthMessage(error.message || '登录请求失败，请检查网络。', true);
    } finally {
        loginButtonEl.disabled = false;
    }
}

async function handleLogout() {
    if (!logoutButtonEl) {
        console.warn("Auth: Logout button not found, cannot proceed with logout.");
        return; // 如果按钮不存在，可能用户已在auth视图
    }
    logoutButtonEl.disabled = true;
    try {
        const result = await apiRequest('auth_logout.php', 'POST'); // Logout通常是POST
        // Logout 应该总是成功（从客户端角度看），即使后端session已失效
        currentUser = null;
        if (typeof switchToView === 'function') {
            switchToView('auth');
            // 清理登录表单 (可选)
            if(loginUsernameInput) loginUsernameInput.value = '';
            if(loginPasswordInput) loginPasswordInput.value = '';
        } else {
            console.error("Auth Error: switchToView not defined.");
        }
        // 可以在 authMessageEl 显示 "已退出"
        if (result && result.message) displayAuthMessage(result.message, false, result.success);
        else displayAuthMessage("已退出登录。", false, true);


    } catch (error) { // 网络错误等
        displayAuthMessage(error.message || '退出请求失败。', true);
        currentUser = null; // 即使请求失败，也清理前端状态
        if (typeof switchToView === 'function') switchToView('auth');
    } finally {
        if (logoutButtonEl) logoutButtonEl.disabled = false;
    }
}

async function checkAuthStatusOnLoad() {
    console.log("Auth: Checking auth status on load...");
    try {
        const result = await apiRequest('auth_check.php', 'GET');
        if (result.success && result.data.loggedIn) {
            currentUser = { userId: result.data.userId, username: result.data.username };
            if (lobbyUsernameEl) lobbyUsernameEl.textContent = currentUser.username;
            console.log('Auth: User already logged in:', currentUser.username);
            if (typeof switchToView === 'function' && typeof fetchAndRenderRoomList === 'function') {
                switchToView('lobby');
                fetchAndRenderRoomList();
            } else {
                console.error("Auth Error: switchToView or fetchAndRenderRoomList not defined for checkAuthStatus.");
            }
        } else {
            console.log('Auth: User not logged in.');
            if (typeof switchToView === 'function') {
                switchToView('auth');
            } else {
                console.error("Auth Error: switchToView not defined for checkAuthStatus (not logged in).");
            }
        }
    } catch (error) { // apiRequest 抛出的错误
        console.error('Auth: Failed to check auth status:', error);
        if (typeof switchToView === 'function') {
            switchToView('auth');
            // 延迟显示错误，因为此时 authMessageEl 可能还未因 switchToView 完全可见
            setTimeout(() => displayAuthMessage('无法连接服务器检查登录状态。 ' + error.message, true), 100);
        } else {
            console.error("Auth Error: switchToView not defined for checkAuthStatus (error).");
        }
    }
}
