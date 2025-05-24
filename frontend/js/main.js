// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const mainMenuVw = document.getElementById('main-menu-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements
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

    // Game Options (after auth)
    const gameOptionsDiv = document.getElementById('game-options');
    const welcomeMessageElement = document.getElementById('welcome-message'); // For welcome message
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const roomIdInput = document.getElementById('room-id-input');
    const quickStartBtn = document.getElementById('quick-start-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Room View Elements
    const roomTitle = document.getElementById('room-title');
    const currentRoomIdDisplay = document.getElementById('current-room-id-display');
    const playerListUl = document.getElementById('player-list');
    const startGameFromRoomBtn = document.getElementById('start-game-from-room-btn');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const roomMessageArea = document.getElementById('room-message-area');

    // Game View Elements
    const dealButton = document.getElementById('deal-button');
    const sortHandButton = document.getElementById('sort-hand-button'); // Kept for auto-sort on deal, can be hidden
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiAutoplayButton = document.getElementById('ai-autoplay-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');
    const backToRoomBtn = document.getElementById('back-to-room-btn');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header'); // The H3 element
    const topEvalTextElement = document.getElementById('top-eval-text');
    // middleEvalTextElement is the span inside middleHandHeader
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');
    const aiReferenceDisplayElement = document.getElementById('ai-reference-display');
    const aiTopRefElement = document.getElementById('ai-top-ref');
    const aiMiddleRefElement = document.getElementById('ai-middle-ref');
    const aiBottomRefElement = document.getElementById('ai-bottom-ref');
    const gameRoomInfoElement = document.getElementById('game-room-info');
    const gameUserInfoElement = document.getElementById('game-user-info');
    const scoreArea = document.getElementById('score-area'); // For total score

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = []; // Holds the 13 cards dealt from server
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let currentView = mainMenuVw; // Track current active view
    let currentRoomId = null;
    let loggedInUser = null; // Stores phone number of logged-in user
    let currentUserTotalScore = 0;
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAIAutoplaying = false;
    let aiAutoplayRoundsLeft = 0;
    const AI_AUTOPLAY_DELAY_MS = 1500;


    const safeDisplayMessage = (areaElement, msg, isErr = false) => {
        if (areaElement) {
            areaElement.textContent = msg;
            areaElement.className = 'message-area'; // Reset base class
            if (isErr) areaElement.classList.add('error');
            else if (msg.toLowerCase().includes("成功") || msg.toLowerCase().includes("完成")) areaElement.classList.add('info'); // Example for success
        } else {
            isErr ? console.error("Message Area Missing:", msg) : console.log("Message Area Missing:", msg);
        }
    };
    const safeDisplayMenuMessage = (msg, isErr = false) => safeDisplayMessage(menuMessageArea, msg, isErr);
    const safeDisplayRoomMessage = (msg, isErr = false) => safeDisplayMessage(roomMessageArea, msg, isErr);
    const safeDisplayGameMessage = (msg, isErr = false) => safeDisplayMessage(document.getElementById('message-area'), msg, isErr); // Game's own message area

    const safeDisplayScore = (gameScoreText, totalScoreValue) => {
        if (scoreArea) {
            let displayText = gameScoreText || ""; // Default to empty if no game specific score
            if (typeof totalScoreValue !== 'undefined') {
                displayText = `总积分: ${totalScoreValue}` + (gameScoreText ? ` (${gameScoreText})` : "");
            }
            scoreArea.textContent = displayText;
        } else {
            console.warn("Score area element not found.");
        }
    };


    function switchView(viewToShow) {
        [mainMenuVw, roomVw, gameVw].forEach(v => v && v.classList.remove('active-view'));
        if (viewToShow) {
            viewToShow.classList.add('active-view');
            currentView = viewToShow;
        } else {
            console.error("switchView: viewToShow is null or undefined");
        }
    }

    function showAuthForm(formToShow) {
        if (loginForm) loginForm.classList.remove('active-auth-form');
        if (registerForm) registerForm.classList.remove('active-auth-form');
        if (gameOptionsDiv) gameOptionsDiv.style.display = 'none';

        if (formToShow) {
            formToShow.classList.add('active-auth-form');
        }
        if (authTitle) authTitle.textContent = formToShow === loginForm ? "用户登录" : "用户注册";
        safeDisplayMenuMessage(""); // Clear previous menu messages
    }

    function showGameOptionsUI() {
        if (loginForm) loginForm.classList.remove('active-auth-form');
        if (registerForm) registerForm.classList.remove('active-auth-form');
        if (gameOptionsDiv) gameOptionsDiv.style.display = 'block';
        if (authTitle) authTitle.textContent = "十三水在线"; // Or "游戏大厅"
        if (welcomeMessageElement && loggedInUser) welcomeMessageElement.textContent = `欢迎, ${loggedInUser}!`;
        else if (welcomeMessageElement) welcomeMessageElement.textContent = "游戏选项";
        safeDisplayMenuMessage("");
    }

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
    }

    function updateHandModelFromDOM(rowEl, name) { if (!rowEl || !name) return; const cards = Array.from(rowEl.children).map(d => d.cardData).filter(Boolean); if (name === 'top') playerOrganizedHand.top = cards; else if (name === 'bottom') playerOrganizedHand.bottom = cards; }

    function displayCurrentArrangementState() {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean);
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;
        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "N/A"});
        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalF(topC).message : '...') || '...'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalF(botC).message : '...') || '...'})` : '';
        if (middleHandHeader) {
            const spanEvalElement = document.getElementById('middle-eval-text'); // Get span inside H3
            if (spanEvalElement) {
                if (midReady) { middleHandHeader.childNodes[0].nodeValue = `中道 (5张): `; spanEvalElement.textContent = ` (${evalF(midCSource).message || '...'})`; initialAndMiddleHandElement.classList.add('is-middle-row-style'); }
                else { middleHandHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; spanEvalElement.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : ''; initialAndMiddleHandElement.classList.remove('is-middle-row-style'); }
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource); else console.warn("checkDaoshuiForUI is not defined");
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
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3, botOK = playerOrganizedHand.bottom.length === 5, midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;
        if(confirmOrganizationButton) confirmOrganizationButton.disabled = !allSet;
        if(allSet && !silent) safeDisplayGameMessage("牌型已分配，请确认。", false);
        return allSet;
    }

    function initializeGameUI() { // Specific to resetting game UI elements
        playerFullHandSource = []; playerOrganizedHand = {top:[],middle:[],bottom:[]};
        [topRowElement,bottomRowElement].forEach(el => el && (el.innerHTML = ''));
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>等待发牌...</p>';
        [topEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));
        const h3MidHeader = document.getElementById('middle-hand-header'); const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) { h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; spanMidEval.textContent = ''; }
        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning','is-middle-row-style'));
        safeDisplayGameMessage("请点击“发牌”开始或等待游戏开始。", false); // Message for game view
        if(dealButton) { dealButton.style.display = 'inline-block'; dealButton.disabled = false; }
        [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => btn && (btn.style.display='none'));
        if(confirmOrganizationButton) confirmOrganizationButton.disabled=true;
        if(aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';
        if (gameRoomInfoElement && currentRoomId) gameRoomInfoElement.textContent = `房间: ${currentRoomId}`;
        if (gameUserInfoElement && loggedInUser) gameUserInfoElement.textContent = `玩家: ${loggedInUser}`;
        if (scoreArea) safeDisplayScore("", currentUserTotalScore); // Show total score at game start
    }

    function resetAppToMainMenu() { // Called on logout or leaving non-solo room fully
        loggedInUser = null; currentRoomId = null; currentUserTotalScore = 0;
        if(roomIdInput) roomIdInput.value = '';
        if(playerListUl) playerListUl.innerHTML = '';
        safeDisplayScore("", undefined); // Clear score area
        showAuthForm(loginForm);
        switchView(mainMenuVw);
        console.log("App reset to main menu.");
    }


    // --- Authentication Event Listeners ---
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();
            if (!username || !password) { safeDisplayMenuMessage("手机号和密码不能为空！", true); return; }
            safeDisplayMenuMessage("正在登录...", false);
            try {
                const response = await fetch(`${API_BASE_URL}login_user.php`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username: username, password: password })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    loggedInUser = data.username; // Store phone
                    currentUserTotalScore = data.score || 0;
                    safeDisplayMenuMessage("登录成功！", false);
                    safeDisplayScore("", currentUserTotalScore);
                    showGameOptionsUI();
                } else {
                    safeDisplayMenuMessage(data.message || "登录失败，请检查凭据。", true);
                }
            } catch (error) { console.error("Login error:", error); safeDisplayMenuMessage(`登录错误: ${error.message}`, true); }
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const phoneNumber = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value.trim();
            const confirmPassword = registerConfirmPasswordInput.value.trim();
            if (!phoneNumber || !password || !confirmPassword) { safeDisplayMenuMessage("所有字段不能为空！", true); return; }
            if (password !== confirmPassword) { safeDisplayMenuMessage("两次密码不匹配！", true); return; }
            if (password.length < 6) { safeDisplayMenuMessage("密码至少6位！", true); return; }
            // Basic phone number check (can be more lenient if desired)
            // if (!/^\d{7,15}$/.test(phoneNumber)) { safeDisplayMenuMessage("请输入有效手机号。", true); return; }
            safeDisplayMenuMessage("注册中...", false);
            try {
                const response = await fetch(`${API_BASE_URL}register_user.php`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ phone: phoneNumber, password: password })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    loggedInUser = phoneNumber; currentUserTotalScore = 0; // New user starts with 0
                    safeDisplayMenuMessage(result.message || "注册成功，已自动登录！", false);
                    safeDisplayScore("", currentUserTotalScore);
                    showGameOptionsUI();
                } else {
                    safeDisplayMenuMessage(result.message || "注册失败。", true);
                }
            } catch (error) { console.error("Registration error:", error); safeDisplayMenuMessage(`注册错误: ${error.message}`, true); }
        });
    }

    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showAuthForm(registerForm); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthForm(loginForm); });
    if (logoutBtn) logoutBtn.addEventListener('click', () => { resetAppToMainMenu(); });

    // --- Room and Game Navigation Event Listeners ---
    if (createRoomBtn) createRoomBtn.addEventListener('click', () => {
        currentRoomId = "R_" + Math.random().toString(16).slice(2, 8).toUpperCase();
        if(roomTitle) roomTitle.textContent = `房间: ${currentRoomId}`;
        if(currentRoomIdDisplay) currentRoomIdDisplay.textContent = currentRoomId;
        if(playerListUl && loggedInUser) playerListUl.innerHTML = `<li>${loggedInUser} (房主)</li>`;
        safeDisplayRoomMessage("房间已创建。等待或邀请朋友，或直接开始游戏。", false);
        switchView(roomVw);
    });

    if (joinRoomBtn) joinRoomBtn.addEventListener('click', () => {
        const idToJoin = roomIdInput.value.trim();
        if (!idToJoin) { safeDisplayMenuMessage("请输入房间ID！", true); return; }
        currentRoomId = idToJoin; // Simulate joining
        if(roomTitle) roomTitle.textContent = `房间: ${currentRoomId}`;
        if(currentRoomIdDisplay) currentRoomIdDisplay.textContent = currentRoomId;
        if(playerListUl && loggedInUser) playerListUl.innerHTML = `<li>${loggedInUser}</li>`; // Add self to player list
        safeDisplayRoomMessage(`已加入房间 ${currentRoomId}。等待房主开始...`, false);
        switchView(roomVw);
        if(roomIdInput) roomIdInput.value = '';
    });

    if (quickStartBtn) quickStartBtn.addEventListener('click', () => {
        currentRoomId = "SOLO_" + Date.now();
        if(roomTitle) roomTitle.textContent = "单人快速游戏";
        if(currentRoomIdDisplay) currentRoomIdDisplay.textContent = "单人模式";
        if(playerListUl && loggedInUser) playerListUl.innerHTML = `<li>${loggedInUser}</li>`;
        safeDisplayRoomMessage("准备开始单人游戏。", false);
        switchView(roomVw);
        setTimeout(() => { if(startGameFromRoomBtn) startGameFromRoomBtn.click(); }, 100);
    });

    if (startGameFromRoomBtn) startGameFromRoomBtn.addEventListener('click', () => {
        safeDisplayRoomMessage("", false);
        switchView(gameVw);
        initializeGameUI(); // Prepare the game board UI
        if (dealButton) setTimeout(() => dealButton.click(), 50); // Auto-deal slightly delayed
    });

    if (leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => {
        currentRoomId = null; safeDisplayRoomMessage("", false);
        if(playerListUl) playerListUl.innerHTML = '';
        showGameOptionsUI(); // Go back to game options, not login, if still logged in
        switchView(mainMenuVw);
    });

    if (backToRoomBtn) backToRoomBtn.addEventListener('click', () => {
        if (isAIAutoplaying) { isAIAutoplaying = false; aiAutoplayRoundsLeft = 0; safeDisplayGameMessage("AI托管已中止。", false); }
        // TODO: Properly reset game state if leaving mid-game
        if(playerListUl && loggedInUser) playerListUl.innerHTML = `<li>${loggedInUser}</li>`; // Re-populate player list
        if (roomTitle && currentRoomId) roomTitle.textContent = `房间: ${currentRoomId}`;
        else if (roomTitle) roomTitle.textContent = "房间";
        switchView(roomVw);
    });


    // --- Game View Button Event Listeners ---
    dealButton.addEventListener('click', async () => {
        console.log("--- Game Deal Button Clicked ---");
        // initializeGameUI(); // Resetting UI for a new hand within the game view
        safeDisplayGameMessage("正在发牌...", false);
        if(dealButton) dealButton.disabled = true; // Disable during fetch

        try {
            const response = await fetch(`${API_BASE_URL}deal_cards.php`);
            if (!response.ok) { const errTxt = await response.text(); throw new Error(`发牌请求错误: ${response.status} ${errTxt}`); }
            const data = await response.json();
            if (!data || !Array.isArray(data.cards) || data.cards.length !== 13) throw new Error("从服务器获取的牌数据无效。");

            playerFullHandSource = data.cards.map(cardFromServer => {
                const suitInfo = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[cardFromServer.suitKey]) || { displayChar:'?', cssClass:'unknown', fileNamePart:'unknown' };
                return { rank: cardFromServer.rank, suitKey: cardFromServer.suitKey, displaySuitChar: suitInfo.displayChar, suitCssClass: suitInfo.cssClass, id: (cardFromServer.rank||'X')+(cardFromServer.suitKey||'Y')+Math.random().toString(16).slice(2,7)};
            }).filter(card => card.rank && card.suitKey);

            let specialHand = null;
            if (typeof evaluateThirteenCardSpecial === 'function') specialHand = evaluateThirteenCardSpecial(playerFullHandSource);

            if (specialHand) {
                safeDisplayGameMessage(`特殊牌型：${specialHand.message}！本局结束。`, false);
                initialAndMiddleHandElement.innerHTML = '';
                const cardsToDisplay = (typeof sortHandCardsForDisplay === "function") ? sortHandCardsForDisplay(playerFullHandSource) : playerFullHandSource;
                cardsToDisplay.forEach(card => { if (typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true)); });
                [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => btn && (btn.style.display = 'none'));
                if (dealButton) dealButton.disabled = false; // Allow new deal for next game
            } else {
                initialAndMiddleHandElement.innerHTML = '';
                // Auto-sort before display
                const cardsToDisplay = (typeof sortHandCardsForDisplay === "function") ? sortHandCardsForDisplay(playerFullHandSource) : playerFullHandSource;
                cardsToDisplay.forEach(card => { if (typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true)); });

                playerOrganizedHand = { top: [], middle: [], bottom: [] }; // Reset organized hand for new deal
                if(topRowElement) topRowElement.innerHTML = '';
                if(bottomRowElement) bottomRowElement.innerHTML = '';
                displayCurrentArrangementState();
                safeDisplayGameMessage("手牌已自动整理，请摆牌。", false);
                [aiReferenceButton, aiAutoplayButton, confirmOrganizationButton].forEach(btn => btn && (btn.style.display = 'inline-block'));
                if(sortHandButton) sortHandButton.style.display = 'none'; // Hide sort button as it's auto
                if(compareButton) compareButton.style.display = 'none';
                if(confirmOrganizationButton) confirmOrganizationButton.disabled = true; // Disabled until cards are placed
            }
        } catch (error) {
            console.error("游戏内发牌错误:", error);
            safeDisplayGameMessage(`发牌时出错: ${error.message}`, true);
            if(dealButton) dealButton.disabled = false;
        }
    });

    // Sort button is removed from UI, but if you add it back, this logic is here.
    // if (sortHandButton) {
    //     sortHandButton.addEventListener('click', () => { /* ... sort logic ... */ });
    // }

    if (aiReferenceButton) { aiReferenceButton.addEventListener('click', () => { /* ... (AI Ref placeholder logic) ... */ }); }
    if (aiAutoplayButton) { aiAutoplayButton.addEventListener('click', () => { if(isAIAutoplaying) {isAIAutoplaying = false; safeDisplayGameMessage("AI托管已中止。", false);[dealButton,aiAutoplayButton,aiReferenceButton].forEach(b=>b&&(b.disabled=false));} else {showAIRoundSelector();} }); }
    if (confirmOrganizationButton) { confirmOrganizationButton.addEventListener('click', () => { /* ... (Confirm logic) ... */ }); }
    if (compareButton) { compareButton.addEventListener('click', async () => { /* ... (Compare logic, send currentUserPhone: loggedInUser) ... */ }); }
    if (callBackendButton) { callBackendButton.addEventListener('click', async () => { /* ... (Test backend logic) ... */ }); }


    // --- Initial Application State ---
    showAuthForm(loginForm); // Default to login form on main menu
    switchView(mainMenuVw);   // Start with the main menu view
    initializeSortable();      // Initialize sortable for the game view (even if hidden)
    // initializeGameUI(); // Don't initialize game UI until game starts
    console.log("Application fully initialized.");
});
