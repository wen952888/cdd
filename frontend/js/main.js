// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');

    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    // --- Configuration ---
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';

    // --- Game State ---
    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};

    // --- SortableJS Initialization ---
    // ... (SortableJS init code - no changes needed here for image display) ...
    const MAX_SORTABLE_INIT_ATTEMPTS = 10;
    let sortableInitializationAttempts = 0;
    const SORTABLE_INIT_DELAY = 200;

    function initializeSortable() {
        if (typeof Sortable === 'undefined') { /* ... */ } // Existing Sortable check

        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = { /* ... */ }; // Existing options

        if (initialAndMiddleHandElement) { /* ... */ } // Existing instance creation
        if (topRowElement) { /* ... */ }
        if (bottomRowElement) { /* ... */ }
    }
    // (Full SortableJS initialization code from previous version)
    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) {
                setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            } else {
                console.error("SortableJS library failed to load after multiple attempts!");
                if (typeof displayMessage === 'function') {
                    displayMessage("错误：拖拽功能加载失败，请刷新页面重试。", true);
                }
            }
            return;
        }

        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = {
            group: sharedGroupName,
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function (evt) {
                updateHandModelFromDOM(evt.from, evt.from.dataset.rowName);
                if (evt.to !== evt.from) {
                    updateHandModelFromDOM(evt.to, evt.to.dataset.rowName);
                }
                displayCurrentArrangementState();
                checkAllCardsOrganized();
            },
            onMove: function (evt) {
                const toRowElement = evt.to;
                const fromRowElement = evt.from;
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);
                if (rowLimit && toRowElement !== fromRowElement) {
                    if (toRowElement.children.length >= rowLimit) return false;
                }
                return true;
            },
            onAdd: function(evt) {
                const toRowElement = evt.to;
                const fromRowElement = evt.from;
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);
                 if (rowLimit && toRowElement.children.length > rowLimit) {
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item);
                    fromRowElement.appendChild(evt.item);
                    if (typeof displayMessage === 'function') {
                        displayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : '尾'}道已满! 卡片已退回。`, true);
                    }
                    updateHandModelFromDOM(fromRowElement, fromRowElement.dataset.rowName);
                    if (toRowElement !== fromRowElement) updateHandModelFromDOM(toRowElement, toRowElement.dataset.rowName);
                    displayCurrentArrangementState();
                }
            }
        };

        if (initialAndMiddleHandElement) {
            sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {
                ...commonSortableOptions, sort: true, group: { name: sharedGroupName, pull: true, put: true }
            });
        }
        if (topRowElement) {
            sortableInstances.top = new Sortable(topRowElement, {
                ...commonSortableOptions, sort: true, group: { name: sharedGroupName, pull: true, put: true }
            });
        }
        if (bottomRowElement) {
            sortableInstances.bottom = new Sortable(bottomRowElement, {
                ...commonSortableOptions, sort: true, group: { name: sharedGroupName, pull: true, put: true }
            });
        }
    }


    // --- Game Logic Functions ---
    // ... (updateHandModelFromDOM, displayCurrentArrangementState, checkDaoshuiForUI, checkAllCardsOrganized, initializeGame)
    // These functions now rely on ui.js's renderCard using images.
    // Their internal logic for managing playerOrganizedHand and calling evaluateHand remains the same.
    // (Full implementations from previous version, just ensure they call the new renderCard implicitly via display functions)

    function updateHandModelFromDOM(rowElement, rowName) { /* ... (no change) ... */ }
    function displayCurrentArrangementState() { /* ... (no change in its core logic, but it will trigger image rendering via renderCard) ... */ }
    function checkDaoshuiForUI(currentMiddleCards) { /* ... (no change) ... */ }
    function checkAllCardsOrganized() { /* ... (no change) ... */ }
    function initializeGame() { /* ... (no change, will clear areas and call displayMessage/displayScore) ... */ }
    // (Full Game Logic Functions from previous version of main.js)
    function updateHandModelFromDOM(rowElement, rowName) {
        if (!rowElement || !rowName) return;
        const cardsInRow = Array.from(rowElement.children)
            .map(cardDiv => cardDiv.cardData) // Relies on cardData being attached in renderCard
            .filter(Boolean);

        if (rowName === 'top') {
            playerOrganizedHand.top = cardsInRow;
        } else if (rowName === 'bottom') {
            playerOrganizedHand.bottom = cardsInRow;
        }
        // 'initial_middle' is handled by reading initialAndMiddleHandElement directly when needed
    }

    function displayCurrentArrangementState() {
        const topCards = playerOrganizedHand.top;
        if (topEvalTextElement) {
            const topEval = (typeof evaluateHand === 'function' && topCards.length === 3) ? evaluateHand(topCards) : { message: '' };
            topEvalTextElement.textContent = topCards.length > 0 ? ` (${topEval.message || '未完成'})` : '';
        }

        const bottomCards = playerOrganizedHand.bottom;
        if (bottomEvalTextElement) {
            const bottomEval = (typeof evaluateHand === 'function' && bottomCards.length === 5) ? evaluateHand(bottomCards) : { message: '' };
            bottomEvalTextElement.textContent = bottomCards.length > 0 ? ` (${bottomEval.message || '未完成'})` : '';
        }

        const cardsInInitialMiddle = Array.from(initialAndMiddleHandElement.children)
                                       .map(cardDiv => cardDiv.cardData)
                                       .filter(Boolean);
        const isMiddleReadyConceptually = topCards.length === 3 && bottomCards.length === 5 && cardsInInitialMiddle.length === 5;

        if (middleHandHeader && middleEvalTextElement) {
            if (isMiddleReadyConceptually) {
                middleHandHeader.innerHTML = `中道 (5张): <span id="middle-eval-text"></span>`;
                const middleEval = (typeof evaluateHand === 'function') ? evaluateHand(cardsInInitialMiddle) : { message: '评价中...'};
                document.getElementById('middle-eval-text').textContent = ` (${middleEval.message || '计算中...'})`;
                initialAndMiddleHandElement.classList.add('is-middle-row-style');
            } else {
                middleHandHeader.innerHTML = `我的手牌 / 中道 (剩余牌): <span id="middle-eval-text"></span>`;
                document.getElementById('middle-eval-text').textContent = cardsInInitialMiddle.length > 0 ? ` (共${cardsInInitialMiddle.length}张)` : '';
                initialAndMiddleHandElement.classList.remove('is-middle-row-style');
            }
        }
        if (typeof checkDaoshuiForUI === 'function') checkDaoshuiForUI(cardsInInitialMiddle);
    }

    function checkDaoshuiForUI(currentMiddleCards) {
        const topCards = playerOrganizedHand.top;
        const bottomCards = playerOrganizedHand.bottom;

        if (typeof evaluateHand !== 'function' || typeof checkDaoshui !== 'function') return;

        if (topCards.length === 3 && bottomCards.length === 5 && currentMiddleCards.length === 5) {
            const topEval = evaluateHand(topCards);
            const middleEval = evaluateHand(currentMiddleCards);
            const bottomEval = evaluateHand(bottomCards);
            const daoshuiOccurred = checkDaoshui(topEval, middleEval, bottomEval);

            [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
                if (el) daoshuiOccurred ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning');
            });

            if (daoshuiOccurred && typeof displayMessage === 'function') {
                displayMessage("警告: 检测到倒水！请调整牌型。", true);
            } else if (typeof displayMessage === 'function' && confirmOrganizationButton.disabled) {
                displayMessage("请继续理牌...", false);
            }
        } else {
            [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
                if (el) el.classList.remove('daoshui-warning');
            });
        }
    }

    function checkAllCardsOrganized() {
        const cardsInInitialMiddleCount = initialAndMiddleHandElement.children.length;
        const topOk = playerOrganizedHand.top.length === 3;
        const bottomOk = playerOrganizedHand.bottom.length === 5;
        const middleOkViaInitial = cardsInInitialMiddleCount === 5;

        if (topOk && bottomOk && middleOkViaInitial) {
            confirmOrganizationButton.disabled = false;
            if (typeof displayMessage === 'function') displayMessage("牌型已分配完毕，请点击“确认理牌”。", false);
        } else {
            confirmOrganizationButton.disabled = true;
        }
    }
    function initializeGame() {
        playerFullHandSource = [];
        playerOrganizedHand = { top: [], middle: [], bottom: [] };

        [topRowElement, bottomRowElement].forEach(el => { if (el) el.innerHTML = ''; });
        if (initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML = '<p>点击 "发牌" 开始</p>';

        if (topEvalTextElement) topEvalTextElement.textContent = '';
        if (middleEvalTextElement) middleEvalTextElement.textContent = '';
        if (bottomEvalTextElement) bottomEvalTextElement.textContent = '';
        if (middleHandHeader) middleHandHeader.innerHTML = `我的手牌 / 中道 (剩余牌): <span id="middle-eval-text"></span>`;

        [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
            if (el) el.classList.remove('daoshui-warning', 'is-middle-row-style');
        });

        if (typeof displayMessage === 'function') displayMessage("点击“发牌”开始新游戏。");
        if (typeof displayScore === 'function') displayScore("");

        dealButton.disabled = false;
        confirmOrganizationButton.style.display = 'none';
        confirmOrganizationButton.disabled = true;
        compareButton.style.display = 'none';
        console.log("Game Initialized.");
    }


    // --- Event Listeners ---
    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked ---");
        initializeGame();
        if (typeof displayMessage === 'function') displayMessage("正在从服务器获取手牌...", false);
        dealButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}deal_cards.php`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`获取手牌失败: ${response.status} ${response.statusText}. ${errorText}`);
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.cards) || data.cards.length !== 13) {
                throw new Error("从服务器获取的手牌数据格式不正确。");
            }

            // Backend should ideally send rank (A, K, Q, J, 10, ...) and suitKey (SPADES, HEARTS, ...)
            // The getCardImagePath function in game.js will handle mapping these to filenames.
            playerFullHandSource = data.cards.map(cardFromServer => {
                // Add any missing properties needed by renderCard or game logic if not sent by backend
                // For image display, 'rank' and 'suitKey' are primary.
                // 'id' is good for DOM element identification.
                return {
                    rank: cardFromServer.rank, // e.g., "A", "10", "K"
                    suitKey: cardFromServer.suitKey, // e.g., "SPADES", "HEARTS"
                    // These might be redundant if backend sends them and they match game.js SUITS_DATA
                    displaySuitChar: (typeof SUITS_DATA !== 'undefined' && SUITS_DATA[cardFromServer.suitKey]) ? SUITS_DATA[cardFromServer.suitKey].displayChar : '?',
                    suitCssClass: (typeof SUITS_DATA !== 'undefined' && SUITS_DATA[cardFromServer.suitKey]) ? SUITS_DATA[cardFromServer.suitKey].cssClass : 'unknown',
                    id: cardFromServer.rank + cardFromServer.suitKey // Construct a simple ID
                };
            }).filter(Boolean);


            initialAndMiddleHandElement.innerHTML = ''; // Clear placeholder
            playerFullHandSource.forEach(card => {
                if (card && typeof renderCard === 'function') { // renderCard is from ui.js
                    initialAndMiddleHandElement.appendChild(renderCard(card, true)); // true for face up
                }
            });

            displayCurrentArrangementState();
            if (typeof displayMessage === 'function') displayMessage("请理牌！将手牌拖拽到头道和尾道。");
            confirmOrganizationButton.style.display = 'inline-block';

        } catch (error) {
            console.error("发牌过程中发生错误:", error);
            if (typeof displayMessage === 'function') displayMessage(`错误: ${error.message}`, true);
            dealButton.disabled = false;
        }
    });

    confirmOrganizationButton.addEventListener('click', () => { /* ... (no change for image display logic) ... */ });
    compareButton.addEventListener('click', async () => { /* ... (no change for image display logic) ... */ });
    callBackendButton.addEventListener('click', async () => { /* ... (no change for image display logic) ... */ });
    // (Full Event Listener implementations from previous version of main.js)
     confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- Confirm Organization Button Clicked ---");
        playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children)
                                       .map(cardDiv => cardDiv.cardData)
                                       .filter(Boolean);

        if (playerOrganizedHand.top.length !== 3 ||
            playerOrganizedHand.middle.length !== 5 ||
            playerOrganizedHand.bottom.length !== 5) {
            if (typeof displayMessage === 'function') {
                displayMessage(
                    `牌数不正确！头道: ${playerOrganizedHand.top.length}/3, 中道: ${playerOrganizedHand.middle.length}/5, 尾道: ${playerOrganizedHand.bottom.length}/5.`, true
                );
            }
            return;
        }

        const topEval = (typeof evaluateHand === 'function') ? evaluateHand(playerOrganizedHand.top) : {};
        const middleEval = (typeof evaluateHand === 'function') ? evaluateHand(playerOrganizedHand.middle) : {};
        const bottomEval = (typeof evaluateHand === 'function') ? evaluateHand(playerOrganizedHand.bottom) : {};

        if (middleHandHeader && middleEvalTextElement) {
             middleHandHeader.innerHTML = `中道 (5张): <span id="middle-eval-text"></span>`;
             document.getElementById('middle-eval-text').textContent = ` (${middleEval.message || '未知'})`;
             initialAndMiddleHandElement.classList.add('is-middle-row-style');
        }

        if (typeof checkDaoshui === 'function' && checkDaoshui(topEval, middleEval, bottomEval)) {
            if (typeof displayMessage === 'function') displayMessage("警告: 倒水！请重新理牌或确认。", true);
            [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
                if (el) el.classList.add('daoshui-warning');
            });
        } else {
            if (typeof displayMessage === 'function') displayMessage("理牌完成，可以比牌了！");
            [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
                if (el) el.classList.remove('daoshui-warning');
            });
        }

        confirmOrganizationButton.style.display = 'none';
        compareButton.style.display = 'inline-block';
        compareButton.disabled = false;
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- Compare Button Clicked ---");
        if (typeof displayMessage === 'function') displayMessage("正在提交牌型到服务器进行比牌...", false);
        compareButton.disabled = true;

        if (playerOrganizedHand.middle.length !== 5) {
             playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children)
                                       .map(cardDiv => cardDiv.cardData)
                                       .filter(Boolean);
        }

        const payload = {
            top: playerOrganizedHand.top.map(c => ({ rank: c.rank, suitKey: c.suitKey })),
            middle: playerOrganizedHand.middle.map(c => ({ rank: c.rank, suitKey: c.suitKey })),
            bottom: playerOrganizedHand.bottom.map(c => ({ rank: c.rank, suitKey: c.suitKey }))
        };

        if (payload.top.length !== 3 || payload.middle.length !== 5 || payload.bottom.length !== 5) {
            if (typeof displayMessage === 'function') displayMessage("错误: 提交的牌墩数量不正确。请重新开始游戏。", true);
            compareButton.style.display = 'none';
            dealButton.disabled = false;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}submit_hand.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`比牌请求失败: ${response.status} ${response.statusText}. ${errorText}`);
            }
            const result = await response.json();
            console.log("服务器比牌结果:", result);

            if (typeof displayMessage === 'function') {
                if (result.success) {
                    let resultMessage = `服务器: ${result.message || '处理完成.'}`;
                    if (result.daoshui) resultMessage += " (判定为倒水)";
                    displayMessage(resultMessage, result.daoshui);
                } else {
                    displayMessage(`服务器错误: ${result.message || '处理牌型失败.'}`, true);
                }
            }
            if (typeof displayScore === 'function' && typeof result.score !== 'undefined') {
                displayScore(`得分: ${result.score}`);
            }
        } catch (error) {
            console.error("提交牌型或比牌时发生错误:", error);
            if (typeof displayMessage === 'function') displayMessage(`错误: ${error.message}`, true);
        } finally {
            dealButton.disabled = false;
            compareButton.style.display = 'none';
        }
    });
    callBackendButton.addEventListener('click', async () => { /* ... */ });


    // --- Initial Game Setup ---
    initializeGame();
    initializeSortable();
});
