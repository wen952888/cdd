// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const lobbyVw = document.getElementById('lobby-view');
    const mainInterfaceVw = document.getElementById('main-interface-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements & Game Options in Main Menu
    const authTitle = document.getElementById('lobby-title'); // Assuming lobby-title is correct from HTML
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const goToRegisterLink = document.getElementById('go-to-register-link'); // CORRECTED ID
    const goToLoginLink = document.getElementById('go-to-login-link');     // CORRECTED ID
    const menuMessageArea = document.getElementById('lobby-message-area'); // Corrected from menu-message-area if HTML changed
    const gameOptionsDiv = document.getElementById('game-options');
    const welcomeMessageElement = document.getElementById('welcome-message');
    const roomTypeButtons = document.querySelectorAll('.room-btn');
    const logoutBtn = document.getElementById('logout-btn');

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
    const scoreArea = document.getElementById('score-area');
    const aiRoundSelectorDiv = document.getElementById('ai-round-selector');

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    const USER_STORAGE_KEY = 'thirteenWaterLoggedInUser';
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

    const safeDisplayMessage = (area, msg, isErr = false) => { if(area){area.textContent=msg; area.className='message-area'; if(isErr)area.classList.add('error'); else if(msg.toLowerCase().includes("成功")||msg.toLowerCase().includes("完成")||msg.toLowerCase().includes("欢迎")) area.classList.add('info');} else console.warn(`Message area for "${msg}" not found.`);};
    const safeDisplayLobbyMessage = (msg,isErr=false)=>safeDisplayMessage(menuMessageArea,msg,isErr);
    const safeDisplayMainInterfaceMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('main-interface-message-area'),msg,isErr); // Get it fresh
    const safeDisplayRoomMessage = (msg,isErr=false)=>safeDisplayMessage(roomMessageArea,msg,isErr);
    const safeDisplayGameMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('message-area'),msg,isErr);
    const safeDisplayScore = (gameScoreText, totalScoreVal) => { if(scoreArea){let txt=gameScoreText||"";if(typeof totalScoreVal!=='undefined')txt=`总积分: ${totalScoreVal}`+(gameScoreText?` (${gameScoreText})`:"");scoreArea.textContent=txt;}else console.warn("Score area element not found.");};

    function switchView(viewToShow) { [mainMenuVw, mainInterfaceVw, roomVw, gameVw].forEach(v => v && v.classList.remove('active-view')); if(viewToShow){viewToShow.classList.add('active-view'); currentView = viewToShow;} else { console.error("switchView: viewToShow is invalid"); if(lobbyVw) lobbyVw.classList.add('active-view'); currentView = lobbyVw;} }
    function showAuthFormInLobby(formToShow) { if(loginForm)loginForm.classList.remove('active-auth-form'); if(registerForm)registerForm.classList.remove('active-auth-form'); if(gameOptionsDiv)gameOptionsDiv.style.display='none'; if(formToShow)formToShow.classList.add('active-auth-form'); if(authTitle)authTitle.textContent=formToShow===loginForm?"用户登录":"用户注册"; safeDisplayLobbyMessage(''); }
    function showGameOptionsUI() { if(loginForm)loginForm.classList.remove('active-auth-form'); if(registerForm)registerForm.classList.remove('active-auth-form'); if(gameOptionsDiv)gameOptionsDiv.style.display='block'; if(authTitle)authTitle.textContent="游戏大厅"; if(welcomeMessageElement && loggedInUser)welcomeMessageElement.textContent=`欢迎, ${loggedInUser}!`; else if(welcomeMessageElement)welcomeMessageElement.textContent="游戏大厅"; safeDisplayLobbyMessage('');}

    function initializeSortable() { /* ... (Full implementation from previous correct version) ... */ }
    function updateHandModelFromDOM(rowEl, name) { /* ... (Full implementation from previous correct version) ... */ }
    function displayCurrentArrangementState() { /* ... (Full implementation from previous correct version) ... */ }
    function checkDaoshuiForUI(midC) { /* ... (Full implementation from previous correct version) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (Full implementation from previous correct version) ... */ }
    function resetGameTable() { /* ... (Full implementation from previous correct version) ... */ }
    function attemptAutoLogin(){const sU=localStorage.getItem(USER_STORAGE_KEY);if(sU){try{const uD=JSON.parse(sU);if(uD?.phone){loggedInUser=uD.phone;currentUserTotalScore=uD.score||0;if(welcomeMessageElement)welcomeMessageElement.textContent=`欢迎回来, ${loggedInUser}!`;safeDisplayScore("已自动登录",currentUserTotalScore);switchView(mainInterfaceVw);return!0;}}catch(e){console.error("Error parsing stored user:",e);localStorage.removeItem(USER_STORAGE_KEY);}}return!1;}
    function resetAppToMainMenu(){loggedInUser=null;currentRoomId=null;currentUserTotalScore=0;currentRoomType=null;currentRoomBaseScore=0;localStorage.removeItem(USER_STORAGE_KEY);if(document.getElementById('room-id-input'))document.getElementById('room-id-input').value='';if(playerListUl)playerListUl.innerHTML='';safeDisplayScore("",undefined);showAuthFormInLobby(loginForm);switchView(lobbyVw);console.log("App reset to main menu.");}
    function initializeGameUI(){resetGameTable();safeDisplayGameMessage("请点击“发牌”开始或等待游戏开始。",!1);if(dealButton){dealButton.style.display='inline-block';dealButton.disabled=!1;dealButton.textContent="发牌";}if(gameRoomInfoElement)gameRoomInfoElement.textContent=`房间: ${currentRoomId||"N/A"} (${currentRoomType==='practice'?'试玩':currentRoomBaseScore+'分'})`;if(gameUserInfoElement)gameUserInfoElement.textContent=`玩家: ${loggedInUser||"访客"}`;safeDisplayScore("",currentUserTotalScore);}
    function showAIRoundSelector(){/* ... (Full from previous) ... */}; function hideAIRoundSelector(){/* ... (Full from previous) ... */}; function startAIAutoplay(r){/* ... (Full from previous) ... */}; async function aiAutoplayNextRound(){/* ... (Full from previous) ... */}; async function simulateDealForAI(){/* ... (Full from previous) ... */};


    if(loginBtn)loginBtn.addEventListener('click',async()=>{/* ... (Full login logic from previous, including localStorage.setItem) ... */});
    if(registerBtn)registerBtn.addEventListener('click',async()=>{/* ... (Full register logic from previous, including localStorage.setItem) ... */});

    // CORRECTED Event listeners for auth form switching
    if (goToRegisterLink) {
        goToRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(registerForm); });
        // console.log("Listener attached to goToRegisterLink.");
    } else { console.error("Element with ID 'go-to-register-link' NOT FOUND in main.js."); }

    if (goToLoginLink) {
        goToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthFormInLobby(loginForm); });
        // console.log("Listener attached to goToLoginLink.");
    } else { console.error("Element with ID 'go-to-login-link' NOT FOUND in main.js."); }

    if(logoutBtn)logoutBtn.addEventListener('click',resetAppToMainMenu);

    if (roomTypeButtons) roomTypeButtons.forEach((button)=>{button.addEventListener('click',()=>{/* ... (Full room button click logic from previous) ... */});}); else console.warn("Room type buttons not found");
    if(startGameFromRoomBtn)startGameFromRoomBtn.addEventListener('click',()=>{/* ... (Full start game from room logic) ... */});
    if(leaveRoomBtn)leaveRoomBtn.addEventListener('click',()=>{/* ... (Full leave room logic) ... */});
    if(backToRoomBtn)backToRoomBtn.addEventListener('click',()=>{/* ... (Full back to room logic) ... */});
    if(dealButton)dealButton.addEventListener('click',async()=>{/* ... (Full game deal logic) ... */}); else console.error("Deal button missing from DOM!");
    if(aiReferenceButton)aiReferenceButton.addEventListener('click',()=>{/* ... (Full AI Ref logic) ... */});
    if(aiAutoplayButton)aiAutoplayButton.addEventListener('click',()=>{/* ... (Full AI Autoplay toggle logic) ... */});
    if(confirmOrganizationButton)confirmOrganizationButton.addEventListener('click',()=>{/* ... (Full confirm logic) ... */});
    if(compareButton)compareButton.addEventListener('click',async()=>{/* ... (Full compare logic) ... */});
    if(callBackendButton){callBackendButton.addEventListener('click',async()=>{/* ... (Full test backend logic) ... */});} else console.error("callBackendButton NOT found!");

    function initializeApp() {
        if (!attemptAutoLogin()) {
            showAuthFormInLobby(loginForm);
            switchView(lobbyVw);
        }
        if (typeof initializeSortable === "function") initializeSortable();
        else console.error("initializeSortable function is not defined when trying to call it.");
        console.log("Application fully initialized.");
    }
    initializeApp();
});
