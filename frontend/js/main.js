// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const mainMenuVw = document.getElementById('main-menu-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements & Game Options in Main Menu
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
    const menuMessageArea = document.getElementById('lobby-message-area'); // Corrected ID based on HTML
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

    // --- Helper Functions ---
    const safeDisplayMessage = (area, msg, isErr = false) => { if(area){area.textContent=msg; area.className='message-area'; if(isErr)area.classList.add('error'); else if(msg.toLowerCase().includes("成功")||msg.toLowerCase().includes("完成")||msg.toLowerCase().includes("欢迎")) area.classList.add('info');} else console.warn("Message area not found for:", msg);};
    const safeDisplayMenuMessage = (msg,isErr=false)=>safeDisplayMessage(menuMessageArea,msg,isErr);
    const safeDisplayRoomMessage = (msg,isErr=false)=>safeDisplayMessage(roomMessageArea,msg,isErr);
    const safeDisplayGameMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('message-area'),msg,isErr);
    const safeDisplayScore = (gameScoreText, totalScoreVal) => { if(scoreArea){let txt=gameScoreText||"";if(typeof totalScoreVal!=='undefined')txt=`总积分: ${totalScoreVal}`+(gameScoreText?` (${gameScoreText})`:"");scoreArea.textContent=txt;}else console.warn("Score area element not found.");};

    function switchView(viewToShow) { [mainMenuVw, roomVw, gameVw].forEach(v => v && v.classList.remove('active-view')); if(viewToShow){viewToShow.classList.add('active-view'); currentView = viewToShow;} else { console.error("switchView: viewToShow is invalid"); if(mainMenuVw) mainMenuVw.classList.add('active-view'); currentView = mainMenuVw;} }
    function showAuthFormInLobby(formToShow) { if(loginForm)loginForm.classList.remove('active-auth-form'); if(registerForm)registerForm.classList.remove('active-auth-form'); if(gameOptionsDiv)gameOptionsDiv.style.display='none'; if(formToShow)formToShow.classList.add('active-auth-form'); if(authTitle)authTitle.textContent=formToShow===loginForm?"用户登录":"用户注册"; safeDisplayMenuMessage(''); }
    function showGameOptionsUI() { if(loginForm)loginForm.classList.remove('active-auth-form'); if(registerForm)registerForm.classList.remove('active-auth-form'); if(gameOptionsDiv)gameOptionsDiv.style.display='block'; if(authTitle)authTitle.textContent="游戏大厅"; if(welcomeMessageElement && loggedInUser)welcomeMessageElement.textContent=`欢迎, ${loggedInUser}!`; else if(welcomeMessageElement)welcomeMessageElement.textContent="游戏大厅"; safeDisplayMenuMessage('');}

    // --- START: ALL FUNCTION DEFINITIONS NEEDED BY INITIALIZEAPP ---
    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else { console.error("SortableJS failed!"); safeDisplayGameMessage("错误：拖拽功能加载失败。", true); } return;
        }
        const opts = { group: 'thirteen-water-cards-group', animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
            onEnd: (evt) => { updateHandModelFromDOM(evt.from, evt.from.dataset.rowName); if (evt.to !== evt.from) updateHandModelFromDOM(evt.to, evt.to.dataset.rowName); displayCurrentArrangementState(); checkAllCardsOrganized(); },
            onMove: (evt) => { const to = evt.to, lim = parseInt(to.dataset.rowLimit); return !(lim && to !== evt.from && to.children.length >= lim); },
            onAdd: (evt) => { const to = evt.to, from = evt.from, lim = parseInt(to.dataset.rowLimit); if (lim && to.children.length > lim) { Sortable.utils.select(evt.item).remove(); from.appendChild(evt.item); safeDisplayGameMessage(`${to.dataset.rowName === 'top' ? '头' : '尾'}道已满!`, true); updateHandModelFromDOM(from, from.dataset.rowName); if (to !== from) updateHandModelFromDOM(to, to.dataset.rowName); displayCurrentArrangementState(); }}
        };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...opts, sort: true});
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...opts, sort: true});
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...opts, sort: true});
        console.log("SortableJS initialized.");
    }

    function updateHandModelFromDOM(rowEl, name) { if (!rowEl || !name) return; const cards = Array.from(rowEl.children).map(d => d.cardData).filter(Boolean); if (name === 'top') playerOrganizedHand.top = cards; else if (name === 'bottom') playerOrganizedHand.bottom = cards; }

    function displayCurrentArrangementState() {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        const midCSource = initialAndMiddleHandElement ? Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean) : [];
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;
        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "N/A"});
        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalF(topC).message : '...') || '...'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalF(botC).message : '...') || '...'})` : '';
        if (middleHandHeader) {
            const spanEvalElement = document.getElementById('middle-eval-text');
            if (spanEvalElement) {
                if (midReady) { middleHandHeader.childNodes[0].nodeValue = `中道 (5张): `; spanEvalElement.textContent = ` (${evalF(midCSource).message || '...'})`; initialAndMiddleHandElement && initialAndMiddleHandElement.classList.add('is-middle-row-style'); }
                else { middleHandHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; spanEvalElement.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : ''; initialAndMiddleHandElement && initialAndMiddleHandElement.classList.remove('is-middle-row-style'); }
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource); else console.warn("checkDaoshuiForUI is not defined in displayCurrentArrangementState");
    }

    function checkDaoshuiForUI(midC) {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") { safeDisplayGameMessage("牌型逻辑缺失。", true); return; }
        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && (isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning')));
            if(isDS) safeDisplayGameMessage("警告: 检测到倒水！", true);
            else if (confirmOrganizationButton && confirmOrganizationButton.disabled && !checkAllCardsOrganized(true)) safeDisplayGameMessage("请继续理牌...", false);
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        if(!initialAndMiddleHandElement || !playerOrganizedHand.top || !playerOrganizedHand.bottom) return false;
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3, botOK = playerOrganizedHand.bottom.length === 5, midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;
        if(confirmOrganizationButton) confirmOrganizationButton.disabled = !allSet;
        if(allSet && !silent) safeDisplayGameMessage("牌型已分配，请确认。", false);
        return allSet;
    }

    function resetGameTable() { /* ... (Full implementation from previous correct version) ... */ }
    function attemptAutoLogin(){const sU=localStorage.getItem(USER_STORAGE_KEY);if(sU){try{const uD=JSON.parse(sU);if(uD?.phone){loggedInUser=uD.phone;currentUserTotalScore=uD.score||0;console.log("User auto-logged in:",loggedInUser,"Score:",currentUserTotalScore);showGameOptionsUI();switchView(mainMenuVw); /* Should be mainInterfaceVw if game options are there */ safeDisplayScore("欢迎回来！",currentUserTotalScore);return!0;}}catch(e){console.error("Error parsing stored user:",e);localStorage.removeItem(USER_STORAGE_KEY);}}return!1;}
    function resetAppToMainMenu(){loggedInUser=null;currentRoomId=null;currentUserTotalScore=0;currentRoomType=null;currentRoomBaseScore=0;localStorage.removeItem(USER_STORAGE_KEY);if(document.getElementById('room-id-input'))document.getElementById('room-id-input').value='';if(playerListUl)playerListUl.innerHTML='';safeDisplayScore("",undefined);showAuthFormInLobby(loginForm);switchView(lobbyVw);console.log("App reset to main menu.");}
    function initializeGameUI(){resetGameTable();safeDisplayGameMessage("请点击“发牌”开始或等待游戏开始。",!1);if(dealButton){dealButton.style.display='inline-block';dealButton.disabled=!1;dealButton.textContent="发牌";}if(gameRoomInfoElement)gameRoomInfoElement.textContent=`房间: ${currentRoomId||"N/A"} (${currentRoomType==='practice'?'试玩':currentRoomBaseScore+'分'})`;if(gameUserInfoElement)gameUserInfoElement.textContent=`玩家: ${loggedInUser||"访客"}`;safeDisplayScore("",currentUserTotalScore);}
    function showAIRoundSelector(){/* ... (Full implementation from previous) ... */}; function hideAIRoundSelector(){/* ... (Full implementation from previous) ... */}; function startAIAutoplay(r){/* ... (Full implementation from previous) ... */}; async function aiAutoplayNextRound(){/* ... (Full implementation from previous) ... */}; async function simulateDealForAI(){/* ... (Full implementation from previous) ... */};
    // --- END: ALL FUNCTION DEFINITIONS ---

    // --- Authentication Event Listeners ---
    if(loginBtn)loginBtn.addEventListener('click',async()=>{/* ... (Full login logic) ... */});
    if(registerBtn)registerBtn.addEventListener('click',async()=>{/* ... (Full register logic) ... */});
    if(showRegisterLink)showRegisterLink.addEventListener('click',(e)=>{e.preventDefault();showAuthFormInLobby(registerForm);});
    if(showLoginLink)showLoginLink.addEventListener('click',(e)=>{e.preventDefault();showAuthFormInLobby(loginForm);});
    if(logoutBtn)logoutBtn.addEventListener('click',resetAppToMainMenu);

    // --- Room Selection & Navigation Event Listeners ---
    if (roomTypeButtons) roomTypeButtons.forEach((button)=>{button.addEventListener('click',()=>{/* ... (Full room button click logic) ... */});}); else console.warn("Room type buttons not found");
    if(startGameFromRoomBtn)startGameFromRoomBtn.addEventListener('click',()=>{/* ... (Full start game from room logic) ... */});
    if(leaveRoomBtn)leaveRoomBtn.addEventListener('click',()=>{/* ... (Full leave room logic) ... */});
    if(backToRoomBtn)backToRoomBtn.addEventListener('click',()=>{/* ... (Full back to room logic) ... */});

    // --- Game View Button Event Listeners ---
    if(dealButton)dealButton.addEventListener('click',async()=>{/* ... (Full game deal logic) ... */}); else console.error("Deal button missing!");
    if(aiReferenceButton)aiReferenceButton.addEventListener('click',()=>{/* ... (Full AI Ref logic) ... */});
    if(aiAutoplayButton)aiAutoplayButton.addEventListener('click',()=>{/* ... (Full AI Autoplay toggle logic) ... */});
    if(confirmOrganizationButton)confirmOrganizationButton.addEventListener('click',()=>{/* ... (Full confirm logic) ... */});
    if(compareButton)compareButton.addEventListener('click',async()=>{/* ... (Full compare logic) ... */});
    if(callBackendButton){callBackendButton.addEventListener('click',async()=>{/* ... (Full test backend logic) ... */});} else console.error("callBackendButton NOT found!");


    // --- Initial Application State Setup ---
    function initializeApp() {
        if (!attemptAutoLogin()) {
            showAuthFormInLobby(loginForm); // Default to login form in lobby
            switchView(lobbyVw);   // Start with the lobby view
        }
        // initializeSortable is called once the game view is shown for the first time,
        // or it can be called here if gameVw elements are always in DOM.
        // Let's assume it's better to init when gameVw becomes active if not already.
        // For now, keeping it here.
        if (typeof initializeSortable === "function") {
             initializeSortable();
        } else {
            console.error("initializeSortable function is not defined at the time of calling initializeApp.");
        }
        console.log("Application fully initialized."); // This is your log at line 188
    }

    initializeApp(); // This is where initializeSortable is called (line 187 in your log)
});
