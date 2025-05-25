// frontend/js/main.js (简化测试版)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded Fired - Simplified Test Version");

    if (typeof initializeUiElements === "function") {
        initializeUiElements();
    } else {
        console.error("CRITICAL: initializeUiElements is not defined!");
        alert("关键错误：UI初始化组件缺失。请刷新。(Err: UI_INIT_FAIL_S)");
        return;
    }

    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg);
    };

    // DOM Elements Cache
    const domElements = {
        dealButton: document.getElementById('deal-button'),
        confirmOrganizationButton: document.getElementById('confirm-organization-button'),
        compareButton: document.getElementById('compare-button'),
        // AI Buttons removed for this test
        lobbyButton: document.getElementById('lobby-button'),
        pointsButton: document.getElementById('points-button'),
        initialAndMiddleHandElement: document.getElementById('player-hand'),
        topRowElement: document.getElementById('player-top-row'),
        bottomRowElement: document.getElementById('player-bottom-row'),
        middleHandHeaderContainer: document.getElementById('middle-hand-header-container'),
        middleHandHeader: document.getElementById('middle-hand-header'),
        topEvalTextElement: document.getElementById('top-eval-text'),
        middleEvalTextElement: document.getElementById('middle-eval-text'),
        bottomEvalTextElement: document.getElementById('bottom-eval-text'),
        // messageAreaElement and scoreAreaElement are handled by ui.js
    };

    // Validate critical DOM elements
    const criticalElements = ['initialAndMiddleHandElement', 'topRowElement', 'bottomRowElement', 'dealButton', 'middleHandHeader', 'middleEvalTextElement'];
    let allCriticalElementsFound = true;
    for (const elKey of criticalElements) {
        if (!domElements[elKey]) {
            console.error(`CRITICAL DOM Element Missing: ${elKey}.`);
            allCriticalElementsFound = false;
        }
    }
    if (!allCriticalElementsFound) {
        safeDisplayMessage(`界面错误: 核心组件丢失! 游戏无法启动。`, true);
        return; // Stop initialization
    }
    console.log("Simplified DOM Elements Check:", domElements);


    function initializeGame() {
        console.log("Simplified: 调用 initializeGame");

        [domElements.topRowElement, domElements.initialAndMiddleHandElement, domElements.bottomRowElement].forEach(el => {
            if (el) { el.innerHTML = ''; el.classList.remove('daoshui-warning', 'is-middle-row-style'); }
        });
        if(domElements.initialAndMiddleHandElement) domElements.initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始 (简化版)</p>';
        
        [domElements.topEvalTextElement, domElements.middleEvalTextElement, domElements.bottomEvalTextElement].forEach(el => {
            if (el) el.textContent='';
        });

        if (domElements.middleHandHeader && domElements.middleEvalTextElement) {
            const h3TextNode = Array.from(domElements.middleHandHeader.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "");
            if (h3TextNode) h3TextNode.nodeValue = `我的手牌 / 中道 (剩余牌): `;
            else domElements.middleHandHeader.firstChild.textContent = `我的手牌 / 中道 (剩余牌): `; // Fallback if structure is just H3 > SPAN
            domElements.middleEvalTextElement.textContent = '';
        }

        safeDisplayMessage("点击“发牌”开始 (简化版)。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        
        if (domElements.dealButton) domElements.dealButton.disabled = false;
        if (domElements.confirmOrganizationButton) { domElements.confirmOrganizationButton.style.display = 'none'; domElements.confirmOrganizationButton.disabled = true; }
        if (domElements.compareButton) { domElements.compareButton.style.display = 'none'; domElements.compareButton.disabled = true; }
        // AI buttons removed
        console.log("Simplified: 游戏已初始化。");
    }

    if (domElements.dealButton) {
        domElements.dealButton.addEventListener('click', () => {
            console.log("Simplified: --- 发牌按钮点击 ---");

            if (!domElements.initialAndMiddleHandElement || typeof renderCard !== 'function') {
                console.error("Simplified Deal: initialAndMiddleHandElement or renderCard is missing!");
                safeDisplayMessage("错误: 无法发牌，核心组件缺失。", true);
                return;
            }
            
            // 清空牌道
            if (domElements.topRowElement) domElements.topRowElement.innerHTML = '';
            if (domElements.initialAndMiddleHandElement) domElements.initialAndMiddleHandElement.innerHTML = ''; // 清空初始提示
            if (domElements.bottomRowElement) domElements.bottomRowElement.innerHTML = '';

            // 使用固定的假牌数据进行测试
            const fakeHand = [
                { rank: 'A', suitKey: 'SPADES', id: 'sA' }, { rank: 'K', suitKey: 'SPADES', id: 'sK' },
                { rank: 'Q', suitKey: 'SPADES', id: 'sQ' }, { rank: 'J', suitKey: 'SPADES', id: 'sJ' },
                { rank: '10', suitKey: 'SPADES', id: 's10' }, { rank: '2', suitKey: 'HEARTS', id: 'h2' },
                { rank: '3', suitKey: 'HEARTS', id: 'h3' }, { rank: '4', suitKey: 'DIAMONDS', id: 'd4' },
                { rank: '5', suitKey: 'DIAMONDS', id: 'd5' }, { rank: '6', suitKey: 'CLUBS', id: 'c6' },
                { rank: '7', suitKey: 'CLUBS', id: 'c7' }, { rank: '8', suitKey: 'CLUBS', id: 'c8' },
                { rank: '9', suitKey: 'CLUBS', id: 'c9' }
            ];

            playerFullHandSource = fakeHand; // 用于可能的AI参考（虽然AI逻辑被移除了）

            playerFullHandSource.forEach(card => {
                domElements.initialAndMiddleHandElement.appendChild(renderCard(card, true));
            });

            safeDisplayMessage("请理牌 (简化版)。", false);
            if (domElements.confirmOrganizationButton) { domElements.confirmOrganizationButton.style.display = 'inline-block'; domElements.confirmOrganizationButton.disabled = false; }
            // AI buttons removed
            if (domElements.dealButton) domElements.dealButton.disabled = true;
        });
    } else {
        console.error("Simplified: dealButton is null, listener not added.");
    }

    // 其他按钮的简化监听器（如果需要测试它们是否存在）
    if(domElements.lobbyButton) domElements.lobbyButton.addEventListener('click', () => safeDisplayMessage("大厅 (简化版)", false));
    if(domElements.pointsButton) domElements.pointsButton.addEventListener('click', () => safeDisplayMessage("积分 (简化版)", false));


    // --- Game Initialization ---
    initializeGame();
    // SortableJS 初始化暂时移除，因为它依赖牌区元素，先确保牌区本身能渲染
    // initializeSortable(); 
    console.log("Simplified: 初始化完成，等待发牌。");
});
