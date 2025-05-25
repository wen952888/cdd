// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const lobbyVw = document.getElementById('lobby-view'); // Changed from mainMenuVw
    const mainInterfaceVw = document.getElementById('main-interface-view'); // New view for game options
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Lobby (Auth) Elements
    const lobbyTitle = document.getElementById('lobby-title'); // Changed from authTitle
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const goToRegisterLink = document.getElementById('go-to-register-link'); // Changed ID
    const goToLoginLink = document.getElementById('go-to-login-link');     // Changed ID
    const lobbyMessageArea = document.getElementById('lobby-message-area'); // Changed ID

    // Main Interface (Game Options) Elements
    const welcomeMessageElement = document.getElementById('welcome-message');
    const roomTypeButtons = document.querySelectorAll('.room-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mainInterfaceMessageArea = document.getElementById('main-interface-message-area');

    // ... (Room View Elements, Game View Elements - same as before) ...
    // ... (API_BASE_URL, State Variables like playerFullHandSource, etc. - same as before) ...
    let currentView = lobbyVw; // Start at lobby view

    // --- Helper Functions ---
    const safeDisplayMessage = (area, msg, isErr=false)=>{/*...*/}; // Keep this generic
    const safeDisplayLobbyMessage = (msg,isErr=false)=>safeDisplayMessage(lobbyMessageArea,msg,isErr);
    const safeDisplayMainInterfaceMessage = (msg,isErr=false)=>safeDisplayMessage(mainInterfaceMessageArea,msg,isErr);
    // ... (safeDisplayRoomMessage, safeDisplayGameMessage, safeDisplayScore - same as before)

    function switchView(viewToShow) {
        console.log("Switching view to:", viewToShow ? viewToShow.id : "null");
        [lobbyVw, mainInterfaceVw, roomVw, gameVw].forEach(v => v && v.classList.remove('active-view')); // Add mainInterfaceVw
        if (viewToShow) {
            viewToShow.classList.add('active-view');
            currentView = viewToShow;
        } else { // Fallback if viewToShow is somehow null
            console.error("switchView: viewToShow is invalid, defaulting to lobby.");
            if(lobbyVw) lobbyVw.classList.add('active-view');
            currentView = lobbyVw;
        }
    }

    function showAuthFormInLobby(formToShow) { // Renamed for clarity
        if(loginForm)loginForm.classList.remove('active-auth-form');
        if(registerForm)registerForm.classList.remove('active-auth-form');
        // No gameOptionsDiv to hide here, it's in a different view now

        if(formToShow)formToShow.classList.add('active-auth-form');
        if(lobbyTitle)lobbyTitle.textContent = formToShow===loginForm?"用户登录":"用户注册"; // Update lobby title
        safeDisplayLobbyMessage('');
    }

    // --- Authentication Logic ---
    function attemptAutoLogin(){
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if(sU){try{const uD=JSON.parse(sU);if(uD?.phone){loggedInUser=uD.phone;currentUserTotalScore=uD.score||0;if(welcomeMessageElement)welcomeMessageElement.textContent=`欢迎回来, ${loggedInUser}!`;safeDisplayScore("",currentUserTotalScore);switchView(mainInterfaceVw);return!0;}}catch(e){localStorage.removeItem(USER_STORAGE_KEY);}}return!1;} // On success, switch to mainInterfaceVw

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            // ... (login fetch logic) ...
            if (response.ok && data.success) {
                loggedInUser = data.username; currentUserTotalScore = data.score || 0;
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ phone: loggedInUser, score: currentUserTotalScore }));
                safeDisplayLobbyMessage("登录成功！正在进入主界面...", false); // Message in lobby
                if(welcomeMessageElement) welcomeMessageElement.textContent = `欢迎, ${loggedInUser}!`;
                safeDisplayScore("", currentUserTotalScore);
                switchView(mainInterfaceVw); // Switch to main interface view
            } else { safeDisplayLobbyMessage(data.message || "登录失败。", true); }
            // ... (catch block) ...
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            // ... (register fetch logic) ...
            if (response.ok && result.success) {
                loggedInUser = phoneNumber; currentUserTotalScore = 0;
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ phone: loggedInUser, score: currentUserTotalScore }));
                safeDisplayLobbyMessage(result.message || "注册成功，已自动登录！正在进入主界面...", false);
                if(welcomeMessageElement) welcomeMessageElement.textContent = `欢迎, ${loggedInUser}!`;
                safeDisplayScore("", currentUserTotalScore);
                switchView(mainInterfaceVw); // Switch to main interface view
            } else { safeDisplayLobbyMessage(result.message || "注册失败。", true); }
            // ... (catch block) ...
        });
    }

    if (goToRegisterLink) goToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(registerForm); });
    if (goToLoginLink) goToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(loginForm); });

    if (logoutBtn) { // This button is now in mainInterfaceVw
        logoutBtn.addEventListener('click', () => {
            loggedInUser = null; currentUserTotalScore = 0;
            localStorage.removeItem(USER_STORAGE_KEY);
            safeDisplayLobbyMessage("已退出登录。", false); // Message in lobby after switching
            showAuthFormInLobby(loginForm); // Show login form in lobby
            switchView(lobbyVw); // Switch back to lobby view
        });
    }

    // --- Room Selection (Now in mainInterfaceVw) ---
    if (roomTypeButtons) roomTypeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // console.log("Room button clicked:", button.textContent);
            if (!loggedInUser) {
                safeDisplayMainInterfaceMessage("发生错误，请重新登录。", true); // Message in main interface
                showAuthFormInLobby(loginForm); // Go back to login
                switchView(lobbyVw);
                return;
            }
            // ... (rest of room button click logic to set currentRoomType, currentRoomId, etc.) ...
            // ... (then switchView(roomVw);) ...
            // ... (auto-click startGameFromRoomBtn if practice/solo) ...
        });
    }); else { console.warn("Room type buttons not found."); }


    // --- Other Event Listeners and Game Functions ---
    // ... (startGameFromRoomBtn, leaveRoomBtn, backToRoomBtn listeners need to switch to/from correct views) ...
    // ... (dealButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton, callBackendButton listeners for gameVw) ...
    // ... (initializeSortable, updateHandModelFromDOM, displayCurrentArrangementState, checkDaoshuiForUI, checkAllCardsOrganized, resetGameTable, initializeGameUI, resetAppToMainMenu) ...
    // ... (AI Autoplay helper functions: showAIRoundSelector, hideAIRoundSelector, startAIAutoplay, aiAutoplayNextRound, simulateDealForAI) ...

    function resetAppToMainMenu(){ /* ... (Ensure this now switches to lobbyVw and calls showAuthFormInLobby) ... */ }


    // --- Initial Application State Setup ---
    function initializeApp() {
        if (!attemptAutoLogin()) { // attemptAutoLogin now switches to mainInterfaceVw on success
            showAuthFormInLobby(loginForm); // Default to login form in lobby
            switchView(lobbyVw);   // Start with the lobby view
        }
        if (typeof initializeSortable === "function") initializeSortable();
        console.log("Application fully initialized.");
    }

    initializeApp();
});

// --- PASTE THE REST OF YOUR FULL main.js CODE HERE ---
// (All the function definitions and event listeners that were previously in main.js,
// ensure they are correctly scoped and interact with the new view structure)
// For example, the initializeGameUI should be called only when transitioning to gameVw.
// The dealButton's event listener and other game-specific button listeners are part of gameVw's context.
