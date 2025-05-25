// frontend/js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    // 确保 UI 元素从 ui.js 初始化
    if (typeof initializeUiElements === "function") {
        initializeUiElements();
    } else {
        console.error("CRITICAL: initializeUiElements function from ui.js is not defined! UI will not work correctly.");
        alert("关键错误：UI初始化失败。请刷新页面。(错误: UI_INIT_MISSING)");
        return;
    }

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg);
    };

    // --- 自动测试后端通讯 ---
    try {
        console.log("--- 自动后端通讯测试开始 ---");
        // safeDisplayMessage("正在自动测试后端通讯...", false); // 页面加载时可能太早显示，暂时注释
        const testEndpoint = `${API_BASE_URL}deal_cards.php`;
        const response = await fetch(testEndpoint);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP 错误! ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        // safeDisplayMessage("自动后端通讯测试成功！", false); // 成功信息也暂时注释，避免干扰初始界面
        console.log("--- 自动后端通讯测试结束 ---", data ? "成功获取数据" : "数据为空");
    } catch (error) {
        console.error("自动后端通讯测试捕获到错误:", error);
        safeDisplayMessage(`自动后端通讯测试失败: ${error.message}`, true);
    }

    // DOM Elements
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const lobbyButton = document.getElementById('lobby-button');
    const pointsButton = document.getElementById('points-button');
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiTakeoverButton = document.getElementById('ai-takeover-button');
    const aiTakeoverModal = document.getElementById('ai-takeover-modal');

    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeaderContainer = document.getElementById('middle-hand-header-container'); // 获取父级容器
    const middleHandHeader = document.getElementById('middle-hand-header'); // H3
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text'); // Span inside H3
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    console.log("DOM Element Check after getElementById:", { initialAndMiddleHandElement, topRowElement, bottomRowElement, middleHandHeader, topEvalTextElement /*...其他也检查下*/ });

    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAiTakeoverActive = false;
    let aiTakeoverRoundsLeft = 0;


    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else { console.error("SortableJS 加载失败!"); safeDisplayMessage("错误：拖拽功能加载失败。", true); }
            return;
        }
        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = { /* ... (SortableJS options as before) ... */ };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}}); else console.error("Sortable: initialAndMiddleHandElement is null");
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}}); else console.error("Sortable: topRowElement is null");
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}}); else console.error("Sortable: bottomRowElement is null");
    }

    function updateHandModelFromDOM(rowEl, rowName) { /* ... (as before) ... */ }
    function displayCurrentArrangementState(isAIOrganizing = false) { /* ... (as before, with null checks for elements) ... */ }
    function checkDaoshuiForUI(midC) { /* ... (as before, with null checks for elements) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (as before, with null checks for elements) ... */ }
    function renderHandToDOM(organizedHand, targetPlayerOrganizedHandModel = true) { /* ... (as before, with null checks for elements) ... */ }

    function initializeGame() {
        console.log("调用 initializeGame");
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(true); 

        // 清空牌道区域
        const handElements = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
        handElements.forEach(el => {
            if (el) {
                el.innerHTML = ''; // 只清空内容
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            } else {
                const elName = Object.keys({topRowElement,initialAndMiddleHandElement,bottomRowElement}).find(k=>eval(k)===el);
                console.warn(`initializeGame: 牌区元素 ${elName || '未知'} 为 null。`);
            }
        });
        
        // 设置初始牌区的提示文字
        if(initialAndMiddleHandElement) {
            initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        } else {
            console.error("initializeGame: initialAndMiddleHandElement 为 null! 无法设置初始文本。");
        }
        
        // 重置牌型评估文本
        const evalTexts = [topEvalTextElement, middleEvalTextElement, bottomEvalTextElement];
        evalTexts.forEach(el => { if (el) el.textContent=''; });

        // 重置中道标题
        if (middleHandHeader && middleEvalTextElement && middleHandHeader.childNodes.length > 0 && middleHandHeader.childNodes[0].nodeType === Node.TEXT_NODE) {
            middleHandHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            middleEvalTextElement.textContent = ''; // 确保其内部span也清空
        } else if (middleHandHeaderContainer) { // 如果H3本身有问题，尝试重置父容器（不太可能需要）
            // console.warn("initializeGame: middleHandHeader H3 结构不符合预期，尝试重置父级。");
            // middleHandHeaderContainer.innerHTML = `<h3 id="middle-hand-header" style="...">我的手牌 / 中道 (剩余牌): <span id="middle-eval-text" style="..."></span></h3>`;
            // Re-fetch might be needed if DOM is rebuilt this way, but ideally avoid.
        } else {
            console.warn("initializeGame: middleHandHeader 或 middleEvalTextElement 为 null 或结构不对。");
        }

        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        
        // 重置按钮状态
        if (dealButton) dealButton.disabled = false; else console.error("initializeGame: dealButton is null");
        if (confirmOrganizationButton) { confirmOrganizationButton.style.display = 'none'; confirmOrganizationButton.disabled = true; }
        if (compareButton) { compareButton.style.display = 'none'; compareButton.disabled = true; }
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) {
            aiTakeoverButton.disabled = true;
            if (aiTakeoverRoundsLeft === 0) { isAiTakeoverActive = false; aiTakeoverButton.textContent = "AI托管"; }
        }
        console.log("游戏已初始化。");
    }

    // --- DEAL BUTTON ---
    if (dealButton) {
        dealButton.addEventListener('click', async () => {
            console.log("--- 发牌按钮点击 ---");
            if (aiTakeoverRoundsLeft > 0) {
                aiTakeoverRoundsLeft--;
                isAiTakeoverActive = true;
                safeDisplayMessage(`AI托管剩余 ${aiTakeoverRoundsLeft + 1} 局。发牌中...`, false);
            } else {
                isAiTakeoverActive = false;
                if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
                // 不在这里调用 initializeGame() 以避免清空AI托管局数，
                // initializeGame() 应该在游戏完全结束或明确重置时调用。
                // 但我们需要重置牌面和部分UI状态。
            }
            
            playerFullHandSource = [];
            playerOrganizedHand = {top:[], middle:[], bottom:[]}; // 重置模型中的牌
            enableDragAndDrop(!isAiTakeoverActive);

            // 清空所有牌道的内容，而不是整个父容器
            if (topRowElement) topRowElement.innerHTML = ''; else console.error("发牌: topRowElement is null");
            if (initialAndMiddleHandElement) { // <<<< 关键区域
                initialAndMiddleHandElement.innerHTML = '<p>发牌中...</p>'; // 先显示提示
            } else {
                console.error("发牌: initialAndMiddleHandElement is null! 无法发牌。");
                safeDisplayMessage("错误: 核心牌区丢失，无法发牌！", true);
                if(dealButton) dealButton.disabled = false; // 允许重试
                return; // 阻止后续执行
            }
            if (bottomRowElement) bottomRowElement.innerHTML = ''; else console.error("发牌: bottomRowElement is null");

            // 重置牌型评估文本
            [topEvalTextElement, middleEvalTextElement, bottomEvalTextElement].forEach(el => {
                if(el) el.textContent = '';
            });
            // 重置中道标题
            if (middleHandHeader && middleEvalTextElement && middleHandHeader.childNodes.length > 0 && middleHandHeader.childNodes[0].nodeType === Node.TEXT_NODE) {
                middleHandHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
                middleEvalTextElement.textContent = '';
            }


            // 禁用/启用按钮
            dealButton.disabled = true;
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
            if (compareButton) compareButton.style.display = 'none';
            if (aiReferenceButton) aiReferenceButton.disabled = true;
            if (aiTakeoverButton && !isAiTakeoverActive) aiTakeoverButton.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}deal_cards.php`);
                if(!res.ok) throw new Error(`发牌失败: ${res.status} ${await res.text()}`);
                const data = await res.json();
                if(!data || !Array.isArray(data.cards) || data.cards.length!==13) throw new Error("牌数据错误。");
                
                playerFullHandSource = data.cards.map(cardFromServer => {
                    const suitInfo = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[cardFromServer.suitKey]) || { displayChar: '?', cssClass: 'unknown', fileNamePart: 'unknown' };
                    return {
                        rank: cardFromServer.rank, suitKey: cardFromServer.suitKey,
                        displaySuitChar: suitInfo.displayChar, suitCssClass: suitInfo.cssClass,
                        id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 9)
                    };
                }).filter(card => card.rank && card.suitKey);

                if (typeof sortCardsByRank === "function") {
                    playerFullHandSource = sortCardsByRank(playerFullHandSource);
                }

                // *** 关键：确保只清空 initialAndMiddleHandElement 的内容，然后追加牌 ***
                if (initialAndMiddleHandElement) {
                    initialAndMiddleHandElement.innerHTML = ''; // 清空 "发牌中..."
                    playerFullHandSource.forEach(card => {
                        if (card && typeof renderCard === "function") {
                            initialAndMiddleHandElement.appendChild(renderCard(card, true));
                        } else {
                            console.error("渲染牌错误: card 或 renderCard 无效", card);
                        }
                    });
                } else {
                    // 这个分支理论上因为上面的检查不会进入，但作为防御
                    console.error("发牌渲染: initialAndMiddleHandElement is null AFTER fetch! This is very wrong.");
                    safeDisplayMessage("严重错误: 牌区在发牌后消失！", true);
                    return;
                }
                
                displayCurrentArrangementState(); 

                if (isAiTakeoverActive) {
                    // ... (AI 托管逻辑，确保 renderHandToDOM 正确操作DOM) ...
                } else {
                    safeDisplayMessage("请理牌。", false);
                    if (confirmOrganizationButton) { confirmOrganizationButton.style.display = 'inline-block'; confirmOrganizationButton.disabled = false; }
                    if (aiReferenceButton) aiReferenceButton.disabled = false;
                    if (aiTakeoverButton) aiTakeoverButton.disabled = false;
                }

            } catch(err) {
                console.error("发牌流程中捕获到错误:", err); 
                safeDisplayMessage(`发牌错误: ${err.message}`,true);
                if (dealButton) dealButton.disabled = false; 
                isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0;
                if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
                enableDragAndDrop(true);
            }
        });
    } else { console.error("dealButton is null, event listener not added."); }

    // --- 其他按钮和函数的事件监听器和定义 ---
    // (confirmOrganizationButton, compareButton, AI按钮, enableDragAndDrop 等，确保它们内部也对DOM元素进行null检查)
    // ... (为了简洁，暂时省略其他按钮的完整代码，但它们内部也应该有类似的健壮性检查)
    // 确保您项目中这些部分也考虑了元素可能为null的情况

    if (confirmOrganizationButton) { /* ... listener ... */ } else { console.error("confirmOrganizationButton is null");}
    if (compareButton) { /* ... listener ... */ } else { console.error("compareButton is null");}
    if (aiReferenceButton) { /* ... listener ... */ } else { console.error("aiReferenceButton is null");}
    if (aiTakeoverButton) { /* ... listener ... */ } else { console.error("aiTakeoverButton is null");}
    if (aiTakeoverModal) { /* ... listener ... */ } else { console.error("aiTakeoverModal is null");}
    if (lobbyButton) { /* ... listener ... */ } else { console.error("lobbyButton is null");}
    if (pointsButton) { /* ... listener ... */ } else { console.error("pointsButton is null");}


    // --- 游戏启动 ---
    initializeGame(); // 确保在SortableJS初始化前，所有DOM元素引用已尝试获取
    initializeSortable(); // SortableJS依赖DOM元素存在
});
