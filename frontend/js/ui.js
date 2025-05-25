// frontend/js/ui.js

// const messageAreaElement = document.getElementById('message-area'); // No longer global default
const scoreAreaElement = document.getElementById('score-area');

/**
 * Renders a single card DOM element using an image.
 * Relies on getCardImagePath, getCardBackImagePath, RANK_FILENAME_PART, SUITS_DATA from game.js.
 * @param {object} card - Card data (needs rank, suitKey, id).
 * @param {boolean} [isFaceUp=true] - Shows card back if false.
 * @returns {HTMLElement} The card div.
 */
function renderCard(card, isFaceUp = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css');

    const img = document.createElement('img');
    let altText = "Playing Card";
    let imgSrc = "";

    if (isFaceUp) {
        if (typeof getCardImagePath !== 'function' || typeof RANK_FILENAME_PART === 'undefined' || typeof SUITS_DATA === 'undefined') {
            console.error("renderCard ERROR: Required functions/data from game.js are not available.");
            img.alt = "Error: Missing game data for card image";
        } else {
            imgSrc = getCardImagePath(card); 
            const rankPartForAlt = card && card.rank ? (RANK_FILENAME_PART[card.rank.toUpperCase()] || card.rank) : "Unknown Rank";
            const suitPartForAlt = card && card.suitKey && SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].fileNamePart : "Unknown Suit";
            altText = `${rankPartForAlt} of ${suitPartForAlt}`;
        }
    } else {
        if (typeof getCardBackImagePath !== 'function') {
            console.error("renderCard ERROR: getCardBackImagePath from game.js is not available.");
            img.alt = "Error: Missing game data for card back";
        } else {
            imgSrc = getCardBackImagePath(); 
            altText = "Card Back";
        }
    }
    img.src = imgSrc;
    img.alt = altText;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.draggable = false;

    img.onerror = function() {
        console.error(`renderCard IMAGE LOAD ERROR: Failed to load image. Attempted src: "${imgSrc}". Card data: ${JSON.stringify(card)}`);
        this.alt = `Failed to load: ${altText}`;
        cardDiv.classList.add('card-image-load-error');
    };

    cardDiv.appendChild(img);

    if (card) {
        cardDiv.cardData = card;
        cardDiv.id = `card-dom-${card.id || ((card.rank || 'X') + (card.suitKey || 'Y') + Math.random().toString(36).substring(2, 7))}`;
    }
    return cardDiv;
}

function displayMessage(message, isError = false, targetElement = null) {
    // Use provided targetElement or default to game's message area if in room, otherwise null (console log only)
    const effectiveMessageArea = targetElement || (document.getElementById('room-section').style.display !== 'none' ? document.getElementById('message-area') : null);

    if (!effectiveMessageArea) { 
        console.warn("displayMessage: No target message area found or specified. Message:", message); 
        return; 
    }
    effectiveMessageArea.textContent = message;
    effectiveMessageArea.className = 'message-area'; // Reset classes
    if (isError) effectiveMessageArea.classList.add('error');
    else if (message.toLowerCase().includes("backend says:") || message.toLowerCase().includes("服务器"))
         effectiveMessageArea.classList.add('info');
}

function displayScore(scoreText) {
    if (!scoreAreaElement) { console.warn("displayScore: scoreAreaElement not found."); return; }
    scoreAreaElement.textContent = scoreText;
}
