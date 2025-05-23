// frontend/js/main.js

const dealButton = document.getElementById('deal-button');
const callBackendButton = document.getElementById('call-backend-button');
const compareButton = document.getElementById('compare-button');
const confirmOrganizationButton = document.getElementById('confirm-organization-button');

const API_BASE_URL = 'https://wenge.cloudns.ch'; // 或者你当前的后端地址

let deck = [];
let playerHand = [];
let playerOrganizedHand = {
    top: [],
    middle: [],
    bottom: []
};

// SortableJS 实例
let sortableInitialHand, sortableTopRow, sortableMiddleRow, sortableBottomRow;
// SortableJS 初始化尝试计数和延迟设置
let sortableInitializationAttempts = 0;
const MAX_SORTABLE_INIT_ATTEMPTS = 15; // 增加尝试次数
const SORTABLE_INIT_DELAY = 300;  // 稍微增加延迟

function updateHandModelFromDOM(domElements, rowName) {
    // ... (这个函数保持和上次一样) ...
    console.log(`Updating model for row: ${rowName}. DOM elements count: ${domElements.length}`);
    const cardsData = domElements.map(div => {
        if (!div.cardData) {
            console.warn("DOM element in row lacks cardData:", div);
        }
        return div.cardData;
    }).filter(Boolean);

    if (rowName === 'initial') {
        playerHand = cardsData;
        console.log(`Model updated - playerHand (${playerHand.length} cards):`, JSON.stringify(playerHand.map(c => `${c.rank}${c.displaySuitChar}`)));
    } else if (playerOrganizedHand.hasOwnProperty(rowName)) {
        playerOrganizedHand[rowName] = cardsData;
        console.log(`Model updated - playerOrganizedHand.${rowName} (${playerOrganizedHand[rowName].length} cards):`, JSON.stringify(playerOrganizedHand[rowName].map(c => `${c.rank}${c.displaySuitChar}`)));
    } else {
        console.error("Unknown rowName in updateHandModelFromDOM:", rowName);
    }
}

function initializeSortable() {
    console.log(`Attempting to initialize SortableJS (Attempt ${sortableInitializationAttempts + 1}/${MAX_SORTABLE_INIT_ATTEMPTS})...`);
    if (typeof Sortable !== 'undefined') {
        console.log("SortableJS library is loaded!");
        const sharedGroupName = 'thirteen-water-cards';
        const commonSortableOptions = {
            group: sharedGroupName,
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onStart: function (evt) { console.log('%cDrag Started:', 'color: blue; font-weight: bold;', evt.item.cardData, 'from:', evt.from.dataset.rowName); },
            onChoose: function (evt) { console.log('%cItem Chosen:', 'color: green;', evt.item.cardData); },
            onUnchoose: function (evt) { console.log('%cItem Unchosen:', 'color: gray;', evt.item.cardData); },
            onAdd: function (evt) {
                console.log(`%cItem Added:`, 'color: orange;', evt.item.cardData, `to [${evt.to.dataset.rowName}] from [${evt.from.dataset.rowName}]`);
                const rowName = evt.to.dataset.rowName;
                const rowLimit = parseInt(evt.to.dataset.rowLimit);
                if (rowLimit && evt.to.children.length > rowLimit) {
                    displayMessage(`${rowName === 'top' ? '头' : rowName === 'middle' ? '中' : '尾'}道已满 (${rowLimit} 张)!`, true);
                    console.warn(`Row ${rowName} limit ${rowLimit} exceeded.`);
                }
            },
            onUpdate: function (evt) { console.log('%cList Updated (sorted):', 'color: purple;', evt.item.cardData, 'in:', evt.from.dataset.rowName); },
            onRemove: function (evt) { console.log('%cItem Removed:', 'color: red;', evt.item.cardData, 'from:', evt.from.dataset.rowName, 'to:', evt.to ? evt.to.dataset.rowName : 'none'); },
            onEnd: function (evt) {
                console.log('%cDrag Ended.', 'color: brown; font-weight: bold;', 'Item:', evt.item.cardData, 'From:', evt.from.dataset.rowName, 'To:', evt.to.dataset.rowName);
                updateHandModelFromDOM(Array.from(evt.from.children), evt.from.dataset.rowName);
                if (evt.from !== evt.to) {
                    updateHandModelFromDOM(Array.from(evt.to.children), evt.to.dataset.rowName);
                }
                console.log(`--- Data models updated after drag end ---`);
            },
            // onMove: function (evt, originalEvent) { // 暂时注释掉 onMove 的复杂逻辑
            //     const toRowElement = evt.to;
            //     const rowLimit = parseInt(toRowElement.dataset.rowLimit);
            //     if (rowLimit && toRowElement.children.length >= rowLimit && evt.from !== toRowElement) {
            //         return false; // 阻止移动到已满的牌道
            //     }
            //     return true;
            // },
        };

        const initialHandEl = document.getElementById('player-hand');
        const topRowEl = document.getElementById('player-top-row');
        const middleRowEl = document.getElementById('player-middle-row');
        const bottomRowEl = document.getElementById('player-bottom-row');

        console.log("Sortable Init Check - initialHandEl:", initialHandEl ? 'Found' : 'NOT Found!');
        // ... (其他元素检查)

        if (initialHandEl) sortableInitialHand = new Sortable(initialHandEl, {...commonSortableOptions, sort: true });
        if (topRowEl) sortableTopRow = new Sortable(topRowEl, {...commonSortableOptions, sort: true});
        if (middleRowEl) sortableMiddleRow = new Sortable(middleRowEl, {...commonSortableOptions, sort: true});
        if (bottomRowEl) sortableBottomRow = new Sortable(bottomRowEl, {...commonSortableOptions, sort: true});

        if (initialHandEl || topRowEl || middleRowEl || bottomRowEl) {
            console.log("SortableJS initialization process completed for found elements.");
        } else {
            console.warn("None of the target elements for SortableJS were found in the DOM, though Sortable lib is loaded.");
        }

    } else {
        sortableInitializationAttempts++;
        if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) {
            console.warn(`SortableJS library is not loaded yet. Retrying in ${SORTABLE_INIT_DELAY}ms...`);
            setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
        } else {
            console.error("SortableJS library failed to load after multiple attempts!");
            displayMessage("错误：拖拽功能加载失败，请刷新页面重试。", true);
        }
    }
}

