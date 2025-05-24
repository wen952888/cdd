// frontend/js/ui.js

const messageAreaElement = document.getElementById('message-area');
const scoreAreaElement = document.getElementById('score-area');

function renderCard(card, isFaceUp = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css');
    const img = document.createElement('img');
    let altText = "Playing Card"; let imgSrc = "";

    if (isFaceUp) {
        if (typeof getCardImagePath !== 'function' || typeof RANK_FILENAME_PART === 'undefined' || typeof SUITS_DATA === 'undefined') {
            console.error("renderCard ERROR: Game data for images not ready (getCardImagePath or mappings missing).");
            imgSrc = (typeof CARD_IMAGE_PATH_PREFIX !== 'undefined' && typeof UNKNOWN_CARD_FILENAME !== 'undefined') ? CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME : 'images/cards/unknown.png'; // Provide a more robust fallback
            img.alt = "Error loading card image";
        } else {
            imgSrc = getCardImagePath(card); // From game.js
            const rankPartForAlt = card?.rank ? (RANK_FILENAME_PART[card.rank.toUpperCase()] || card.rank) : "UnknownRank";
            const suitPartForAlt = card?.suitKey && SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].fileNamePart : "UnknownSuit";
            altText = `${rankPartForAlt} of ${suitPartForAlt}`;
        }
    } else {
        if (typeof getCardBackImagePath !== 'function') {
            console.error("renderCard ERROR: Game data for card back not ready (getCardBackImagePath missing).");
            imgSrc = (typeof CARD_IMAGE_PATH_PREFIX !== 'undefined' && typeof CARD_IMAGE_EXTENSION !== 'undefined') ? CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION : 'images/cards/back.png'; // Fallback to expected back
            img.alt = "Error loading card back";
        } else { imgSrc = getCardBackImagePath(); altText = "Card Back"; }
    }
    img.src = imgSrc; img.alt = altText;
    img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain'; img.draggable = false;
    img.onerror = function() {
        console.error(`IMAGE LOAD ERROR: Src: "${this.src}". Card: ${JSON.stringify(card)}`); this.alt = `Failed to load: ${altText}`; cardDiv.classList.add('card-image-load-error');
    };
    cardDiv.appendChild(img);
    if (card) {
        cardDiv.cardData = card;
        cardDiv.id = `card-dom-${card.id || ((card.rank || 'X') + (card.suitKey || 'Y') + Math.random().toString(36).substring(2, 7))}`;
    }
    return cardDiv;
}
function displayMessage(message, isError = false) {
    if (!messageAreaElement) { console.warn("displayMessage: messageAreaElement not found."); return; }
    messageAreaElement.textContent = message; messageAreaElement.className = 'message-area';
    if (isError) messageAreaElement.classList.add('error');
    else if (message.toLowerCase().includes("backend says:") || message.toLowerCase().includes("服务器")) messageAreaElement.classList.add('info');
}
function displayScore(scoreText) { if (!scoreAreaElement) { console.warn("displayScore: scoreAreaElement not found."); return; } scoreAreaElement.textContent = scoreText; }
