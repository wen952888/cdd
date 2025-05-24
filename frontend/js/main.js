// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Your existing elements) ---
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

    // --- Configuration (Your existing config) ---
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/'; // Example from previous

    // --- Game State (Your existing state) ---
    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};

    // --- SortableJS Initialization (Your existing init) ---
    const MAX_SORTABLE_INIT_ATTEMPTS = 10;
    let sortableInitializationAttempts = 0;
    const SORTABLE_INIT_DELAY = 200;

    function initializeSortable() {
        // ... (Your existing SortableJS initialization code remains here) ...
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
                    displayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : '尾'}道已满! 卡片已退回。`, true);
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

    // --- Game Logic Functions (Your existing functions) ---
    function updateHandModelFromDOM(rowElement, rowName) { /* ... */ }
    function displayCurrentArrangementState() { /* ... */ }
    function checkDaoshuiForUI(currentMiddleCards) { /* ... */ }
    function checkAllCardsOrganized() { /* ... */ }
    function initializeGame() { /* ... */ }

    // --- Event Listeners (Your existing listeners) ---
    dealButton.addEventListener('click', async () => { /* ... */ });
    confirmOrganizationButton.addEventListener('click', () => { /* ... */ });
    compareButton.addEventListener('click', async () => { /* ... */ });
    callBackendButton.addEventListener('click', async () => { /* ... */ });


    // --- START: SCREEN ORIENTATION HANDLING LOGIC ---
    const ORIENTATION_MESSAGE_ID = 'orientation-message-overlay';

    async function attemptLockToLandscape() {
        try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                await screen.orientation.lock('landscape-primary'); // or 'landscape'
                console.log('Screen orientation lock attempted to landscape.');
                return true;
            } else if (screen.lockOrientation) {
                screen.lockOrientation('landscape-primary');
                console.log('Screen orientation lock attempted (deprecated API).');
                return true;
            } // Add other browser-specific prefixes if needed (mozLockOrientation, msLockOrientation)
            console.warn('Screen Orientation API lock function not available.');
            return false;
        } catch (error) {
            console.error('Failed to lock screen orientation:', error);
            return false; // Lock failed
        }
    }

    function showRotationMessageOverlay() {
        let messageDiv = document.getElementById(ORIENTATION_MESSAGE_ID);
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = ORIENTATION_MESSAGE_ID;
            // SVG for rotation icon (simple one)
            const svgIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style="margin-bottom: 15px; animation: rotateDeviceIcon 2s infinite ease-in-out;">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M7.99 4.01C7.99 2.9 7.1 2 6 2S4.01 2.9 4.01 4.01v15.98c0 1.1.9 2 1.99 2s2-.9 2-2V4.01zm8.01 0V12h-4V4.01c0-1.1.89-2 2-2s2 .9 2 2zm0 15.98V14h-4v5.99c0 1.1.89 2 2 2s2-.9 2-2zM16 0H8C5.79 0 4 1.79 4 4v16c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V4c0-2.21-1.79-4-4-4z"/>
                </svg>`; // A different icon for "rotate device"
            messageDiv.innerHTML = `
                <div style="padding: 20px; border-radius: 10px; background-color: #2c3e50; max-width: 80vw; text-align:center;">
                    ${svgIcon}
                    <p style="font-size: 1.1em; line-height: 1.5; margin: 0; color: white;">为了获得最佳游戏体验，请将您的设备旋转至横屏模式。</p>
                </div>`;
            document.body.appendChild(messageDiv);

            // Add keyframes for animation if not in CSS
            if (!document.getElementById('rotateDeviceKeyframes')) {
                const styleSheet = document.createElement("style");
                styleSheet.id = 'rotateDeviceKeyframes';
                styleSheet.innerText = `@keyframes rotateDeviceIcon { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-90deg); } }`;
                document.head.appendChild(styleSheet);
            }
        }
        // Apply styles via JS for the overlay itself (or use CSS)
        Object.assign(messageDiv.style, {
            display: 'flex',
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)', color: 'white', zIndex: '10000',
            justifyContent: 'center', alignItems: 'center'
        });
        // Optionally hide game container if overlay is shown
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'none';
    }

    function hideRotationMessageOverlay() {
        const messageDiv = document.getElementById(ORIENTATION_MESSAGE_ID);
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
        // Show game container again
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'flex'; // Assuming it was flex
    }

    function handleDeviceOrientation() {
        // Basic mobile check
        const isLikelyMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isLikelyMobile) {
            hideRotationMessageOverlay(); // Ensure it's hidden on desktop
            return;
        }

        // Check current orientation: screen.orientation for modern browsers, window.orientation for older
        let isPortrait;
        if (screen.orientation && screen.orientation.type) {
            isPortrait = screen.orientation.type.startsWith('portrait');
        } else {
            isPortrait = Math.abs(window.orientation) !== 90; // 0 or 180 for portrait
        }
        // Alternative: window.matchMedia("(orientation: portrait)").matches

        if (isPortrait) {
            console.log("Device is in Portrait mode. Attempting to lock or show message.");
            attemptLockToLandscape().then(locked => {
                if (!locked) { // If lock failed or wasn't attempted by API
                    // Re-check orientation after attempt, as lock might be async
                    if (screen.orientation && screen.orientation.type) {
                        if (screen.orientation.type.startsWith('portrait')) showRotationMessageOverlay();
                        else hideRotationMessageOverlay();
                    } else if (Math.abs(window.orientation) !== 90) {
                        showRotationMessageOverlay();
                    } else {
                         hideRotationMessageOverlay();
                    }
                } else {
                    // If lock was successful, orientationchange event should hide the message
                    // but we can preemptively hide if already landscape
                     if (screen.orientation && screen.orientation.type && screen.orientation.type.startsWith('landscape')) {
                        hideRotationMessageOverlay();
                     } else if (Math.abs(window.orientation) === 90) {
                        hideRotationMessageOverlay();
                     }
                }
            });
        } else { // Landscape mode
            console.log("Device is in Landscape mode.");
            hideRotationMessageOverlay();
        }
    }

    // Initial check on load
    window.addEventListener('load', handleDeviceOrientation);

    // Listen for orientation changes
    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        screen.orientation.addEventListener('change', handleDeviceOrientation);
    } else {
        window.addEventListener('orientationchange', handleDeviceOrientation); // Older API
    }

    // Some browsers (like Safari on iOS) might only allow lock after user interaction or fullscreen.
    // You can try to lock again if the user enters fullscreen mode, for example.
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            console.log("Entered fullscreen, re-attempting landscape lock.");
            handleDeviceOrientation(); // Re-check and attempt lock
        }
    });
    // --- END: SCREEN ORIENTATION HANDLING LOGIC ---


    // --- Initial Game Setup (Your existing setup call) ---
    initializeGame();
    initializeSortable();
    // The orientation handler will be called on 'load' event now.
});

