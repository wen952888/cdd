// frontend/js/ui.js

const playerHandElement = document.getElementById('player-hand'); // 初始13张牌显示区
const topRowElement = document.getElementById('player-top-row'); // 假设HTML中有这些元素
const middleRowElement = document.getElementById('player-middle-row');
const bottomRowElement = document.getElementById('player-bottom-row');
const messageAreaElement = document.getElementById('message-area');
// ... 其他如对手牌区，计分板等元素获取

let selectedCardsForOrganizing = []; // 用于点击选牌

function renderCard(card, isSelectable = false, isSelected = false) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css', card.suitCssClass);
    if (isSelectable) cardDiv.classList.add('selectable');
    if (isSelected) cardDiv.classList.add('selected');

    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;
    // 存储卡牌对象的引用，方便后续操作
    cardDiv.cardData = card;

    const centerSuitSpan = document.createElement('span');
    centerSuitSpan.classList.add('card-center-suit');
    centerSuitSpan.textContent = card.displaySuitChar;
    cardDiv.appendChild(centerSuitSpan);

    if (isSelectable) {
        cardDiv.addEventListener('click', handleCardSelect);
    }
    return cardDiv;
}

/**
 * 显示初始13张手牌，并使其可选
 */
function displayInitialHand(hand) {
    playerHandElement.innerHTML = '';
    hand.forEach(card => {
        playerHandElement.appendChild(renderCard(card, true, false));
    });
    // 可能还需要一些按钮来确认移动到某一道
    // 或者实现拖拽功能
}

/**
 * 更新已整理的牌道显示
 */
function displayOrganizedHand(organizedHand) {
    topRowElement.innerHTML = '';
    organizedHand.top.forEach(card => topRowElement.appendChild(renderCard(card)));
    // 为 middleRowElement 和 bottomRowElement 做类似操作
    // ...
    // 牌型显示
    const topEval = evaluateHand(organizedHand.top);
    const middleEval = evaluateHand(organizedHand.middle);
    const bottomEval = evaluateHand(organizedHand.bottom);
    // 更新UI显示牌型文字，例如：
    // document.getElementById('top-eval-text').textContent = topEval.message;

    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水了！", true);
    }
}


function handleCardSelect(event) {
    const cardDiv = event.currentTarget;
    const cardData = cardDiv.cardData;

    // 切换选中状态
    cardDiv.classList.toggle('selected');
    if (cardDiv.classList.contains('selected')) {
        selectedCardsForOrganizing.push(cardData);
    } else {
        selectedCardsForOrganizing = selectedCardsForOrganizing.filter(c => c !== cardData);
    }
    // console.log("Selected cards:", selectedCardsForOrganizing);
    // 更新UI，例如高亮选中的牌，或者显示已选牌数
}

// --- 拖拽功能 (可以使用 SortableJS 这样的库) ---
// 如果使用 SortableJS:
// new Sortable(playerHandElement, { group: 'shared', animation: 150 });
// new Sortable(topRowElement, { group: 'shared', animation: 150, onAdd: function(evt){ checkRowLimit(evt, 3, 'top'); } });
// new Sortable(middleRowElement, { group: 'shared', animation: 150, onAdd: function(evt){ checkRowLimit(evt, 5, 'middle'); } });
// new Sortable(bottomRowElement, { group: 'shared', animation: 150, onAdd: function(evt){ checkRowLimit(evt, 5, 'bottom'); } });

// function checkRowLimit(evt, limit, rowName) {
//   const rowElement = evt.to;
//   if (rowElement.children.length > limit) {
//     // 牌数超限，将牌移回原处或提示用户
//     Sortable.utils.select(evt.item).parentNode.removeChild(evt.item);
//     // 或者 evt.from.appendChild(evt.item);
//     displayMessage(`${rowName}道最多只能放 ${limit} 张牌!`, true);
//   } else {
//      // 更新 playerOrganizedHand 中的数据
//      // playerOrganizedHand[rowName] = Array.from(rowElement.children).map(div => div.cardData);
//   }
// }

// --- 显示比牌结果和得分 ---
function displayResults(result) {
    // ...
}

function displayMessage(message, isError = false) { /* ... (保持不变) ... */ }
