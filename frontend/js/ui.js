// frontend/js/ui.js

const playerHandElement = document.getElementById('player-hand');
const topRowElement = document.getElementById('player-top-row');
const middleRowElement = document.getElementById('player-middle-row');
const bottomRowElement = document.getElementById('player-bottom-row');
const messageAreaElement = document.getElementById('message-area');

let selectedCardsForOrganizing = []; // 用于点击选牌 (如果实现了点击选择逻辑)

function renderCard(card, isSelectable = false, isSelected = false) {
    const cardDiv = document.createElement('div');
    // 确保核心类名 'card-css' 和花色特定类名被添加
    cardDiv.classList.add('card-css', card.suitCssClass);

    if (isSelectable) cardDiv.classList.add('selectable');
    if (isSelected) cardDiv.classList.add('selected');

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

    // 如果实现了点击选牌逻辑
    if (isSelectable) {
        cardDiv.addEventListener('click', handleCardSelect);
    }
    return cardDiv;
}

/**
 * 显示初始13张手牌，并使其可选
 */
function displayInitialHand(hand) {
    if (!playerHandElement) {
        console.error("playerHandElement is not found!");
        return;
    }
    playerHandElement.innerHTML = ''; // 清空之前的牌
    if (hand && Array.isArray(hand)) { // 增加对 hand 是否为数组的检查
        hand.forEach(card => {
            if (card) { // 确保 card 对象存在
                 playerHandElement.appendChild(renderCard(card, true, false));
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
                if (card) rowElement.appendChild(renderCard(card)); // 理好的牌通常不可再选
            });
        }
    };

    renderRow(topRowElement, organizedHand.top);
    renderRow(middleRowElement, organizedHand.middle);
    renderRow(bottomRowElement, organizedHand.bottom);

    // 显示牌型文字 (确保对应的 span 元素在 HTML 中存在)
    const updateEvalText = (spanId, handCards) => {
        const spanElement = document.getElementById(spanId);
        if (spanElement && handCards && handCards.length > 0) {
            const evalResult = evaluateHand(handCards);
            spanElement.textContent = ` (${evalResult.message || '未知'})`;
        } else if (spanElement) {
            spanElement.textContent = '';
        }
    };

    updateEvalText('top-eval-text', organizedHand.top);
    updateEvalText('middle-eval-text', organizedHand.middle);
    updateEvalText('bottom-eval-text', organizedHand.bottom);

    // 检查倒水 (确保 evaluateHand 返回的对象包含 type 属性)
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


function handleCardSelect(event) {
    const cardDiv = event.currentTarget;
    const cardData = cardDiv.cardData;

    if (!cardData) return; // 防御性检查

    cardDiv.classList.toggle('selected');
    if (cardDiv.classList.contains('selected')) {
        // 避免重复添加
        if (!selectedCardsForOrganizing.find(c => c.rank === cardData.rank && c.suitKey === cardData.suitKey)) {
            selectedCardsForOrganizing.push(cardData);
        }
    } else {
        selectedCardsForOrganizing = selectedCardsForOrganizing.filter(c => !(c.rank === cardData.rank && c.suitKey === cardData.suitKey));
    }
    console.log("Selected cards for organizing:", selectedCardsForOrganizing);
}


function displayMessage(message, isError = false) {
    if (!messageAreaElement) {
        console.error("messageAreaElement is not found!");
        return;
    }
    messageAreaElement.textContent = message;
    messageAreaElement.style.color = isError ? 'red' : (message.includes("Backend says:") ? 'blue' : '#333'); // 默认为深灰色
}
