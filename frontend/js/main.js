// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button'); // For testing

    const initialHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const middleRowElement = document.getElementById('player-middle-row');
    const bottomRowElement = document.getElementById('player-bottom-row');

    // --- Configuration ---
    // IMPORTANT: Replace with your actual serv00 backend URL
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/'; // e.g., http://user123.serv00.net/十三水后端

    // --- Game State ---
    let playerRawHand = []; // Cards directly from server
    let playerOrganizedHand = { // Cards placed by player in rows
        top: [],
        middle: [],
        bottom: []
    };
    let sortableInstances = {}; // To store SortableJS instances

    // --- SortableJS Initialization ---
    const MAX_SORTABLE_INIT_ATTEMPTS = 10;
    let sortableInitializationAttempts = 0;
    const SORTABLE_INIT_DELAY = 200;

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) {
                // console.warn(`SortableJS not loaded. Retrying attempt ${sortableInitializationAttempts}...`);
                setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            } else {
                console.error("SortableJS library failed to load after multiple attempts!");
                displayMessage("错误：拖拽功能加载失败，请刷新页面重试。", true);
            }
            return;
        }

        // console.log("SortableJS library loaded. Initializing sortable areas...");
        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = {
            group: sharedGroupName,
            animation: 150,
            ghostClass: 'sortable-ghost', // Class for the drop placeholder
            chosenClass: 'sortable-chosen', // Class for the chosen item
            dragClass: 'sortable-drag',   // Class for the dragging item
            onEnd: function (evt) { // Called when a drag-and-drop operation ends
                // Update data model for both source and destination lists
                updateHandModelFromDOM(evt.from, evt.from.dataset.rowName);
                if (evt.to !== evt.from) {
                    updateHandModelFromDOM(evt.to, evt.to.dataset.rowName);
                }
                // After model update, re-render organized hand to show evaluations and check daoshui
                displayOrganizedHand(playerOrganizedHand);
                checkAllCardsOrganized(); // Check if ready for confirm button
            },
            onMove: function (evt) { // Called when an item is moved into another list or sorted in its own
                const toRowElement = evt.to;
                const fromRowElement = evt.from;
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);

                // If moving to a row with a limit and it's not the same row
                if (rowLimit && toRowElement !== fromRowElement) {
                    if (toRowElement.children.length >= rowLimit) {
                        // displayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : toRowElement.dataset.rowName === 'middle' ? '中' : '尾'}道已满!`, true);
                        // setTimeout(() => displayMessage(''), 1500);
                        return false; // Prevent adding to a full row
                    }
                }
                return true; // Allow move
            },
            onAdd: function(evt) { // Called when an item is dropped into a new list
                const toRowElement = evt.to;
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);
                 if (rowLimit && toRowElement.children.length > rowLimit) {
                    // This is a fallback, onMove should ideally prevent this.
                    // If an item is added making it exceed limit, move it back.
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item); // Remove the item
                    evt.from.appendChild(evt.item); // Add it back to original list
                    displayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : toRowElement.dataset.rowName === 'middle' ? '中' : '尾'}道已满! 卡片已退回。`, true);
                    updateHandModelFromDOM(evt.from, evt.from.dataset.rowName); // Update source model
                    if (evt.to !== evt.from) {
                         updateHandModelFromDOM(evt.to, evt.to.dataset.rowName); // Update target model
                    }
                }
            }
        };

        if (initialHandElement) sortableInstances.initial = new Sortable(initialHandElement, { ...commonSortableOptions, sort: true });
        if (topRowElement) sortableInstances.top = new Sortable(topRowElement, { ...commonSortableOptions, sort: true, group: { name: sharedGroupName, put: true } });
        if (middleRowElement) sortableInstances.middle = new Sortable(middleRowElement, { ...commonSortableOptions, sort: true, group: { name: sharedGroupName, put: true } });
        if (bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, { ...commonSortableOptions, sort: true, group: { name: sharedGroupName, put: true } });
        // console.log("SortableJS instances initialized:", sortableInstances);
    }

    /**
     * Updates the JavaScript data model based on the current DOM state of cards.
     * @param {HTMLElement} rowElement - The DOM element representing the row/hand area.
     * @param {string} rowName - The name of the row ('initial', 'top', 'middle', 'bottom').
     */
    function updateHandModelFromDOM(rowElement, rowName) {
        if (!rowElement || !rowName) return;

        const cardsInRow = Array.from(rowElement.children)
            .map(cardDiv => cardDiv.cardData) // cardData was attached in ui.js/renderCard
            .filter(Boolean); // Remove any undefined if cardData wasn't found

        if (rowName === 'initial') {
            playerRawHand = cardsInRow; // This should be player's unorganized hand
        } else if (playerOrganizedHand.hasOwnProperty(rowName)) {
            playerOrganizedHand[rowName] = cardsInRow;
        }
        // console.log(`Model updated for ${rowName}:`, cardsInRow.map(c=>c.rank+c.displaySuitChar));
    }

    /**
     * Checks if all 13 cards are in the organized rows and have correct counts.
     * Enables/disables the 'Confirm Organization' button.
     */
    function checkAllCardsOrganized() {
        const topOk = playerOrganizedHand.top.length === 3;
        const middleOk = playerOrganizedHand.middle.length === 5;
        const bottomOk = playerOrganizedHand.bottom.length === 5;
        const initialEmpty = playerRawHand.length === 0; // All cards moved from initial hand

        if (topOk && middleOk && bottomOk && initialEmpty) {
            confirmOrganizationButton.disabled = false;
            displayMessage("牌型已分配完毕，请确认。", false);
        } else {
            confirmOrganizationButton.disabled = true;
        }
    }


    // --- Game Flow Functions ---
    function initializeGame() {
        playerRawHand = [];
        playerOrganizedHand = { top: [], middle: [], bottom: [] };

        displayInitialHand([]); // Clear initial hand display
        displayOrganizedHand(playerOrganizedHand); // Clear organized rows display
        displayMessage("点击“发牌”开始新游戏。");
        displayScore(""); // Clear score

        dealButton.disabled = false;
        confirmOrganizationButton.style.display = 'none'; // Hide until cards are dealt
        confirmOrganizationButton.disabled = true;
        compareButton.style.display = 'none'; // Hide until organization is confirmed
        console.log("Game Initialized.");
    }

    // --- Event Listeners ---
    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked ---");
        displayMessage("正在从服务器获取手牌...", false);
        dealButton.disabled = true;
        confirmOrganizationButton.style.display = 'inline-block';
        confirmOrganizationButton.disabled = true; // Disabled until cards are organized
        compareButton.style.display = 'none';
        displayScore(""); // Clear previous score

        try {
            const response = await fetch(`${API_BASE_URL}/deal_cards.php`);
            if (!response.ok) {
                const errorText = await response.text(); // Try to get more error info
                throw new Error(`获取手牌失败: ${response.status} ${response.statusText}. ${errorText}`);
            }
            const data = await response.json();

            if (!data || !Array.isArray(data.cards) || data.cards.length !== 13) {
                throw new Error("从服务器获取的手牌数据格式不正确。");
            }

            // Ensure cards from backend have all necessary properties for UI
            playerRawHand = data.cards.map(cardFromServer => {
                // Assuming backend sends: rank, suitKey, displaySuitChar, suitCssClass
                // If not, augment here using SUITS_DATA from game.js
                if (!SUITS_DATA[cardFromServer.suitKey]) {
                    console.warn("Card from server has unknown suitKey:", cardFromServer);
                    // Fallback or skip card
                    return null;
                }
                return {
                    ...cardFromServer, // rank, suitKey
                    displaySuitChar: SUITS_DATA[cardFromServer.suitKey].displayChar,
                    suitCssClass: SUITS_DATA[cardFromServer.suitKey].cssClass,
                    id: cardFromServer.rank + cardFromServer.suitKey
                };
            }).filter(Boolean); // remove any nulls from bad data

            playerOrganizedHand = { top: [], middle: [], bottom: [] }; // Reset organized hand

            displayInitialHand(playerRawHand);
            displayOrganizedHand(playerOrganizedHand); // Clear and display empty rows

            displayMessage("请理牌！将手牌拖拽到上方牌道。");

        } catch (error) {
            console.error("发牌过程中发生错误:", error);
            displayMessage(`错误: ${error.message}`, true);
            dealButton.disabled = false; // Re-enable deal button on error
            confirmOrganizationButton.style.display = 'none';
        }
    });

    confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- Confirm Organization Button Clicked ---");
        // Final check for card counts
        if (playerOrganizedHand.top.length !== 3 ||
            playerOrganizedHand.middle.length !== 5 ||
            playerOrganizedHand.bottom.length !== 5 ||
            playerRawHand.length !== 0) {
            displayMessage(
                `牌数不正确或有牌未分配！头道: ${playerOrganizedHand.top.length}/3, 中道: ${playerOrganizedHand.middle.length}/5, 尾道: ${playerOrganizedHand.bottom.length}/5. 初始手牌区剩余: ${playerRawHand.length}`,
                 true
            );
            return;
        }

        // Client-side daoshui check
        const topEval = evaluateHand(playerOrganizedHand.top);
        const middleEval = evaluateHand(playerOrganizedHand.middle);
        const bottomEval = evaluateHand(playerOrganizedHand.bottom);

        if (checkDaoshui(topEval, middleEval, bottomEval)) {
            displayMessage("警告: 倒水！请重新理牌或确认。", true);
            // Still allow to proceed to compare, server will make final call
        } else {
            displayMessage("理牌完成，可以比牌了！");
        }

        confirmOrganizationButton.style.display = 'none';
        compareButton.style.display = 'inline-block';
        compareButton.disabled = false;
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- Compare Button Clicked ---");
        displayMessage("正在提交牌型到服务器进行比牌...", false);
        compareButton.disabled = true;

        const payload = {
            // Send only essential data (rank, suitKey) unless backend expects full objects
            top: playerOrganizedHand.top.map(c => ({ rank: c.rank, suitKey: c.suitKey })),
            middle: playerOrganizedHand.middle.map(c => ({ rank: c.rank, suitKey: c.suitKey })),
            bottom: playerOrganizedHand.bottom.map(c => ({ rank: c.rank, suitKey: c.suitKey }))
        };

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

            const result = await response.json(); // Expected: { success: bool, message: string, score: num, daoshui?: bool, details?: obj }
            console.log("服务器比牌结果:", result);

            if (result.success) {
                let resultMessage = `服务器: ${result.message || '处理完成.'}`;
                if (result.daoshui) {
                    resultMessage += " (判定为倒水)";
                    displayMessage(resultMessage, true);
                } else {
                    displayMessage(resultMessage, false);
                }
                if (typeof result.score !== 'undefined') {
                    displayScore(`得分: ${result.score}`);
                }
                // Optionally display more details from result.details
            } else {
                displayMessage(`服务器错误: ${result.message || '处理牌型失败.'}`, true);
                 if (typeof result.score !== 'undefined') { // Even on failure, if score is sent
                    displayScore(`得分: ${result.score}`);
                }
            }

        } catch (error) {
            console.error("提交牌型或比牌时发生错误:", error);
            displayMessage(`错误: ${error.message}`, true);
        } finally {
            // After comparison, allow new game
            dealButton.disabled = false;
            compareButton.style.display = 'none'; // Hide compare button
        }
    });

    callBackendButton.addEventListener('click', async () => {
        displayMessage("正在测试后端通讯...", false);
        try {
            // Use a simple GET endpoint on your backend for this test if deal_cards.php is complex
            const testEndpoint = `${API_BASE_URL}/deal_cards.php`; // or a dedicated test PHP file
            const response = await fetch(testEndpoint);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }
            const data = await response.json(); // Assuming your test endpoint returns JSON
            let message = "后端通讯成功！";
            if(data && data.cards && data.cards.length > 0) message += ` (收到了 ${data.cards.length} 张测试牌)`
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
