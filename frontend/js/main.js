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
    const middleEvalTextElement = document.getElementById('middle-eval-text'); // Ensure this exists
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');


    // --- Configuration ---
    // IMPORTANT: Replace with your actual serv00 backend URL
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';

    // --- Game State ---
    let playerFullHandSource = []; // Cards directly from server, before any organization
    let playerOrganizedHand = {
        top: [],
        middle: [], // Will be populated from initialAndMiddleHandElement at confirmation
        bottom: []
    };
    let sortableInstances = {};

    const MAX_SORTABLE_INIT_ATTEMPTS = 10;
    let sortableInitializationAttempts = 0;
    const SORTABLE_INIT_DELAY = 200;

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) {
                setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            } else {
                console.error("SortableJS library failed to load after multiple attempts!");
                displayMessage("错误：拖拽功能加载失败，请刷新页面重试。", true);
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
                    if (toRowElement.children.length >= rowLimit) {
                        return false; // Prevent adding to a full row
                    }
                }
                return true;
            },
            onAdd: function(evt) { // Fallback if onMove doesn't catch it (e.g. fast drag)
                const toRowElement = evt.to;
                const fromRowElement = evt.from;
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);
                 if (rowLimit && toRowElement.children.length > rowLimit) {
                    // Item was added, making it over limit. Move it back.
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item); // Remove from target
                    fromRowElement.appendChild(evt.item); // Add back to source
                    displayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : '尾'}道已满! 卡片已退回。`, true);
                    // Update models after programmatic move
                    updateHandModelFromDOM(fromRowElement, fromRowElement.dataset.rowName);
                    if (toRowElement !== fromRowElement) {
                         updateHandModelFromDOM(toRowElement, toRowElement.dataset.rowName);
                    }
                    displayCurrentArrangementState(); // Refresh UI
                }
            }
        };

        if (initialAndMiddleHandElement) {
            sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {
                ...commonSortableOptions,
                sort: true, // Allow sorting within this area
                group: { name: sharedGroupName, pull: true, put: true } // Can pull from and put into
            });
        }
        if (topRowElement) {
            sortableInstances.top = new Sortable(topRowElement, {
                ...commonSortableOptions,
                sort: true,
                group: { name: sharedGroupName, pull: true, put: true }
            });
        }
        if (bottomRowElement) {
            sortableInstances.bottom = new Sortable(bottomRowElement, {
                ...commonSortableOptions,
                sort: true,
                group: { name: sharedGroupName, pull: true, put: true }
            });
        }
    }

    function updateHandModelFromDOM(rowElement, rowName) {
        if (!rowElement || !rowName) return;
        const cardsInRow = Array.from(rowElement.children)
            .map(cardDiv => cardDiv.cardData)
            .filter(Boolean);

        if (rowName === 'top') {
            playerOrganizedHand.top = cardsInRow;
        } else if (rowName === 'bottom') {
            playerOrganizedHand.bottom = cardsInRow;
        } else if (rowName === 'initial_middle') {
            // This area's cards are not directly assigned to playerOrganizedHand.middle yet.
            // That happens at confirmation. For UI, we read its content directly.
        }
    }

    function displayCurrentArrangementState() {
        // Update Top Row Evaluation
        const topCards = playerOrganizedHand.top;
        if (topEvalTextElement) {
            const topEval = topCards.length === 3 ? evaluateHand(topCards) : { message: '' };
            topEvalTextElement.textContent = topCards.length > 0 ? ` (${topEval.message || '未完成'})` : '';
        }

        // Update Bottom Row Evaluation
        const bottomCards = playerOrganizedHand.bottom;
        if (bottomEvalTextElement) {
            const bottomEval = bottomCards.length === 5 ? evaluateHand(bottomCards) : { message: '' };
            bottomEvalTextElement.textContent = bottomCards.length > 0 ? ` (${bottomEval.message || '未完成'})` : '';
        }

        // Update Middle (from initialAndMiddleHandElement) Row Evaluation and Header
        const cardsInInitialMiddle = Array.from(initialAndMiddleHandElement.children)
                                       .map(cardDiv => cardDiv.cardData)
                                       .filter(Boolean);
        const isMiddleReadyConceptually = topCards.length === 3 && bottomCards.length === 5 && cardsInInitialMiddle.length === 5;

        if (middleHandHeader && middleEvalTextElement) {
            if (isMiddleReadyConceptually) {
                middleHandHeader.innerHTML = `中道 (5张): <span id="middle-eval-text"></span>`; // Re-target span
                const middleEval = evaluateHand(cardsInInitialMiddle);
                document.getElementById('middle-eval-text').textContent = ` (${middleEval.message || '计算中...'})`; // Update new span
                initialAndMiddleHandElement.classList.add('is-middle-row-style'); // Add class for styling
            } else {
                middleHandHeader.innerHTML = `我的手牌 / 中道 (剩余牌): <span id="middle-eval-text"></span>`;
                document.getElementById('middle-eval-text').textContent = cardsInInitialMiddle.length > 0 ? ` (共${cardsInInitialMiddle.length}张)` : '';
                initialAndMiddleHandElement.classList.remove('is-middle-row-style');
            }
        }
        checkDaoshuiForUI(cardsInInitialMiddle); // Pass current middle cards
    }

    function checkDaoshuiForUI(currentMiddleCards) {
        const topCards = playerOrganizedHand.top;
        const bottomCards = playerOrganizedHand.bottom;

        // Only perform check if all conceptual rows have the correct number of cards
        if (topCards.length === 3 && bottomCards.length === 5 && currentMiddleCards.length === 5) {
            const topEval = evaluateHand(topCards);
            const middleEval = evaluateHand(currentMiddleCards);
            const bottomEval = evaluateHand(bottomCards);

            const daoshuiOccurred = checkDaoshui(topEval, middleEval, bottomEval);

            [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
                if (el) daoshuiOccurred ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning');
            });

            if (daoshuiOccurred) {
                displayMessage("警告: 检测到倒水！请调整牌型。", true);
            } else {
                // Clear message if not daoshui and confirm button isn't active yet (meaning user is still arranging)
                if (confirmOrganizationButton.disabled) displayMessage("请继续理牌...", false);
            }
        } else {
            // Clear warnings if card counts are not met for a full check
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
            displayMessage("牌型已分配完毕，请点击“确认理牌”。", false);
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

        displayMessage("点击“发牌”开始新游戏。");
        displayScore("");

        dealButton.disabled = false;
        confirmOrganizationButton.style.display = 'none';
        confirmOrganizationButton.disabled = true;
        compareButton.style.display = 'none';
        console.log("Game Initialized.");
    }

    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked ---");
        initializeGame(); // Reset game state and UI before dealing
        displayMessage("正在从服务器获取手牌...", false);
        dealButton.disabled = true; // Disable deal button immediately

        try {
            const response = await fetch(`${API_BASE_URL}/deal_cards.php`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`获取手牌失败: ${response.status} ${response.statusText}. ${errorText}`);
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.cards) || data.cards.length !== 13) {
                throw new Error("从服务器获取的手牌数据格式不正确。");
            }

            playerFullHandSource = data.cards.map(cardFromServer => ({
                ...cardFromServer,
                displaySuitChar: SUITS_DATA[cardFromServer.suitKey].displayChar,
                suitCssClass: SUITS_DATA[cardFromServer.suitKey].cssClass,
                id: cardFromServer.rank + cardFromServer.suitKey // Ensure unique ID for DOM
            })).filter(Boolean);

            initialAndMiddleHandElement.innerHTML = ''; // Clear placeholder
            playerFullHandSource.forEach(card => {
                if (card) initialAndMiddleHandElement.appendChild(renderCard(card));
            });

            displayCurrentArrangementState(); // Initial display after cards are dealt
            displayMessage("请理牌！将手牌拖拽到头道和尾道。");
            confirmOrganizationButton.style.display = 'inline-block'; // Show confirm button
            // Confirm button remains disabled until checkAllCardsOrganized enables it.

        } catch (error) {
            console.error("发牌过程中发生错误:", error);
            displayMessage(`错误: ${error.message}`, true);
            dealButton.disabled = false; // Re-enable deal on error
        }
    });

    confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- Confirm Organization Button Clicked ---");
        // Populate playerOrganizedHand.middle from what's left in initialAndMiddleHandElement
        playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children)
                                       .map(cardDiv => cardDiv.cardData)
                                       .filter(Boolean);

        if (playerOrganizedHand.top.length !== 3 ||
            playerOrganizedHand.middle.length !== 5 ||
            playerOrganizedHand.bottom.length !== 5) {
            displayMessage(
                `牌数不正确！头道: ${playerOrganizedHand.top.length}/3, 中道: ${playerOrganizedHand.middle.length}/5, 尾道: ${playerOrganizedHand.bottom.length}/5.`, true
            );
            return;
        }

        const topEval = evaluateHand(playerOrganizedHand.top);
        const middleEval = evaluateHand(playerOrganizedHand.middle);
        const bottomEval = evaluateHand(playerOrganizedHand.bottom);

        // Final UI update for middle道 as confirmed
        if (middleHandHeader && middleEvalTextElement) {
             middleHandHeader.innerHTML = `中道 (5张): <span id="middle-eval-text"></span>`;
             document.getElementById('middle-eval-text').textContent = ` (${middleEval.message || '未知'})`;
             initialAndMiddleHandElement.classList.add('is-middle-row-style');
        }


        if (checkDaoshui(topEval, middleEval, bottomEval)) {
            displayMessage("警告: 倒水！请重新理牌或确认。", true);
             // Add daoshui warnings again if they were cleared
            [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
                if (el) el.classList.add('daoshui-warning');
            });
        } else {
            displayMessage("理牌完成，可以比牌了！");
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
        displayMessage("正在提交牌型到服务器进行比牌...", false);
        compareButton.disabled = true;

        // playerOrganizedHand.middle should be correctly populated by confirmOrganizationButton
        // but as a safeguard, we can re-verify or re-populate if needed, though it shouldn't be.
        if (playerOrganizedHand.middle.length !== 5) {
             console.warn("Compare button clicked but middle hand not 5 cards in model. Re-evaluating from DOM.");
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
            displayMessage("错误: 提交的牌墩数量不正确。请重新开始游戏。", true);
            compareButton.style.display = 'none';
            dealButton.disabled = false;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/submit_hand.php`, {
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

            if (result.success) {
                let resultMessage = `服务器: ${result.message || '处理完成.'}`;
                if (result.daoshui) {
                    resultMessage += " (判定为倒水)";
                    displayMessage(resultMessage, true);
                } else {
                    displayMessage(resultMessage, false);
                }
                if (typeof result.score !== 'undefined') displayScore(`得分: ${result.score}`);
            } else {
                displayMessage(`服务器错误: ${result.message || '处理牌型失败.'}`, true);
                if (typeof result.score !== 'undefined') displayScore(`得分: ${result.score}`);
            }
        } catch (error) {
            console.error("提交牌型或比牌时发生错误:", error);
            displayMessage(`错误: ${error.message}`, true);
        } finally {
            dealButton.disabled = false; // Allow new game
            compareButton.style.display = 'none'; // Hide compare button
        }
    });

    callBackendButton.addEventListener('click', async () => {
        displayMessage("正在测试后端通讯...", false);
        try {
            const testEndpoint = `${API_BASE_URL}/deal_cards.php`;
            const response = await fetch(testEndpoint);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            let message = "后端通讯成功！";
            if(data && data.cards && data.cards.length > 0) message += ` (后端返回 ${data.cards.length} 张牌)`
            else if(data && data.message) message += ` 后端消息: ${data.message}`;
            displayMessage(message, false);
            console.log("Backend test response:", data);
        } catch (error) {
            console.error("后端通讯测试失败:", error);
            displayMessage(`后端通讯测试失败: ${error.message}`, true);
        }
    });

    // --- Initial Setup ---
    initializeGame();
    initializeSortable();
});
