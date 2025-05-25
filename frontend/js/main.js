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
        const testEndpoint = `${API_BASE_URL}deal_cards.php`;
        const response = await fetch(testEndpoint);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP 错误! ${response.status} - ${errorText}`);
        }
        const data = await response.json();
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
    const middleHandHeaderContainer = document.getElementById('middle-hand-header-container');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    console.log("DOM Element Check after getElementById:", { initialAndMiddleHandElement, topRowElement, bottomRowElement /*, ... */ });

    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAiTakeoverActive = false;
    let aiTakeoverRoundsLeft = 0;

    // --- 【重要】将 enableDragAndDrop 函数定义移到靠前的位置 ---
    function enableDragAndDrop(enable) {
        for (const key in sortableInstances) {
            if (sortableInstances[key] && typeof sortableInstances[key].option === 'function') {
                sortableInstances[key].option('disabled', !enable);
            }
        }
        const cardElements = document.querySelectorAll('.card-css');
        cardElements.forEach(cardEl => {
            cardEl.style.cursor = enable ? 'grab' : 'not-allowed';
        });
    }
    // --- enableDragAndDrop 定义结束 ---


    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else { console.error("SortableJS 加载失败!"); safeDisplayMessage("错误：拖拽功能加载失败。", true); }
            return;
        }
        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = {
            group: sharedGroupName, animation: 150, ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
            onEnd: function (evt) {
                updateHandModelFromDOM(evt.from, evt.from.dataset.rowName);
                if (evt.to !== evt.from) updateHandModelFromDOM(evt.to, evt.to.dataset.rowName);
                displayCurrentArrangementState(); 
                checkAllCardsOrganized();
            },
            onMove: function (evt) {
                if (isAiTakeoverActive) return false;
                const toEl = evt.to;
                if (!toEl) return true;
                const limit = parseInt(toEl.dataset.rowLimit);
                if (limit && toEl !== evt.from && toEl.children.length >= limit) return false;
                return true;
            },
            onAdd: function(evt) {
                const toEl = evt.to;
                const fromEl = evt.from;
                if (!toEl || !fromEl) return;

                const limit = parseInt(toEl.dataset.rowLimit);
                if (limit && toEl.children.length > limit) {
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item); 
                    fromEl.appendChild(evt.item);
                    safeDisplayMessage(`${toEl.dataset.rowName === 'top' ? '头' : (toEl.dataset.rowName === 'bottom' ? '尾' : '中')}道已满! 卡片已退回。`, true);
                    updateHandModelFromDOM(fromEl, fromEl.dataset.rowName);
                    displayCurrentArrangementState();
                }
            }
        };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}}); else console.error("Sortable: initialAndMiddleHandElement is null");
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}}); else console.error("Sortable: topRowElement is null");
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}}); else console.error("Sortable: bottomRowElement is null");
    }

    function updateHandModelFromDOM(rowEl, rowName) {
        if (!rowEl || !rowName) return;
        const cards = Array.from(rowEl.children).map(div => div.cardData).filter(Boolean);
        if (rowName === 'top') playerOrganizedHand.top = cards;
        else if (rowName === 'bottom') playerOrganizedHand.bottom = cards;
    }

    function displayCurrentArrangementState(isAIOrganizing = false) {
        const topC = playerOrganizedHand.top || [];
        const botC = playerOrganizedHand.bottom || [];
        let midCSource = [];

        if (isAIOrganizing && playerOrganizedHand.middle && playerOrganizedHand.middle.length === 5) {
            midCSource = playerOrganizedHand.middle;
        } else if (initialAndMiddleHandElement) {
            midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        } else {
            console.warn("displayCurrentArrangementState: initialAndMiddleHandElement is null, cannot get middle cards from DOM.");
        }
        
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;
        const evalFunc = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "评价逻辑缺失"});

        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalFunc(topC).message : '未完成') || '未完成'})` : '';
        else console.warn("displayCurrentArrangementState: topEvalTextElement is null");

        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalFunc(botC).message : '未完成') || '未完成'})` : '';
        else console.warn("displayCurrentArrangementState: bottomEvalTextElement is null");


        if (middleHandHeader) { 
            const h3TitleElement = document.getElementById('middle-hand-header');
            const spanEvalElement = document.getElementById('middle-eval-text'); 
            if (h3TitleElement && spanEvalElement) {
                if (midReady) {
                    if (h3TitleElement.childNodes.length > 0 && h3TitleElement.childNodes[0].nodeType === Node.TEXT_NODE) {
                        h3TitleElement.childNodes[0].nodeValue = `中道 (5张): `; 
                    } else if (h3TitleElement) { // If no text node, try to set it (less ideal)
                        h3TitleElement.textContent = `中道 (5张): `;
                        h3TitleElement.appendChild(spanEvalElement); // Re-append span if textContent wiped it
                    }
                    spanEvalElement.textContent = ` (${evalFunc(midCSource).message || '计算中...'})`;
                    if(initialAndMiddleHandElement) initialAndMiddleHandElement.classList.add('is-middle-row-style');
                } else {
                    if (h3TitleElement.childNodes.length > 0 && h3TitleElement.childNodes[0].nodeType === Node.TEXT_NODE) {
                        h3TitleElement.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
                    } else if (h3TitleElement) {
                        h3TitleElement.textContent = `我的手牌 / 中道 (剩余牌): `;
                        h3TitleElement.appendChild(spanEvalElement);
                    }
                    const displayCount = midCSource.length;
                    spanEvalElement.textContent = displayCount > 0 ? ` (共${displayCount}张)` : '';
                    if(initialAndMiddleHandElement) initialAndMiddleHandElement.classList.remove('is-middle-row-style');
                }
            } else {
                if (!h3TitleElement) console.warn("displayCurrentArrangementState: middle-hand-header (H3) is null");
                if (!spanEvalElement) console.warn("displayCurrentArrangementState: middle-eval-text (SPAN) is null");
            }
        } else console.warn("displayCurrentArrangementState: middleHandHeader (H3's parent div/element) is null");
        
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource);
    }

    function checkDaoshuiForUI(midC) {
        if (!midC) return;
        const topC = playerOrganizedHand.top || [];
        const botC = playerOrganizedHand.bottom || [];
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") return;

        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            
            const elementsToWarn = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
            elementsToWarn.forEach(el => {
                if (el) isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning');
            });
            if(isDS) safeDisplayMessage("警告: 检测到倒水！", true);
        } else {
            const elementsToClearWarn = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
             elementsToClearWarn.forEach(el => {
                if (el) el.classList.remove('daoshui-warning');
            });
        }
    }

    function checkAllCardsOrganized(silent = false) {
        let midCSource = [];
        if (initialAndMiddleHandElement) {
            midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        } else if (!isAiTakeoverActive){
            console.warn("checkAllCardsOrganized: initialAndMiddleHandElement is null.");
        }

        const midHandToCheck = isAiTakeoverActive && playerOrganizedHand.middle ? playerOrganizedHand.middle : midCSource;
        const topOK = playerOrganizedHand.top ? playerOrganizedHand.top.length === 3 : false;
        const botOK = playerOrganizedHand.bottom ? playerOrganizedHand.bottom.length === 5 : false;
        const midOK = midHandToCheck ? midHandToCheck.length === 5 : false;
        const allSet = topOK && botOK && midOK;

        if (confirmOrganizationButton) {
            confirmOrganizationButton.disabled = !allSet || isAiTakeoverActive || aiTakeoverRoundsLeft > 0;
        }
        if(allSet && !silent && !isAiTakeoverActive) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }
    
    function renderHandToDOM(organizedHand, targetPlayerOrganizedHandModel = true) {
        if (!organizedHand || typeof renderCard !== 'function') {
            console.error("renderHandToDOM: 无效的参数", {organizedHand, renderCardExists: typeof renderCard === 'function'});
            return;
        }
        if (!topRowElement || !initialAndMiddleHandElement || !bottomRowElement) {
            console.error("renderHandToDOM: 一个或多个牌区元素未找到!", {topRowElement, initialAndMiddleHandElement, bottomRowElement});
            return;
        }
        topRowElement.innerHTML = '';
        (organizedHand.top || []).forEach(card => topRowElement.appendChild(renderCard(card, true)));
    
        initialAndMiddleHandElement.innerHTML = '';
        (organizedHand.middle || []).forEach(card => initialAndMiddleHandElement.appendChild(renderCard(card, true)));
    
        bottomRowElement.innerHTML = '';
        (organizedHand.bottom || []).forEach(card => bottomRowElement.appendChild(renderCard(card, true)));
    
        if (targetPlayerOrganizedHandModel) {
            playerOrganizedHand.top = [...(organizedHand.top || [])];
            playerOrganizedHand.middle = [...(organizedHand.middle || [])];
            playerOrganizedHand.bottom = [...(organizedHand.bottom || [])];
        }
        displayCurrentArrangementState(false);
        checkAllCardsOrganized();
    }
    
    function initializeGame() {
        console.log("调用 initializeGame");
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(true); // Moved enableDragAndDrop definition before this

        const handElements = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
        handElements.forEach(el => {
            if (el) {
                el.innerHTML = '';
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            } else {
                const elName = Object.keys({topRowElement,initialAndMiddleHandElement,bottomRowElement}).find(k=>eval(k)===el);
                console.warn(`initializeGame: 牌区元素 ${elName || '未知'} 为 null。`);
            }
        });
        
        if(initialAndMiddleHandElement) {
            initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        } else {
            console.error("initializeGame: initialAndMiddleHandElement 为 null! 无法设置初始文本。");
        }
        
        const evalTexts = [topEvalTextElement, middleEvalTextElement, bottomEvalTextElement];
        evalTexts.forEach(el => { if (el) el.textContent=''; });

        if (middleHandHeader && middleEvalTextElement) {
            const h3TextNode = Array.from(middleHandHeader.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (h3TextNode) {
                h3TextNode.nodeValue = `我的手牌 / 中道 (剩余牌): `;
            } else if (middleHandHeader.firstChild && middleHandHeader.firstChild.nodeType === Node.ELEMENT_NODE && middleHandHeader.firstChild.id === 'middle-eval-text') {
                 // This case means the text node might have been wiped, try to recreate.
                 // This is a bit hacky, ideally the H3 structure is stable.
                 middleHandHeader.insertBefore(document.createTextNode("我的手牌 / 中道 (剩余牌): "), middleHandHeader.firstChild);
            } else if (middleHandHeader.textContent === "" || !Array.from(middleHandHeader.childNodes).some(node => node.nodeType === Node.TEXT_NODE)) {
                // If H3 is empty or has no text node at all, reconstruct more carefully
                middleHandHeader.innerHTML = `我的手牌 / 中道 (剩余牌): <span id="middle-eval-text" style="font-weight:normal; color: #2980b9; font-style:italic;"></span>`;
                // Re-fetch middleEvalTextElement as it was recreated
                // middleEvalTextElement = document.getElementById('middle-eval-text'); // Be careful with re-fetching global vars
            } else {
                 console.warn("initializeGame: middleHandHeader H3 文本节点未找到或结构异常。");
            }
            middleEvalTextElement.textContent = '';
        } else {
            console.warn("initializeGame: middleHandHeader 或 middleEvalTextElement 为 null。");
        }


        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        
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

    // --- Event Listeners for Buttons (deal, confirm, compare, AI, etc.) ---
    // Make sure these are only added if the button element exists.
    if (dealButton) {
        dealButton.addEventListener('click', async () => { /* ... (deal logic as before) ... */ });
    } else { console.error("dealButton is null, cannot add event listener."); }

    if (confirmOrganizationButton) {
        confirmOrganizationButton.addEventListener('click', () => { /* ... (confirm logic as before) ... */ });
    } else { console.error("confirmOrganizationButton is null, cannot add event listener."); }

    if (compareButton) {
        compareButton.addEventListener('click', async () => { /* ... (compare logic as before) ... */ });
    } else { console.error("compareButton is null, cannot add event listener."); }
    
    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', () => { /* ... (AI reference logic as before) ... */ });
    } else { console.error("aiReferenceButton is null, cannot add event listener."); }

    if (aiTakeoverButton) {
        aiTakeoverButton.addEventListener('click', () => { /* ... (AI takeover logic to show modal) ... */ });
    } else { console.error("aiTakeoverButton is null, cannot add event listener."); }

    if (aiTakeoverModal) {
        aiTakeoverModal.addEventListener('click', (event) => { /* ... (modal logic as before) ... */ });
    } else { console.error("aiTakeoverModal is null, cannot add event listener."); }

    if (lobbyButton) {
        lobbyButton.addEventListener('click', () => { safeDisplayMessage("大厅功能暂未实现。", false); });
    } else { console.error("lobbyButton is null, cannot add event listener."); }

    if (pointsButton) {
        pointsButton.addEventListener('click', () => { safeDisplayMessage("积分查看功能暂未实现。", false); });
    } else { console.error("pointsButton is null, cannot add event listener."); }


    // --- Game Initialization ---
    initializeGame();
    initializeSortable(); 
});
