// frontend/js/main.js

const dealButton = document.getElementById('deal-button');
const callBackendButton = document.getElementById('call-backend-button');
const compareButton = document.getElementById('compare-button');
const confirmOrganizationButton = document.getElementById('confirm-organization-button');

const API_BASE_URL = 'https://wenge.cloudns.ch';

let deck = [];
let playerHand = [];
let playerOrganizedHand = {
    top: [],
    middle: [],
    bottom: []
};

let sortableInitialHand, sortableTopRow, sortableMiddleRow, sortableBottomRow;

function updateHandModelFromDOM(domElements, rowName) {
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
    console.log("Attempting to initialize SortableJS...");
    if (typeof Sortable === 'undefined') {
        console.error("SortableJS library is not loaded!");
        displayMessage("错误：拖拽功能未加载，请检查网络或刷新页面。", true);
        return;
    }

    const sharedGroupName = 'thirteen-water-cards';
    const commonSortableOptions = {
        group: sharedGroupName,
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onStart: function (/**Event*/evt) {
            console.log('%cDrag Started:', 'color: blue; font-weight: bold;', evt.item.cardData, 'from container:', evt.from.dataset.rowName);
        },
        onChoose: function (/**Event*/evt) {
            console.log('%cItem Chosen:', 'color: green;', evt.item.cardData);
        },
        onUnchoose: function (/**Event*/evt) {
            console.log('%cItem Unchosen:', 'color: gray;', evt.item.cardData);
        },
        onAdd: function (/**Event*/evt) {
            const itemEl = evt.item;
            const toRowElement = evt.to;
            const fromRowElement = evt.from;
            console.log(`%cItem Added:`, 'color: orange;', itemEl.cardData, `to [${toRowElement.dataset.rowName}] from [${fromRowElement.dataset.rowName}]`);

            const rowName = toRowElement.dataset.rowName;
            const rowLimit = parseInt(toRowElement.dataset.rowLimit);

            // 重要的：这里的 children.length 是添加之后的目标列表长度
            if (rowLimit && toRowElement.children.length > rowLimit) {
                displayMessage(`${rowName === 'top' ? '头' : rowName === 'middle' ? '中' : '尾'}道已满 (${rowLimit} 张)! 请先移出一些牌。`, true);
                // 关键：将元素移回来源地
                // evt.from 是原始容器，evt.item 是被拖动的项
                // SortableJS v1.10+ 应该在 onAdd 之后，如果目标列表拒绝（例如通过配置），它会自动处理回退
                // 但如果没有这样的配置，我们需要手动将其“送回”
                // 注意：直接操作 DOM 可能会与 SortableJS 的内部状态冲突，通常 onEnd 是更安全的地方处理最终状态
                // 简单的做法是允许添加，然后在 onEnd 或 confirm 时校验
                // 如果想立即阻止，需要更复杂的 onMove 回调返回 false
                console.warn(`Row ${rowName} limit ${rowLimit} exceeded. Card ${itemEl.cardData.rank}${itemEl.cardData.displaySuitChar} was moved to a full row.`);
                // 暂时不在这里做强制移回，依赖onEnd和最终校验
            }
        },
        onUpdate: function (/**Event*/evt) { // 列表内排序
            console.log('%cList Updated (sorted):', 'color: purple;', evt.item.cardData, 'in container:', evt.from.dataset.rowName);
            // onEnd 也会触发，所以可以在 onEnd 中统一处理数据模型更新
        },
        onSort: function (/**Event*/evt) { // Fired when sorting within a list or between lists.
            // console.log('Item Sort Event:', evt.item);
        },
        onRemove: function (/**Event*/evt) {
            console.log('%cItem Removed:', 'color: red;', evt.item.cardData, 'from container:', evt.from.dataset.rowName, 'to:', evt.to ? evt.to.dataset.rowName : 'outside');
        },
        onEnd: function (/**Event*/evt) {
            console.log('%cDrag Ended.', 'color: brown; font-weight: bold;', 'Item:', evt.item.cardData, 'New Index:', evt.newIndex, 'Old Index:', evt.oldIndex, 'From:', evt.from.dataset.rowName, 'To:', evt.to.dataset.rowName);
            const fromRowName = evt.from.dataset.rowName;
            const toRowName = evt.to.dataset.rowName;

            // 核心：在拖拽操作结束后，根据 DOM 的最终状态更新数据模型
            updateHandModelFromDOM(Array.from(evt.from.children), fromRowName);
            if (evt.from !== evt.to) { // 如果是从一个列表拖到另一个列表
                updateHandModelFromDOM(Array.from(evt.to.children), toRowName);
            }
            console.log(`--- Data models updated after drag end ---`);
        },
        onMove: function (/**Event*/evt, /**Event*/originalEvent) {
            // evt.dragged; // 被拖拽的DOM元素
            // evt.draggedRect; // 被拖拽的DOM元素的边界ClientRect
            // evt.related; // 相关的拖拽元素（悬停在其上的元素）
            // evt.relatedRect; // 相关元素的边界ClientRect
            // originalEvent.clientY; // 鼠标Y坐标
            // originalEvent.clientX; // 鼠标X坐标
            // return false; // 取消移动并触发onEnd回调函数
            const toRowElement = evt.to;
            const rowLimit = parseInt(toRowElement.dataset.rowLimit);
            // 检查目标牌道是否已满 (evt.related 即将插入的位置的元素)
            // 如果 toRowElement 是目标牌道，并且里面已经有了 rowLimit 个元素，
            // 并且 evt.dragged 不是来自 toRowElement (即不是在同一个牌道内排序)
            if (rowLimit && toRowElement.children.length >= rowLimit && evt.from !== toRowElement) {
                // console.log(`Attempting to move to full row [${toRowElement.dataset.rowName}]. Limit: ${rowLimit}, Current: ${toRowElement.children.length}`);
                // displayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : toRowElement.dataset.rowName === 'middle' ? '中' : '尾'}道已满 (${rowLimit} 张)!`, true);
                // return false; // 返回false可以阻止移动，并立即触发onEnd
                // 注意：如果在onMove中阻止，onAdd可能不会触发。
                // 暂时注释掉，让onAdd和onEnd处理，因为onMove的逻辑可能更复杂
            }
            return true; // 允许移动
        },
    };

    const initialHandEl = document.getElementById('player-hand');
    const topRowEl = document.getElementById('player-top-row');
    const middleRowEl = document.getElementById('player-middle-row');
    const bottomRowEl = document.getElementById('player-bottom-row');

    console.log("Sortable Init - initialHandEl:", initialHandEl ? 'Found' : 'NOT Found!');
    console.log("Sortable Init - topRowEl:", topRowEl ? 'Found' : 'NOT Found!');
    console.log("Sortable Init - middleRowEl:", middleRowEl ? 'Found' : 'NOT Found!');
    console.log("Sortable Init - bottomRowEl:", bottomRowEl ? 'Found' : 'NOT Found!');

    if (initialHandEl) {
        sortableInitialHand = new Sortable(initialHandEl, {...commonSortableOptions, sort: true }); // 初始手牌区允许内部排序
        console.log("Sortable for initialHandEl initialized.");
    }
    if (topRowEl) {
        sortableTopRow = new Sortable(topRowEl, {...commonSortableOptions, sort: true}); // 牌道内也允许排序
        console.log("Sortable for topRowEl initialized.");
    }
    if (middleRowEl) {
        sortableMiddleRow = new Sortable(middleRowEl, {...commonSortableOptions, sort: true});
        console.log("Sortable for middleRowEl initialized.");
    }
    if (bottomRowEl) {
        sortableBottomRow = new Sortable(bottomRowEl, {...commonSortableOptions, sort: true});
        console.log("Sortable for bottomRowEl initialized.");
    }

    if (initialHandEl || topRowEl || middleRowEl || bottomRowEl) {
        console.log("At least one Sortable instance was attempted.");
    } else {
        console.error("None of the target elements for SortableJS were found in the DOM!");
        displayMessage("错误：无法初始化拖拽区域。", true);
    }
}


