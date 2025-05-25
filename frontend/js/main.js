// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- App Sections ---
    const lobbySection = document.getElementById('lobby-section');
    const roomSection = document.getElementById('room-section');

    // --- Lobby Elements ---
    const playerNameInput = document.getElementById('player-name-input');
    const profileButton = document.getElementById('profile-button');
    const trialRoomButton = document.getElementById('trial-room-button');
    const stakesRoomsContainer = document.querySelector('.stakes-rooms-container'); // For event delegation
    const lobbyMessageArea = document.getElementById('lobby-message-area');
    const callBackendButtonLobby = document.getElementById('call-backend-button-lobby');

    // --- Room Elements ---
    const roomTitleElement = document.getElementById('room-title');
    const playersInRoomTextElement = document.getElementById('players-in-room-text');
    const leaveRoomButton = document.getElementById('leave-room-button');

    // --- Game Elements (within Room) ---
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;

    // --- App State ---
    let currentPlayerName = '';
    let currentRoomId = null;
    // let isGameActiveInRoom = false; // Already declared and used in dealButton

    const safeDisplayMessage = (message, isError = false, areaElement = null) => {
        const targetElement = areaElement || (lobbySection.style.display !== 'none' ? lobbyMessageArea : document.getElementById('message-area'));
        if (typeof displayMessage === "function" && targetElement) {
            displayMessage(message, isError, targetElement);
        } else {
            isError ? console.error(message) : console.log(message);
        }
    };

    function showLobby() {
        lobbySection.style.display = 'flex';
        roomSection.style.display = 'none';
        currentRoomId = null;
        // isGameActiveInRoom = false; // This should be reset when entering a room or starting a game.
        playerNameInput.value = currentPlayerName || "玩家" + Math.floor(Math.random() * 1000);
        safeDisplayMessage("请选择一个房间开始游戏。", false, lobbyMessageArea);
        initializeGame(); // Reset game state when returning to lobby
    }

    function showRoom(roomId, roomDisplayName, playerName) {
        lobbySection.style.display = 'none';
        roomSection.style.display = 'flex';
        currentRoomId = roomId; // Internal ID for logic
        currentPlayerName = playerName;
        roomTitleElement.textContent = `${roomDisplayName}`; // User-friendly name
        playersInRoomTextElement.textContent = `${playerName} (你)`; // Mock
        
        initializeGame();
        safeDisplayMessage(`已加入房间 "${roomDisplayName}". 点击 "发牌" 开始。`, false);
        dealButton.disabled = false;
        dealButton.textContent = '发牌 (开始游戏)';
        confirmOrganizationButton.style.display = 'none';
        compareButton.style.display = 'none';
    }

    function attemptToJoinRoom(roomId, roomDisplayName) {
        const name = playerNameInput.value.trim();
        if (!name) {
            safeDisplayMessage("请输入你的昵称！", true, lobbyMessageArea);
            playerNameInput.focus();
            return;
        }
        currentPlayerName = name; // Store name even if joining fails for other reasons
        // In a real app, here you would check room availability, password, etc. via backend
        console.log(`Attempting to join room: ${roomId} (Display: ${roomDisplayName}) as ${name}`);
        showRoom(roomId, roomDisplayName, name);
    }


    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else console.error("SortableJS failed to load!");
            return;
        }
        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = { /* ... existing options ... */ };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
    }
    
    // ... (updateHandModelFromDOM, displayCurrentArrangementState, checkDaoshuiForUI, checkAllCardsOrganized - unchanged)
    function updateHandModelFromDOM(rowEl, rowName) {
        if (!rowEl || !rowName) return;
        const cards = Array.from(rowEl.children).map(div => div.cardData).filter(Boolean);
        if (rowName === 'top') playerOrganizedHand.top = cards;
        else if (rowName === 'bottom') playerOrganizedHand.bottom = cards;
    }

    function displayCurrentArrangementState() {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;

        const evalFunc = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "评价逻辑缺失"});

        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalFunc(topC).message : '未完成') || '未完成'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalFunc(botC).message : '未完成') || '未完成'})` : '';

        if (middleHandHeader) { 
            const h3TitleElement = document.getElementById('middle-hand-header'); 
            const spanEvalElement = document.getElementById('middle-eval-text'); 
            if (h3TitleElement && spanEvalElement) {
                if (midReady) {
                    h3TitleElement.childNodes[0].nodeValue = `中道 (5张): `; 
                    spanEvalElement.textContent = ` (${evalFunc(midCSource).message || '计算中...'})`;
                    initialAndMiddleHandElement.classList.add('is-middle-row-style');
                } else {
                    h3TitleElement.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
                    spanEvalElement.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : '';
                    initialAndMiddleHandElement.classList.remove('is-middle-row-style');
                }
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource);
    }

    function checkDaoshuiForUI(midC) {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") return;
        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && (isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning')));
            if(isDS) safeDisplayMessage("警告: 检测到倒水！", true);
            else if (confirmOrganizationButton.disabled && !checkAllCardsOrganized(true)) safeDisplayMessage("请继续理牌...", false);
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3, botOK = playerOrganizedHand.bottom.length === 5, midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;
        if (confirmOrganizationButton) confirmOrganizationButton.disabled = !allSet;
        if(allSet && !silent) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }

    function initializeGame() {
        playerFullHandSource = []; playerOrganizedHand = {top:[],middle:[],bottom:[]};
        [topRowElement,bottomRowElement].forEach(el => el && (el.innerHTML = ''));
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌 (开始游戏)" 开始</p>';
        [topEvalTextElement,middleEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));

        const h3MidHeader = document.getElementById('middle-hand-header');
        const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) {
            h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            spanMidEval.textContent = '';
        }
        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning','is-middle-row-style'));
        
        if (roomSection.style.display !== 'none') {
             safeDisplayMessage('点击 "发牌 (开始游戏)" 开始新一局。', false);
        }
        if(typeof displayScore === "function") displayScore("");
        
        if(dealButton) { dealButton.disabled = false; dealButton.textContent = '发牌 (开始游戏)'; }
        if(confirmOrganizationButton) { confirmOrganizationButton.style.display = 'none'; confirmOrganizationButton.disabled = true; }
        if(compareButton) { compareButton.style.display = 'none'; compareButton.disabled = true; }
    }

    // --- Lobby Event Listeners ---
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            safeDisplayMessage("个人资料功能暂未开放。", false, lobbyMessageArea);
            // Future: show profile modal or page
        });
    }

    if (trialRoomButton) {
        trialRoomButton.addEventListener('click', () => {
            attemptToJoinRoom("TrialRoom_1", "试玩房间");
        });
    }

    if (stakesRoomsContainer) {
        stakesRoomsContainer.addEventListener('click', (event) => {
            const targetButton = event.target.closest('.stake-room-button');
            if (targetButton) {
                const banner = targetButton.closest('.stake-level-banner');
                const stake = banner.dataset.stake;
                const roomIndex = targetButton.dataset.roomIndex;
                const roomId = `Stake${stake}_Room${roomIndex}`;
                const roomDisplayName = `${stake}分场 - 房间 ${roomIndex}`;
                attemptToJoinRoom(roomId, roomDisplayName);
            }
        });
    }
    
    if (leaveRoomButton) leaveRoomButton.addEventListener('click', showLobby);

    // --- Game Event Listeners (Deal, Confirm, Compare - largely unchanged logic) ---
    let isGameActiveInRoom = false; // Moved declaration here
    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked (Start Game in Room) ---");
        playerFullHandSource = []; playerOrganizedHand = {top:[],middle:[],bottom:[]};
        [topRowElement,bottomRowElement].forEach(el => el && (el.innerHTML = ''));
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>发牌中...</p>';
        [topEvalTextElement,middleEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));
         const h3MidHeader = document.getElementById('middle-hand-header');
        const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) {
            h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            spanMidEval.textContent = '';
        }
        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning','is-middle-row-style'));

        safeDisplayMessage("发牌中...", false); dealButton.disabled=true;
        isGameActiveInRoom = true; 

        try {
            // ... (fetch and process cards - same as before) ...
            const res = await fetch(`${API_BASE_URL}deal_cards.php`);
            if(!res.ok) throw new Error(`发牌失败: ${res.status} ${await res.text()}`);
            const data = await res.json();
            if(!data || !Array.isArray(data.cards) || data.cards.length!==13) throw new Error("牌数据错误。");

            playerFullHandSource = data.cards.map(cardFromServer => {
                const suitInfo = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[cardFromServer.suitKey]) || { displayChar: '?', cssClass: 'unknown', fileNamePart: 'unknown' };
                return {
                    rank: cardFromServer.rank, suitKey: cardFromServer.suitKey,
                    displaySuitChar: suitInfo.displayChar, suitCssClass: suitInfo.cssClass,
                    id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 7)
                };
            }).filter(card => card.rank && card.suitKey);

            if (typeof sortCards === "function") {
                playerFullHandSource = sortCards(playerFullHandSource); 
            }

            initialAndMiddleHandElement.innerHTML='';
            playerFullHandSource.forEach(card => {
                if (card && typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true));
            });
            displayCurrentArrangementState(); safeDisplayMessage("请理牌。", false);
            confirmOrganizationButton.style.display='inline-block';
            dealButton.textContent = '重新开始';
            dealButton.disabled = false;

        } catch(err) {
            console.error("发牌错误:", err); safeDisplayMessage(`错误: ${err.message}`,true);
            dealButton.disabled=false; confirmOrganizationButton.style.display='none';
            isGameActiveInRoom = false;
        }
    });

    confirmOrganizationButton.addEventListener('click', () => { /* ... existing logic ... */ });
    compareButton.addEventListener('click', async () => { /* ... existing logic ... */ });

    // Test backend button
    if (callBackendButtonLobby) {
        callBackendButtonLobby.addEventListener('click', async () => { /* ... existing logic ... */ });
    }

    // --- Initial Setup ---
    showLobby();
    initializeSortable();
});
