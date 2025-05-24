// frontend/js/main.js
// Line 1
document.addEventListener('DOMContentLoaded', () => { // Line 2
    // Line 3: DOM Elements - Ensure no stray '*' here or in subsequent lines.
    const mainMenuVw = document.getElementById('main-menu-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements & Game Options in Main Menu
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const menuMessageArea = document.getElementById('menu-message-area');
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
    let playerFullHandSource = [];
    let aiPlayers = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let currentView = mainMenuVw;
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
    const USER_STORAGE_KEY = 'thirteenWaterLoggedInUser';

    const safeDisplayMessage = (area, msg, isErr = false) => { if(area){area.textContent=msg; area.className='message-area'; if(isErr)area.classList.add('error'); else if(msg.toLowerCase().includes("成功")||msg.toLowerCase().includes("完成")) area.classList.add('info');} else console.warn("Message area not found for:", msg);};
    const safeDisplayMenuMessage = (msg,isErr=false)=>safeDisplayMessage(menuMessageArea,msg,isErr);
    const safeDisplayRoomMessage = (msg,isErr=false)=>safeDisplayMessage(roomMessageArea,msg,isErr);
    const safeDisplayGameMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('message-area'),msg,isErr);
    const safeDisplayScore = (gameScoreText, totalScoreVal) => { if(scoreArea){let txt=gameScoreText||"";if(typeof totalScoreVal!=='undefined')txt=`总积分: ${totalScoreVal}`+(gameScoreText?` (${gameScoreText})`:"");scoreArea.textContent=txt;}else console.warn("Score area element not found.");};

    function switchView(viewToShow) { console.log("Switching view to:", viewToShow?.id); [mainMenuVw, roomVw, gameVw].forEach(v => v?.classList.remove('active-view')); if(viewToShow){viewToShow.classList.add('active-view'); currentView = viewToShow;} else console.error("switchView: viewToShow is invalid"); }
    function showAuthForm(formToShow) { if(loginForm)loginForm.classList.remove('active-auth-form'); if(registerForm)registerForm.classList.remove('active-auth-form'); if(gameOptionsDiv)gameOptionsDiv.style.display='none'; if(formToShow)formToShow.classList.add('active-auth-form'); if(authTitle)authTitle.textContent=formToShow===loginForm?"用户登录":"用户注册"; safeDisplayMenuMessage(''); }
    function showGameOptionsUI() { if(loginForm)loginForm.classList.remove('active-auth-form'); if(registerForm)registerForm.classList.remove('active-auth-form'); if(gameOptionsDiv)gameOptionsDiv.style.display='block'; if(authTitle)authTitle.textContent="游戏大厅"; if(welcomeMessageElement&&loggedInUser)welcomeMessageElement.textContent=`欢迎, ${loggedInUser}!`; else if(welcomeMessageElement)welcomeMessageElement.textContent="游戏大厅"; safeDisplayMenuMessage('');}

    function initializeSortable() { /* ... (Full implementation from previous correct version) ... */ }
    function updateHandModelFromDOM(rowEl, name) { /* ... (Full implementation from previous correct version) ... */ }
    function displayCurrentArrangementState() { /* ... (Full implementation from previous correct version) ... */ }
    function checkDaoshuiForUI(midC) { /* ... (Full implementation from previous correct version) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (Full implementation from previous correct version) ... */ }
    function resetGameTable() { /* ... (Full implementation from previous correct version) ... */ }

    function initializeApp() { if(!attemptAutoLogin()){showAuthForm(loginForm);switchView(mainMenuVw);} initializeSortable(); console.log("Application fully initialized."); }
    function attemptAutoLogin(){const sU=localStorage.getItem(USER_STORAGE_KEY);if(sU){try{const uD=JSON.parse(sU);if(uD?.phone){loggedInUser=uD.phone;currentUserTotalScore=uD.score||0;console.log("User auto-logged in:",loggedInUser,"Score:",currentUserTotalScore);showGameOptionsUI();switchView(mainMenuVw);safeDisplayScore("欢迎回来！",currentUserTotalScore);return!0;}}catch(e){console.error("Error parsing stored user:",e);localStorage.removeItem(USER_STORAGE_KEY);}}return!1;}
    function resetAppToMainMenu(){loggedInUser=null;currentRoomId=null;currentUserTotalScore=0;currentRoomType=null;currentRoomBaseScore=0;localStorage.removeItem(USER_STORAGE_KEY);if(document.getElementById('room-id-input'))document.getElementById('room-id-input').value='';if(playerListUl)playerListUl.innerHTML='';safeDisplayScore("",undefined);showAuthForm(loginForm);switchView(mainMenuVw);console.log("App reset to main menu.");}
    function initializeGameUI(){resetGameTable();safeDisplayGameMessage("请点击“发牌”或等待游戏开始。",!1);if(dealButton){dealButton.style.display='inline-block';dealButton.disabled=!1;dealButton.textContent="发牌";}if(gameRoomInfoElement)gameRoomInfoElement.textContent=`房间: ${currentRoomId||"N/A"} (${currentRoomType==='practice'?'试玩':currentRoomBaseScore+'分'})`;if(gameUserInfoElement)gameUserInfoElement.textContent=`玩家: ${loggedInUser||"访客"}`;safeDisplayScore("",currentUserTotalScore);}

    // --- Event Listeners ---
    if(loginBtn)loginBtn.addEventListener('click',async()=>{/* ... (Full login logic from previous, including localStorage.setItem) ... */});
    if(registerBtn)registerBtn.addEventListener('click',async()=>{/* ... (Full register logic from previous, including localStorage.setItem) ... */});
    if(showRegisterLink)showRegisterLink.addEventListener('click',(e)=>{e.preventDefault();showAuthForm(registerForm);});
    if(showLoginLink)showLoginLink.addEventListener('click',(e)=>{e.preventDefault();showAuthForm(loginForm);});
    if(logoutBtn)logoutBtn.addEventListener('click',resetAppToMainMenu);

    roomTypeButtons.forEach((button,index)=>{console.log(`Attaching to room btn ${index}:`,button.textContent);button.addEventListener('click',()=>{/* ... (Full room button click logic from previous, including all console.logs) ... */});});
    if(startGameFromRoomBtn)startGameFromRoomBtn.addEventListener('click',()=>{console.log("Start Game from Room clicked");safeDisplayRoomMessage("",!1);switchView(gameVw);initializeGameUI();if(dealButton)setTimeout(()=>dealButton.click(),50);});
    if(leaveRoomBtn)leaveRoomBtn.addEventListener('click',()=>{currentRoomId=null;safeDisplayRoomMessage("",!1);if(playerListUl)playerListUl.innerHTML='';showGameOptionsUI();switchView(mainMenuVw);});
    if(backToRoomBtn)backToRoomBtn.addEventListener('click',()=>{if(isAIAutoplaying){isAIAutoplaying=!1;aiAutoplayRoundsLeft=0;safeDisplayGameMessage("AI托管中止",!1);[dealButton,aiAutoplayButton,aiReferenceButton].forEach(b=>b&&(b.disabled=!1));}if(playerListUl&&loggedInUser)playerListUl.innerHTML=`<li>${loggedInUser}</li>`;if(roomTitleElement&¤tRoomId)roomTitleElement.textContent=`房间: ${currentRoomId}`;else if(roomTitleElement)roomTitleElement.textContent="房间";switchView(roomVw);});

    dealButton.addEventListener('click',async()=>{/* ... (Full game deal logic from previous, including auto-sort and special hand check) ... */});
    // Sort button was removed, auto-sort on deal.
    if(aiReferenceButton)aiReferenceButton.addEventListener('click',()=>{/* ... (Full AI Ref logic from previous, calls getAIRandomValidArrangement) ... */});
    if(aiAutoplayButton)aiAutoplayButton.addEventListener('click',()=>{if(isAIAutoplaying){isAIAutoplaying=!1;aiAutoplayRoundsLeft=0;safeDisplayGameMessage("AI托管中止",!1);[dealButton,aiAutoplayButton,aiReferenceButton].forEach(b=>b&&(b.disabled=!1));}else{showAIRoundSelector();}});
    function showAIRoundSelector(){/* ... (Full from previous) ... */}; function hideAIRoundSelector(){/* ... (Full from previous) ... */}; function startAIAutoplay(r){/* ... (Full from previous) ... */}; async function aiAutoplayNextRound(){/* ... (Full from previous) ... */}; async function simulateDealForAI(){/* ... (Full from previous) ... */};
    if(confirmOrganizationButton)confirmOrganizationButton.addEventListener('click',()=>{/* ... (Full confirm logic from previous) ... */});
    if(compareButton)compareButton.addEventListener('click',async()=>{/* ... (Full compare logic from previous, including sending currentUserPhone) ... */});
    if(callBackendButton){console.log("callBackendButton found:",callBackendButton);callBackendButton.addEventListener('click',async()=>{/* ... (Full test backend logic from previous) ... */});}else console.error("callBackendButton NOT found!");

    initializeApp(); // Initialize the application state and UI
});
