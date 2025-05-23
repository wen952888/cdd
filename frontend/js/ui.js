// frontend/js/ui.js

const playerHandElement = document.getElementById('player-hand');
const topRowElement = document.getElementById('player-top-row');
const middleRowElement = document.getElementById('player-middle-row');
const bottomRowElement = document.getElementById('player-bottom-row');
const messageAreaElement = document.getElementById('message-area');

function renderCard(card, isSelectable = false, isSelected = false) { // isSelectable 和 isSelected 参数可能不再需要，或根据拖拽/点击选择逻辑调整
    const cardDiv = document.createElement('div');
    // 确保核心类名 'card-css' 和花色特定类名被添加
    cardDiv.classList.add('card-css', card.suitCssClass);

    // if (isSelectable) cardDiv.classList.add('selectable'); // 如果还保留点击选择，则需要
    // if (isSelected) cardDiv.classList.add('selected');

    // 确保 dataset 属性被正确设置，供 CSS 伪元素使用
    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;

    // 存储卡牌对象的引用，方便后续操作 (例如从 DOM 元素获取卡牌数据)
    cardDiv.cardData = card;

    // 创建用于显示中心花色的 span 元素
    const centerSuitSpan = document.createElement('span');
    centerSuitSpan.classList.add('card-center-suit');
    centerSuitSpan.textContent = card.displaySuitChar; // 花色字符
    cardDiv.appendChild(centerSuitSpan);

    // 如果实现了点击选牌逻辑（现在主要用拖拽，这个可以移除或保留）
    // if (isSelectable) {
    //     cardDiv.addEventListener('click', handleCardSelect);
    // }
    return cardDiv;
}

/**
 * 显示初始13张手牌
 */
function displayInitialHand(hand) {
    if (!playerHandElement) {
        console.error("playerHandElement is not found!");
        return;
    }
    playerHandElement.innerHTML = ''; // 清空之前的牌
    if (hand && Array.isArray(hand)) {
        hand.forEach(card => {
            if (card) { // 确保 card 对象存在
                 playerHandElement.appendChild(renderCard(card)); // 拖拽时通常不需要 isSelectable 参数
            } else {
                console.warn("Undefined card object in hand array during displayInitialHand");
            }
        });
    } else {
        console.warn("Hand is not a valid array or is empty in displayInitialHand:", hand);
        playerHandElement.innerHTML = '<p>无法加载手牌数据.</p>';
    }
}

/**
 * 更新已整理的牌道显示
 */
function displayOrganizedHand(organizedHand) {
    if (!organizedHand) return;

    const renderRow = (rowElement, cards) => {
        if (!rowElement) return;
        rowElement.innerHTML = '';
        if (cards && Array.isArray(cards)) {
            cards.forEach(card => {
                if (card) rowElement.appendChild(renderCard(card));
            });
        }
    };

    renderRow(topRowElement, organizedHand.top);
    renderRow(middleRowElement, organizedHand.middle);
    renderRow(bottomRowElement, organizedHand.bottom);

    const updateEvalText = (spanId, handCards) => {
        const spanElement = document.getElementById(spanId);
        if (spanElement && handCards && handCards.length > 0) {
            const evalResult = evaluateHand(handCards); // evaluateHand 在 game.js
            spanElement.textContent = ` (${evalResult.message || '未知'})`;
        } else if (spanElement) {
            spanElement.textContent = '';
        }
    };

    updateEvalText('top-eval-text', organizedHand.top);
    updateEvalText('middle-eval-text', organizedHand.middle);
    updateEvalText('bottom-eval-text', organizedHand.bottom);

    // 检查倒水 (checkDaoshui 在 game.js)
    if (organizedHand.top && organizedHand.middle && organizedHand.bottom &&
        organizedHand.top.length === 3 && organizedHand.middle.length === 5 && organizedHand.bottom.length === 5) {
        const topEval = evaluateHand(organizedHand.top);
        const middleEval = evaluateHand(organizedHand.middle);
        const bottomEval = evaluateHand(organizedHand.bottom);
        if (checkDaoshui(topEval, middleEval, bottomEval)) {
            displayMessage("倒水了！", true);
        }
    }
}

// handleCardSelect 函数如果不再通过点击管理选中状态，可以注释掉或移除
/*
let selectedCardsForOrganizing = [];
function handleCardSelect(event) {
    const cardDiv = event.currentTarget;
    const cardData = cardDiv.cardData;

    if (!cardData) return;

    cardDiv.classList.toggle('selected');
    if (cardDiv.classList.contains('selected')) {
        if (!selectedCardsForOrganizing.find(c => c.rank === cardData.rank && c.suitKey === cardData.suitKey)) {
            selectedCardsForOrganizing.push(cardData);
        }
    } else {
        selectedCardsForOrganizing = selectedCardsForOrganizing.filter(c => !(c.rank === cardData.rank && c.suitKey === cardData.suitKey));
    }
    console.log("Selected cards for organizing (click):", selectedCardsForOrganizing);
}
*/

function displayMessage(message, isError = false) {
    if (!messageAreaElement) {
        console.error("messageAreaElement is not found!");
        return;
    }
    messageAreaElement.textContent = message;
    messageAreaElement.style.color = isError ? 'red' : (message.includes("Backend says:") ? 'blue' : '#333');
}