function initializeGame() {
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = [];
    playerOrganizedHand = { top: [], middle: [], bottom: [] };

    const playerHandElem = document.getElementById('player-hand');
    if (playerHandElem) playerHandElem.innerHTML = '<p>点击 "发牌" 开始</p>';
    const topRowElem = document.getElementById('player-top-row');
    if (topRowElem) topRowElem.innerHTML = '';
    const middleRowElem = document.getElementById('player-middle-row');
    if (middleRowElem) middleRowElem.innerHTML = '';
    const bottomRowElem = document.getElementById('player-bottom-row');
    if (bottomRowElem) bottomRowElem.innerHTML = '';
    // ... (其他UI清空) ...

    displayMessage("Game initialized. Click '发牌' to deal.");
    if (compareButton) compareButton.style.display = 'none';
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
    if (dealButton) dealButton.disabled = false;
    console.log("Game Initialized.");
}

dealButton.addEventListener('click', () => {
    // ... (和上次版本一致) ...
    console.log("--- Deal Button Clicked ---");
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = dealCards(deck, 13);

    if (!Array.isArray(playerHand) || playerHand.length !== 13) {
        console.error("CRITICAL: Failed to deal 13 cards properly. playerHand:", playerHand);
        displayMessage("错误：发牌失败！", true);
        return;
    }
    playerOrganizedHand = { top: [], middle: [], bottom: [] }; // 清空已整理的牌
    displayInitialHand(playerHand);
    displayOrganizedHand(playerOrganizedHand); // 确保牌道是空的

    displayMessage("请理牌！将手牌拖拽到上方牌道。");

    if (dealButton) dealButton.disabled = true;
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'inline-block';
});

confirmOrganizationButton.addEventListener('click', () => {
    // ... (和上次版本一致) ...
    console.log("--- Confirm Organization Button Clicked ---");
    const totalOrganizedCards = playerOrganizedHand.top.length + playerOrganizedHand.middle.length + playerOrganizedHand.bottom.length;
    const remainingInitialCards = playerHand.length;
    const totalCardsInPlay = totalOrganizedCards + remainingInitialCards;

    console.log("Confirming organization: Organized cards count:", totalOrganizedCards, "Initial cards count:", remainingInitialCards, "Total:", totalCardsInPlay);

    if (totalCardsInPlay !== 13) {
         displayMessage(`错误：总牌数 (${totalCardsInPlay}) 不等于13！请确保所有牌都在某个区域。初始区剩余: ${remainingInitialCards}`, true);
         return;
    }
    if (playerOrganizedHand.top.length !== 3 ||
        playerOrganizedHand.middle.length !== 5 ||
        playerOrganizedHand.bottom.length !== 5) {
        displayMessage(
            `牌数不正确！头道需3张(当前${playerOrganizedHand.top.length}), 中道需5张(当前${playerOrganizedHand.middle.length}), 尾道需5张(当前${playerOrganizedHand.bottom.length}).`,
             true
        );
        return;
    }

    displayOrganizedHand(playerOrganizedHand);

    const topEval = evaluateHand(playerOrganizedHand.top);
    const middleEval = evaluateHand(playerOrganizedHand.middle);
    const bottomEval = evaluateHand(playerOrganizedHand.bottom);

    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水了！请重新理牌或确认。", true);
    } else {
        displayMessage("理牌完成，可以比牌了！");
    }

    if (compareButton) compareButton.style.display = 'inline-block';
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
});

compareButton.addEventListener('click', () => {
    console.log("--- Compare Button Clicked ---");
    const topEval = evaluateHand(playerOrganizedHand.top);
    const middleEval = evaluateHand(playerOrganizedHand.middle);
    const bottomEval = evaluateHand(playerOrganizedHand.bottom);

    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水！本局判输。", true);
    } else {
        displayMessage("比牌完成！（此处应有计分和与对手比较的逻辑）");
    }
    if (compareButton) compareButton.style.display = 'none';
    if (dealButton) dealButton.disabled = false;
});

callBackendButton.addEventListener('click', async () => {
    // ... (和上次版本一致) ...
    displayMessage("Calling backend...", false);
    try {
        // 确保 API_BASE_URL 是你当前后端可访问的地址
        const response = await fetch(`${API_BASE_URL}/api/index.php?action=hello`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        displayMessage(`Backend says: ${data.message} (Timestamp: ${data.timestamp})`, false);
    } catch (error) {
        console.error("Error calling backend:", error);
        displayMessage(`Error calling backend: ${error.message}`, true);
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed");
    initializeGame();
    initializeSortable(); // 确保在DOM加载后调用
});
