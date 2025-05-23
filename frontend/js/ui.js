// UI manipulation
const playerHandElement = document.getElementById('player-hand');
const messageAreaElement = document.getElementById('message-area');

function renderCard(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css', card.suitCssClass); // 'card-css' 是基础样式, 'spades' 等是花色特定样式

    // 将点数和花色存储在 data 属性中，供 CSS 使用
    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;

    // （可选）如果你想在卡牌中间也显示一些内容，可以在这里添加
    // 例如，一个大的花色符号，或根据点数显示对应数量的小花色符号
    // const centralSuitSpan = document.createElement('span');
    // centralSuitSpan.classList.add('card-center-suit');
    // centralSuitSpan.textContent = card.displaySuitChar;
    // cardDiv.appendChild(centralSuitSpan);

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
