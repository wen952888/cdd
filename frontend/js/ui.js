// frontend/js/ui.js

const playerHandElement = document.getElementById('player-hand');
const messageAreaElement = document.getElementById('message-area');

function renderCard(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css', card.suitCssClass); // 'card-css' 是基础样式, 'spades' 等是花色特定样式

    // 将点数和花色存储在 data 属性中，供 CSS 的伪元素使用
    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;

    // 创建用于显示中心花色的 span 元素
    const centerSuitSpan = document.createElement('span');
    centerSuitSpan.classList.add('card-center-suit');
    centerSuitSpan.textContent = card.displaySuitChar; // 直接使用花色字符
    cardDiv.appendChild(centerSuitSpan); // 将中心花色 span 添加到卡牌 div 中

    return cardDiv;
}

function displayHand(hand) {
    playerHandElement.innerHTML = ''; // Clear previous hand
    if (hand && hand.length > 0) {
        hand.forEach(card => {
            playerHandElement.appendChild(renderCard(card));
        });
    } else {
        const p = document.createElement('p');
        p.textContent = "No cards to display.";
        playerHandElement.appendChild(p);
    }
}

function displayMessage(message, isError = false) {
    messageAreaElement.textContent = message;
    messageAreaElement.style.color = isError ? 'red' : (message.includes("Backend says:") ? 'blue' : 'green');
}
