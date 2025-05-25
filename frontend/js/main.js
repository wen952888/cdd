// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- START: DOM Element Getters (All moved inside DOMContentLoaded) ---
    // Views
    const lobbyVw = document.getElementById('lobby-view');
    const mainInterfaceVw = document.getElementById('main-interface-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements & Game Options in Lobby View
    const authTitle = document.getElementById('lobby-title');
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
    const gameOptionsDiv = document.getElementById('game-options');
    const welcomeMessageElement = document.getElementById('welcome-message');
    const roomTypeButtons = document.querySelectorAll('.room-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const mainInterfaceMessageArea = document.getElementById('main-interface-message-area');

    // Room View Elements
    const roomTitleElement = document.getElementById('room-title');
    const currentRoomIdDisplayElement = document.getElementById('current-room-id-display');
    const roomTypeDisplayElement = document.getElementById('room-type-display');
    const roomBaseScoreDisplayElement = document.getElementById('room-base-score-display');
    const playerListUl = document.getElementById('player-list');
    const startGameFromRoomBtn = document.getElementById('start-game-from-room-btn');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const roomMessageArea = document.getElementById('room-message-area');

    // Game View Elements
    const dealButton = document.getElementById('deal-button');
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiAutoplayButton = document.getElementById('ai-autoplay-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');
    const backToRoomBtn = document.getElementById('back-to-room-btn');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');
    const aiReferenceDisplayElement = document.getElementById('ai-reference-display');
    const aiTopRefElement = document.getElementById('ai-top-ref');
    const aiMiddleRefElement = document.getElementById('ai-middle-ref');
    const aiBottomRefElement = document.getElementById('ai-bottom-ref');
    const gameRoomInfoElement = document.getElementById('game-room-info');
    const gameUserInfoElement = document.getElementById('game-user-info');
    const scoreArea = document.getElementById('score-area'); // Game score area
    const aiRoundSelectorDiv = document.getElementById('ai-round-selector');
    // --- END: DOM Element Getters ---

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    const USER_STORAGE_KEY = 'thirteenWaterLoggedInUser';
    let playerFullHandSource = [];
    let aiPlayers = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let currentView = null; // Will be set in initializeApp
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

    // --- Helper Functions ---
    const safeDisplayMessage = (area, msg, isErr = false) => { if(area){area.textContent=msg; area.className='message-area'; if(isErr)area.classList.add('error'); else if(msg.toLowerCase().includes("成功")||msg.toLowerCase().includes("完成")||msg.toLowerCase().includes("欢迎")) area.classList.add('info');} else console.warn("Message area for \""+msg+"\" not found or area is null:", area);};
    const safeDisplayLobbyMessage = (msg,isErr=false)=>safeDisplayMessage(lobbyMessageArea,msg,isErr);
    const safeDisplayMainInterfaceMessage = (msg,isErr=false)=>safeDisplayMessage(mainInterfaceMessageArea,msg,isErr);
    const safeDisplayRoomMessage = (msg,isErr=false)=>safeDisplayMessage(roomMessageArea,msg,isErr);
    const safeDisplayGameMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('message-area'),msg,isErr); // Game's specific message area
    const safeDisplayScore = (gameScoreText, totalScoreVal) => { if(scoreArea){let txt=gameScoreText||"";if(typeof totalScoreVal!=='undefined')txt=`总积分: ${totalScoreVal}`+(gameScoreText?` (${gameScoreText})`:"");scoreArea.textContent=txt;}else console.warn("Score area element not found.");};

    function switchView(viewToShow) {
        console.log("Attempting to switch view to:", viewToShow ? viewToShow.id : "null");
        // Ensure all view variables are valid DOM elements before trying to access classList
        const views = [lobbyVw, mainInterfaceVw, roomVw, gameVw].filter(Boolean);
        views.forEach(v => v.classList.remove('active-view'));

        if (viewToShow && typeof viewToShow.classList !== 'undefined') {
            viewToShow.classList.add('active-view');
            currentView = viewToShow;
        } else {
            console.error("switchView: viewToShow is invalid or not a DOM element. Defaulting to lobby.", viewToShow);
            if(lobbyVw && typeof lobbyVw.classList !== 'undefined') lobbyVw.classList.add('active-view');
            currentView = lobbyVw; // Fallback to lobbyVw if it exists
        }
    }

    function showAuthFormInLobby(formToShow) { /* ... (Pasted from previous complete version) ... */ }
    function showGameOptionsUI() { /* ... (Pasted from previous complete version) ... */ }
    function initializeSortable() { /* ... (Pasted from previous complete version, includes console.log("SortableJS initialized.")) ... */ }
    function updateHandModelFromDOM(rowEl, name) { /* ... (Pasted from previous complete version) ... */ }
    function displayCurrentArrangementState() { /* ... (Pasted from previous complete version) ... */ }
    function checkDaoshuiForUI(midC) { /* ... (Pasted from previous complete version) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (Pasted from previous complete version) ... */ }
    function resetGameTable() { /* ... (Pasted from previous complete version) ... */ }
    function attemptAutoLogin(){ /* ... (Pasted from previous complete version, ensures switchView(mainInterfaceVw) is called) ... */ }
    function resetAppToMainMenu(){ /* ... (Pasted from previous complete version, ensures switchView(lobbyVw) and showAuthFormInLobby are called) ... */ }
    function initializeGameUI(){ /* ... (Pasted from previous complete version) ... */ }
    function showAIRoundSelector(){ /* ... (Pasted from previous complete version) ... */ }
    function hideAIRoundSelector(){ /* ... (Pasted from previous complete version) ... */ }
    function startAIAutoplay(r){ /* ... (Pasted from previous complete version) ... */ }
    async function aiAutoplayNextRound(){ /* ... (Pasted from previous complete version) ... */ }
    async function simulateDealForAI(){ /* ... (Pasted from previous complete version) ... */ }

    // --- Authentication Event Listeners ---
    if(loginBtn)loginBtn.addEventListener('click',async()=>{/* ... (Pasted from previous complete version) ... */}); else console.error("Login button not found");
    if(registerBtn)registerBtn.addEventListener('click',async()=>{/* ... (Pasted from previous complete version) ... */}); else console.error("Register button not found");
    if (goToRegisterLink) { goToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(registerForm); }); } else { console.error("goToRegisterLink NOT FOUND."); }
    if (goToLoginLink) { goToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(loginForm); }); } else { console.error("goToLoginLink NOT FOUND."); }
    if (logoutBtn) logoutBtn.addEventListener('click', resetAppToMainMenu); else { console.error("Logout button NOT FOUND.");}

    // --- Room Selection & Navigation Event Listeners ---
    if (roomTypeButtons && roomTypeButtons.length > 0) { roomTypeButtons.forEach((button)=>{button.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */});}); } else { console.warn("Room type buttons not found."); }
    if(startGameFromRoomBtn)startGameFromRoomBtn.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */}); else {console.error("Start Game From Room Button not found");}
    if(leaveRoomBtn)leaveRoomBtn.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */}); else {console.error("Leave Room Button not found");}
    if(backToRoomBtn)backToRoomBtn.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */}); else {console.error("Back To Room Button not found");}

    // --- Game View Button Event Listeners ---
    if(dealButton)dealButton.addEventListener('click',async()=>{/* ... (Pasted from previous complete version) ... */}); else console.error("Deal button (in-game) NOT found!");
    if(aiReferenceButton)aiReferenceButton.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */});
    if(aiAutoplayButton)aiAutoplayButton.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */});
    if(confirmOrganizationButton)confirmOrganizationButton.addEventListener('click',()=>{/* ... (Pasted from previous complete version) ... */});
    if(compareButton)compareButton.addEventListener('click',async()=>{/* ... (Pasted from previous complete version) ... */});
    if(callBackendButton){callBackendButton.addEventListener('click',async()=>{/* ... (Pasted from previous complete version) ... */});} else console.error("callBackendButton NOT found!");


    // --- Initial Application State Setup ---
    function initializeApp() {
        // Ensure view elements are valid before trying to switch
        if (!lobbyVw || !mainInterfaceVw || !roomVw || !gameVw) {
            console.error("CRITICAL: One or more main view elements are missing from the DOM. Initialization cannot proceed correctly.");
            if(document.body) document.body.innerHTML = "<p style='color:red; font-size:20px; padding:20px;'>页面初始化错误：关键视图元素丢失。请检查HTML结构和JS中的元素ID。</p>";
            return;
        }

        if (!attemptAutoLogin()) {
            showAuthFormInLobby(loginForm);
            switchView(lobbyVw); // Set initial view
        }
        // else: attemptAutoLogin would have already called switchView(mainInterfaceVw)

        if (typeof initializeSortable === "function") {
             initializeSortable();
        } else {
            console.error("initializeSortable function is not defined at the time of calling initializeApp.");
        }
        console.log("Application fully initialized."); // Your log from line 188
    }

    initializeApp();
});
