// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const lobbyVw = document.getElementById('lobby-view');
    const mainInterfaceVw = document.getElementById('main-interface-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements
    const authTitle = document.getElementById('lobby-title'); // Corrected from previous HTML if it was auth-title
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const goToRegisterLink = document.getElementById('go-to-register-link');
    const goToLoginLink = document.getElementById('go-to-login-link');
    const lobbyMessageArea = document.getElementById('lobby-message-area');

    // Main Interface (Game Options) Elements
    const gameOptionsDiv = document.getElementById('game-options'); // This is inside main-interface-view now
    const welcomeMessageElement = document.getElementById('welcome-message');
    const roomTypeButtons = document.querySelectorAll('.room-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mainInterfaceMessageArea = document.getElementById('main-interface-message-area');


    // ... (Room View Elements, Game View Elements - from your previous complete main.js) ...


    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    const USER_STORAGE_KEY = 'thirteenWaterLoggedInUser'; // <<< --- DEFINITION ADDED HERE ---

    let playerFullHandSource = [];
    let aiPlayers = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let currentView = lobbyVw;
    let currentRoomId = null;
    let currentRoomType = null;
    let currentRoomBaseScore = 0;
    let loggedInUser = null;
    let currentUserTotalScore = 0;
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAIAutoplaying = false, aiAutoplayRoundsLeft = 0;
    const AI_AUTOPLAY_DELAY_MS = 1200;


    const safeDisplayMessage = (area, msg, isErr = false) => { /* ... (same as before) ... */ };
    const safeDisplayMenuMessage = (msg,isErr=false)=>safeDisplayMessage(lobbyMessageArea,msg,isErr); // Corrected to lobbyMessageArea
    const safeDisplayMainInterfaceMessage = (msg,isErr=false)=>safeDisplayMessage(mainInterfaceMessageArea,msg,isErr);
    const safeDisplayRoomMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('room-message-area'),msg,isErr);
    const safeDisplayGameMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('message-area'),msg,isErr);
    const safeDisplayScore = (gameScoreText, totalScoreVal) => { /* ... (same as before) ... */};

    function switchView(viewToShow) { /* ... (same as before, ensure it uses lobbyVw, mainInterfaceVw) ... */ }
    function showAuthFormInLobby(formToShow) { /* ... (same as before) ... */ } // Renamed from showAuthForm
    function showGameOptionsUI() { /* ... (same as before, targets elements in mainInterfaceVw) ... */ }


    // --- Authentication Logic ---
    function attemptAutoLogin() {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY); // Now USER_STORAGE_KEY is defined
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData && userData.phone) {
                    loggedInUser = userData.phone;
                    currentUserTotalScore = userData.score || 0;
                    console.log("User auto-logged in from localStorage:", loggedInUser, "Score:", currentUserTotalScore);
                    // UI update after auto-login
                    if(welcomeMessageElement) welcomeMessageElement.textContent = `欢迎回来, ${loggedInUser}!`;
                    safeDisplayScore("已自动登录", currentUserTotalScore);
                    switchView(mainInterfaceVw); // Go to main interface (game options)
                    return true;
                }
            } catch (e) {
                console.error("Error parsing stored user data:", e);
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }
        return false;
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();
            if (!username || !password) { safeDisplayLobbyMessage("手机号和密码不能为空！", true); return; }
            safeDisplayLobbyMessage("正在登录...", false);
            try {
                const response = await fetch(`${API_BASE_URL}login_user.php`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username: username, password: password })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    loggedInUser = data.username;
                    currentUserTotalScore = data.score || 0;
                    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ phone: loggedInUser, score: currentUserTotalScore }));
                    safeDisplayLobbyMessage("登录成功！正在进入主界面...", false);
                    if(welcomeMessageElement) welcomeMessageElement.textContent = `欢迎, ${loggedInUser}!`;
                    safeDisplayScore("", currentUserTotalScore);
                    switchView(mainInterfaceVw);
                } else {
                    safeDisplayLobbyMessage(data.message || "登录失败，请检查凭据。", true);
                }
            } catch (error) { console.error("Login error:", error); safeDisplayLobbyMessage(`登录错误: ${error.message}`, true); }
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const phoneNumber = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value.trim();
            const confirmPassword = registerConfirmPasswordInput.value.trim();
            if (!phoneNumber || !password || !confirmPassword) { safeDisplayLobbyMessage("所有字段不能为空！", true); return; }
            if (password !== confirmPassword) { safeDisplayLobbyMessage("两次密码不匹配！", true); return; }
            if (password.length < 6) { safeDisplayLobbyMessage("密码至少6位！", true); return; }
            // if (!/^\d{7,15}$/.test(phoneNumber)) { safeDisplayLobbyMessage("请输入有效手机号。", true); return; } // Optional stricter validation

            safeDisplayLobbyMessage("注册中...", false);
            try {
                const response = await fetch(`${API_BASE_URL}register_user.php`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ phone: phoneNumber, password: password })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    loggedInUser = phoneNumber; currentUserTotalScore = 0;
                    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ phone: loggedInUser, score: currentUserTotalScore }));
                    safeDisplayLobbyMessage(result.message || "注册成功，已自动登录！正在进入主界面...", false);
                    if(welcomeMessageElement) welcomeMessageElement.textContent = `欢迎, ${loggedInUser}!`;
                    safeDisplayScore("", currentUserTotalScore);
                    switchView(mainInterfaceVw);
                } else {
                    safeDisplayLobbyMessage(result.message || "注册失败。", true);
                }
            } catch (error) { console.error("Registration error:", error); safeDisplayLobbyMessage(`注册错误: ${error.message}`, true); }
        });
    }

    if (goToRegisterLink) goToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(registerForm); });
    if (goToLoginLink) goToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(loginForm); });

    if (logoutBtn) { // This button is in mainInterfaceVw
        logoutBtn.addEventListener('click', () => {
            loggedInUser = null; currentUserTotalScore = 0;
            localStorage.removeItem(USER_STORAGE_KEY);
            safeDisplayLobbyMessage("已退出登录。", false);
            showAuthFormInLobby(loginForm);
            switchView(lobbyVw);
        });
    }

    // --- Room and Game Navigation & Game View Listeners etc. ---
    // --- PASTE THE REST OF YOUR FULL main.js CODE (from the "修复并重新编写所有文件完整代码给我" response) HERE ---
    // This includes:
    // - initializeSortable (full implementation)
    // - updateHandModelFromDOM (full implementation)
    // - displayCurrentArrangementState (full implementation)
    // - checkDaoshuiForUI (full implementation)
    // - checkAllCardsOrganized (full implementation)
    // - resetGameTable (full implementation)
    // - initializeGameUI (full implementation)
    // - resetAppToMainMenu (full implementation - ensure it calls localStorage.removeItem)
    // - Event listeners for: roomTypeButtons, startGameFromRoomBtn, leaveRoomBtn, backToRoomBtn,
    //   dealButton (in-game), aiReferenceButton, aiAutoplayButton (and its helpers),
    //   confirmOrganizationButton, compareButton, callBackendButton.


    // --- Initial Application State Setup ---
    function initializeApp() {
        if (!attemptAutoLogin()) {
            showAuthFormInLobby(loginForm);
            switchView(lobbyVw);
        }
        // initializeSortable should be called once the game view is about to be shown,
        // or if its elements are always in the DOM (even if hidden).
        // For simplicity if gameVw elements are always in DOM (just display:none):
        if (typeof initializeSortable === "function") initializeSortable(); else console.error("initializeSortable not defined");
        console.log("Application fully initialized.");
    }

    initializeApp();
});