function initializeGame() {
    // ... (内容不变) ...
    console.log("Game Initialized.");
}

dealButton.addEventListener('click', () => {
    // ... (内容不变，但确保 playerHand 数据模型在 displayInitialHand 前已填充) ...
    console.log("--- Deal Button Clicked ---");
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = dealCards(deck, 13); // 更新 playerHand 数据模型

    if (!Array.isArray(playerHand) || playerHand.length !== 13) {
        console.error("CRITICAL: Failed to deal 13 cards properly. playerHand:", playerHand);
        displayMessage("错误：发牌失败！", true);
        return;
    }
    // 清空之前的牌道数据模型
    playerOrganizedHand = { top: [], middle: [], bottom: [] };
    // 重新渲染所有UI区域
    displayInitialHand(playerHand);
    displayOrganizedHand(playerOrganizedHand); // 清空并渲染空的牌道

    displayMessage("请理牌！将手牌拖拽到上方牌道。");

    if (dealButton) dealButton.disabled = true;
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'inline-block';
});

confirmOrganizationButton.addEventListener('click', () => {
    // ... (内容不变，但校验现在依赖于 playerHand 和 playerOrganizedHand 数据模型) ...
    console.log("--- Confirm Organization Button Clicked ---");

    const totalOrganizedCards = playerOrganizedHand.top.length + playerOrganizedHand.middle.length + playerOrganizedHand.bottom.length;
    const remainingInitialCards = playerHand.length; // playerHand 应该是初始区剩下的牌
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
    // ... 后续逻辑不变 ...
    // 计算牌型并显示
    displayOrganizedHand(playerOrganizedHand); // 确保牌型文本基于当前数据模型更新

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

compareButton.addEventListener('click', () => { /* ... (逻辑基本不变) ... */ });
callBackendButton.addEventListener('click', async () => { /* ... (逻辑不变) ... */ });

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed");
    initializeGame();
    initializeSortable();
});
