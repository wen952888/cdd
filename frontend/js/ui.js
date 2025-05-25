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
    cardDiv.classList.add('card-css');

    const img = document.createElement('img');
    let altText = "扑克牌";
    let imgSrc = "";

    if (!card || !card.rank || !card.suitKey) { // Basic validation for card object
        console.error("renderCard: 无效的牌数据", card);
        imgSrc = getCardBackImagePath(); // Show card back or an error image
        altText = "无效的牌";
        isFaceUp = false; // Force back if data is bad
    } else if (isFaceUp) {
        if (typeof getCardImagePath !== 'function' || typeof RANK_FILENAME_PART === 'undefined' || typeof SUITS_DATA === 'undefined') {
            console.error("renderCard ERROR: game.js 功能或数据缺失。");
            img.alt = "错误: 渲染数据缺失";
            imgSrc = getCardBackImagePath(); // Fallback
        } else {
            imgSrc = getCardImagePath(card);
            const rankPartForAlt = RANK_FILENAME_PART[String(card.rank).toUpperCase()] || card.rank;
            const suitPartForAlt = SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].displayChar : card.suitKey;
            altText = `${suitPartForAlt}${rankPartForAlt}`;
        }
    } else {
        imgSrc = getCardBackImagePath();
        altText = "牌背";
    }

    img.src = imgSrc;
    img.alt = altText;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain'; // Changed from 'cover' to 'contain' for better card visibility
    img.draggable = false;

    img.onerror = function() {
        console.error(`renderCard 图片加载失败: "${imgSrc}". 牌数据: ${JSON.stringify(card)}`);
        this.alt = `加载失败: ${altText}`;
        cardDiv.classList.add('card-image-load-error');
        // this.src = 'images/cards/error_placeholder.png'; // Optional placeholder
    };

    cardDiv.appendChild(img);

    if (card) { // Attach cardData only if card is valid
        cardDiv.cardData = card;
        // Ensure a unique ID for the DOM element, useful for SortableJS or direct manipulation
        cardDiv.id = `card-dom-${card.id || ((card.rank || 'X') + (card.suitKey || 'Y') + Math.random().toString(36).substring(2, 7))}`;
    }
    return cardDiv;
}

function displayMessage(message, isError = false) {
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
