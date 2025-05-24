// frontend/js/ui.js

const messageAreaElement = document.getElementById('message-area');
const scoreAreaElement = document.getElementById('score-area');

/**
 * Renders a single card DOM element.
 * @param {object} card - The card data object (must include rank, displaySuitChar, suitCssClass, id).
 * @returns {HTMLElement} The card div element.
 */
function renderCard(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css', card.suitCssClass);
    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;
    cardDiv.id = `card-${card.id}`; // Ensure each card div has a unique ID from card data
    cardDiv.cardData = card; // Attach full card object to the DOM element

    const centerSuitSpan = document.createElement('span');
    centerSuitSpan.classList.add('card-center-suit');
    centerSuitSpan.textContent = card.displaySuitChar;
    cardDiv.appendChild(centerSuitSpan);

    return cardDiv;
}

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - True if the message is an error, styles it differently.
 */
function displayMessage(message, isError = false) {
    if (!messageAreaElement) {
        console.error("UI Error: messageAreaElement not found!");
        return;
    }
    messageAreaElement.textContent = message;
    messageAreaElement.className = 'message-area'; // Reset classes
    if (isError) {
        messageAreaElement.classList.add('error');
    } else if (message.toLowerCase().includes("backend says:") || message.toLowerCase().includes("服务器")) {
         messageAreaElement.classList.add('info');
    }
}

/**
 * Displays the score.
 * @param {string|number} scoreText - The score or text related to score to display.
 */
function displayScore(scoreText) {
    if (!scoreAreaElement) {
        console.error("UI Error: scoreAreaElement not found!");
        return;
    }
    scoreAreaElement.textContent = scoreText;
}
