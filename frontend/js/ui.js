// frontend/js/ui.js

let messageAreaElement = null;
let scoreAreaElement = null;

function initializeUiElements() {
    if (!messageAreaElement) messageAreaElement = document.getElementById('message-area');
    if (!scoreAreaElement) scoreAreaElement = document.getElementById('score-area');

    if (!messageAreaElement) console.error("UI Error: 'message-area' element not found.");
    if (!scoreAreaElement) console.error("UI Error: 'score-area' element not found.");
}

function renderCard(card, isFaceUp = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css'); // 确保这个类被添加

    const img = document.createElement('img');
    let altText = "扑克牌";
    let imgSrc = "";

    if (!card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined') {
        console.warn("renderCard: 收到无效的牌数据对象", card);
        imgSrc = getCardBackImagePath(); // 默认显示牌背或错误占位符
        altText = "无效牌";
        isFaceUp = false; // 强制显示牌背
    } else if (isFaceUp) {
        if (typeof getCardImagePath !== 'function' || typeof RANK_FILENAME_PART === 'undefined' || typeof SUITS_DATA === 'undefined') {
            console.error("renderCard ERROR: game.js 功能或数据缺失。");
            img.alt = "错误: 渲染数据缺失";
            imgSrc = getCardBackImagePath(); // Fallback to card back
        } else {
            imgSrc = getCardImagePath(card);
            const rankDisplay = String(card.rank).toUpperCase();
            const suitDisplay = SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].displayChar : '?';
            altText = `${suitDisplay}${rankDisplay}`;
        }
    } else {
        imgSrc = getCardBackImagePath();
        altText = "牌背";
    }

    img.src = imgSrc;
    img.alt = altText;
    // 移除内联的 width, height, object-fit。这些应由 style.css 中的 .card-css img 控制。
    // img.style.width = '100%';
    // img.style.height = '100%';
    // img.style.objectFit = 'contain'; 
    img.draggable = false; // 防止图片被意外拖动

    img.onerror = function() {
        console.error(`renderCard 图片加载失败: "${this.src}". 牌数据: ${JSON.stringify(card)}`);
        this.alt = `图片加载失败: ${altText}`;
        cardDiv.classList.add('card-image-load-error'); // 可用于CSS定义错误图片样式
        // 考虑设置一个通用的错误占位符图片
        // this.src = 'images/cards/card_load_error.png';
    };

    cardDiv.appendChild(img);

    if (card && card.id) { // 确保card对象和id存在才附加
        cardDiv.cardData = card;
        cardDiv.id = `card-dom-${card.id}`;
    } else if (card) { // 如果没有id，也尝试附加数据，但警告
        cardDiv.cardData = card;
        // console.warn("renderCard: 牌对象缺少ID, card-dom-id 将不唯一。", card);
        // 生成一个临时的随机ID，避免完全没有ID
        cardDiv.id = `card-dom-${(card.rank || 'X') + (card.suitKey || 'Y') + Math.random().toString(36).substring(2, 7)}`;
    }

    return cardDiv;
}

function displayMessage(message, isError = false) {
    // ... (内容与之前梳理版一致)
    if (!messageAreaElement) {
        console.error("displayMessage: messageAreaElement 为 null。消息: " + message);
        return;
    }
    try {
        messageAreaElement.textContent = message;
        messageAreaElement.className = 'message-area'; // Reset classes
        if (isError) {
            messageAreaElement.classList.add('error');
        } else if (String(message).toLowerCase().includes("服务器") || String(message).toLowerCase().includes("backend")) {
            messageAreaElement.classList.add('info');
        }
    } catch (e) {
        console.error("displayMessage 执行错误:", e, { message, isError, messageAreaElement });
    }
}

function displayScore(scoreText) {
    // ... (内容与之前梳理版一致)
    if (!scoreAreaElement) {
        console.error("displayScore: scoreAreaElement 为 null。分数文本: " + scoreText);
        return;
    }
    try {
        scoreAreaElement.textContent = String(scoreText); // Ensure text
    } catch (e) {
        console.error("displayScore 执行错误:", e, { scoreText, scoreAreaElement });
    }
}
