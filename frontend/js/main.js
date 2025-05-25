// frontend/js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof initializeUiElements === "function") {
        initializeUiElements();
    } else {
        console.error("CRITICAL: initializeUiElements is not defined!");
        alert("关键错误：UI初始化组件缺失。请刷新。(Err: UI_INIT_FAIL)");
        return;
    }

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg);
    };

    // --- 自动后端通讯测试 ---
    try {
        console.log("--- 自动后端通讯测试开始 ---");
        const testEndpoint = `${API_BASE_URL}deal_cards.php`;
        const response = await fetch(testEndpoint);
        if (!response.ok) throw new Error(`HTTP 错误! ${response.status} - ${await response.text()}`);
        await response.json(); // We just care that it's valid JSON
        console.log("--- 自动后端通讯测试结束 --- 成功获取数据");
    } catch (error) {
        console.error("自动后端通讯测试捕获到错误:", error);
        safeDisplayMessage(`自动后端通讯测试失败: ${error.message}`, true);
    }

    // DOM Elements Cache
    const domElements = {
        dealButton: document.getElementById('deal-button'),
        confirmOrganizationButton: document.getElementById('confirm-organization-button'),
        compareButton: document.getElementById('compare-button'),
        lobbyButton: document.getElementById('lobby-button'),
        pointsButton: document.getElementById('points-button'),
        aiReferenceButton: document.getElementById('ai-reference-button'),
        aiTakeoverButton: document.getElementById('ai-takeover-button'),
        aiTakeoverModal: document.getElementById('ai-takeover-modal'),
        initialAndMiddleHandElement: document.getElementById('player-hand'),
        topRowElement: document.getElementById('player-top-row'),
        bottomRowElement: document.getElementById('player-bottom-row'),
        middleHandHeaderContainer: document.getElementById('middle-hand-header-container'),
        middleHandHeader: document.getElementById('middle-hand-header'),
        topEvalTextElement: document.getElementById('top-eval-text'),
        middleEvalTextElement: document.getElementById('middle-eval-text'),
        bottomEvalTextElement: document.getElementById('bottom-eval-text')
    };

    // Validate critical DOM elements
    const criticalElements = ['initialAndMiddleHandElement', 'topRowElement', 'bottomRowElement', 'dealButton'];
    for (const elKey of criticalElements) {
        if (!domElements[elKey]) {
            console.error(`CRITICAL DOM Element Missing: ${elKey}. Game cannot proceed.`);
            safeDisplayMessage(`界面错误: 核心组件 "${elKey}" 丢失!`, true);
            return; // Stop initialization
        }
    }
    console.log("DOM Elements Check after getElementById:", domElements);


    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAiTakeoverActive = false;
    let aiTakeoverRoundsLeft = 0;

    function enableDragAndDrop(enable) {
        for (const key in sortableInstances) {
            if (sortableInstances[key] && typeof sortableInstances[key].option === 'function') {
                sortableInstances[key].option('disabled', !enable);
            }
        }
        document.querySelectorAll('.card-css').forEach(cardEl => {
            cardEl.style.cursor = enable ? 'grab' : 'not-allowed';
        });
    }

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else { console.error("SortableJS 加载失败!"); safeDisplayMessage("错误：拖拽功能加载失败。", true); }
            return;
        }
        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = { /* ... Sortable options ... */ }; // Keep your existing options
        
        if(domElements.initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(domElements.initialAndMiddleHandElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        if(domElements.topRowElement) sortableInstances.top = new Sortable(domElements.topRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        if(domElements.bottomRowElement) sortableInstances.bottom = new Sortable(domElements.bottomRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
    }

    function updateHandModelFromDOM(rowEl, rowName) { /* ... (Keep as is, uses rowEl directly) ... */ }
    function displayCurrentArrangementState(isAIOrganizing = false) { /* ... (Keep as is, but use domElements.xxx) ... */ }
    function checkDaoshuiForUI(midC) { /* ... (Keep as is, use domElements.xxx for class manipulation) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (Keep as is, use domElements.xxx) ... */ }
    function renderHandToDOM(organizedHand, targetPlayerOrganizedHandModel = true) { /* ... (Keep as is, use domElements.xxx) ... */ }


    function initializeGame() {
        console.log("调用 initializeGame");
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(true);

        [domElements.topRowElement, domElements.initialAndMiddleHandElement, domElements.bottomRowElement].forEach(el => {
            if (el) { el.innerHTML = ''; el.classList.remove('daoshui-warning', 'is-middle-row-style'); }
        });
        if(domElements.initialAndMiddleHandElement) domElements.initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        
        [domElements.topEvalTextElement, domElements.middleEvalTextElement, domElements.bottomEvalTextElement].forEach(el => {
            if (el) el.textContent='';
        });

        if (domElements.middleHandHeader && domElements.middleEvalTextElement) {
            const h3TextNode = Array.from(domElements.middleHandHeader.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "");
            if (h3TextNode) {
                h3TextNode.nodeValue = `我的手牌 / 中道 (剩余牌): `;
            } else { // If no suitable text node, reconstruct (might happen if DOM was manipulated unexpectedly)
                domElements.middleHandHeader.innerHTML = `我的手牌 / 中道 (剩余牌): <span id="middle-eval-text" style="font-weight:normal; color: #2980b9; font-style:italic;"></span>`;
                // domElements.middleEvalTextElement = document.getElementById('middle-eval-text'); // Re-fetch if reconstructed
            }
             if(domElements.middleEvalTextElement) domElements.middleEvalTextElement.textContent = ''; // Ensure this is the one from cache or re-fetched
        }

        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        
        if (domElements.dealButton) domElements.dealButton.disabled = false;
        if (domElements.confirmOrganizationButton) { domElements.confirmOrganizationButton.style.display = 'none'; domElements.confirmOrganizationButton.disabled = true; }
        if (domElements.compareButton) { domElements.compareButton.style.display = 'none'; domElements.compareButton.disabled = true; }
        if (domElements.aiReferenceButton) domElements.aiReferenceButton.disabled = true;
        if (domElements.aiTakeoverButton) {
            domElements.aiTakeoverButton.disabled = true;
            if (aiTakeoverRoundsLeft === 0) { isAiTakeoverActive = false; domElements.aiTakeoverButton.textContent = "AI托管"; }
        }
        console.log("游戏已初始化。");
    }

    // --- Event Listeners ---
    // Using a helper to add listeners only if element exists
    function addButtonListener(elementKey, eventType, handler) {
        if (domElements[elementKey]) {
            domElements[elementKey].addEventListener(eventType, handler);
        } else {
            console.warn(` addButtonListener: Element "${elementKey}" not found. Listener not added.`);
        }
    }

    addButtonListener('dealButton', 'click', async () => { /* ... (Your existing deal logic, use domElements.xxx) ... */ });
    addButtonListener('confirmOrganizationButton', 'click', () => { /* ... (Your existing confirm logic, use domElements.xxx) ... */ });
    addButtonListener('compareButton', 'click', async () => { /* ... (Your existing compare logic, use domElements.xxx) ... */ });
    addButtonListener('aiReferenceButton', 'click', () => { /* ... (Your existing AI ref logic, use domElements.xxx) ... */ });
    addButtonListener('aiTakeoverButton', 'click', () => { /* ... (Your existing AI takeover modal logic, use domElements.xxx) ... */ });
    addButtonListener('lobbyButton', 'click', () => { safeDisplayMessage("大厅功能暂未实现。", false); });
    addButtonListener('pointsButton', 'click', () => { safeDisplayMessage("积分查看功能暂未实现。", false); });
    
    if (domElements.aiTakeoverModal) {
        domElements.aiTakeoverModal.addEventListener('click', (event) => {
            const targetButton = event.target.closest('button');
            if (targetButton && targetButton.dataset.rounds) {
                // ... (Your existing modal button logic, use domElements.xxx) ...
            }
        });
    } else { console.warn("aiTakeoverModal not found. Listener for modal not added."); }


    // --- Game Initialization ---
    initializeGame();
    initializeSortable(); 
});