// --- Global Helper Functions (Your existing renderCard, displayMessage, displayScore from ui.js if moved here, or keep in ui.js) ---
// Assuming these are still in ui.js and ui.js is loaded before main.js
// If not, you'd need to define them or ensure they are accessible.
// For simplicity, I am assuming ui.js defines renderCard, displayMessage, displayScore globally or they are imported.
// And game.js defines evaluateHand, checkDaoshui etc.

// Re-add the definitions of ui.js functions here if ui.js is removed or for self-containment
const messageAreaElement = document.getElementById('message-area');
const scoreAreaElement = document.getElementById('score-area');

function renderCard(card) { /* ... (copy from previous ui.js) ... */
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css', card.suitCssClass);
    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;
    cardDiv.id = `card-${card.id || (card.rank + card.suitKey)}`; // Ensure ID
    cardDiv.cardData = card;

    const centerSuitSpan = document.createElement('span');
    centerSuitSpan.classList.add('card-center-suit');
    centerSuitSpan.textContent = card.displaySuitChar;
    cardDiv.appendChild(centerSuitSpan);
    return cardDiv;
}
function displayMessage(message, isError = false) { /* ... (copy from previous ui.js) ... */
    if (!messageAreaElement) return;
    messageAreaElement.textContent = message;
    messageAreaElement.className = 'message-area';
    if (isError) messageAreaElement.classList.add('error');
    else if (message.toLowerCase().includes("backend says:") || message.toLowerCase().includes("服务器"))
         messageAreaElement.classList.add('info');
}
function displayScore(scoreText) { /* ... (copy from previous ui.js) ... */
    if (!scoreAreaElement) return;
    scoreAreaElement.textContent = scoreText;
}

// Dummy SUITS_DATA if not imported from game.js, for renderCard to work with backend data
const SUITS_DATA = {
    SPADES:   { displayChar: "♠", cssClass: "spades" },
    HEARTS:   { displayChar: "♥", cssClass: "hearts" },
    DIAMONDS: { displayChar: "♦", cssClass: "diamonds" },
    CLUBS:    { displayChar: "♣", cssClass: "clubs" },
    UNKNOWN:  { displayChar: "?", cssClass: "unknown" } // Fallback
};
// Dummy evaluateHand and checkDaoshui if not imported from game.js for main.js logic
function evaluateHand(cards) { return { message: (cards && cards.length > 0) ? `评价 (${cards.length}张)` : '未完成' }; }
function checkDaoshui(t,m,b) { return false; }

// Make sure your actual game.js functions (evaluateHand, checkDaoshui) are correctly loaded and accessible.
// The above dummies are just to make this main.js runnable in isolation for the orientation part.
