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
            console.error("renderCard ERROR: Game data for images not ready."); imgSrc = (typeof CARD_IMAGE_PATH_PREFIX !== 'undefined' && typeof UNKNOWN_CARD_FILENAME !== 'undefined') ? CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME : ""; img.alt = "Error";
        } else {
            imgSrc = getCardImagePath(card);
            const rankFNP = card?.rank ? (RANK_FILENAME_PART[card.rank.toUpperCase()] || card.rank) : "UnknownRank";
            const suitFNP = card?.suitKey && SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].fileNamePart : "UnknownSuit";
            altText = `${rankFNP} of ${suitFNP}`;
        }
    } else {
        if (typeof getCardBackImagePath !== 'function') {
            console.error("renderCard ERROR: Game data for card back not ready."); imgSrc = (typeof CARD_IMAGE_PATH_PREFIX !== 'undefined' && typeof UNKNOWN_CARD_FILENAME !== 'undefined') ? CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME : ""; img.alt = "Error";
        } else { imgSrc = getCardBackImagePath(); altText = "Card Back"; }
    }
    img.src = imgSrc; img.alt = altText;
    img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain'; img.draggable = false;
    img.onerror = function() {
        console.error(`IMAGE LOAD ERROR: Src: "${this.src}". Card: ${JSON.stringify(card)}`); this.alt = `Failed: ${altText}`; cardDiv.classList.add('card-image-load-error');
    };
    cardDiv.appendChild(img);
    if (card) {
        cardDiv.cardData = card;
        cardDiv.id = `card-dom-${card.id || ((card.rank || 'X') + (card.suitKey || 'Y') + Math.random().toString(36).substring(2, 7))}`;
    }
    return cardDiv;
}
function displayMessage(message, isError = false) {
    if (!messageAreaElement) return; messageAreaElement.textContent = message; messageAreaElement.className = 'message-area';
    if (isError) messageAreaElement.classList.add('error');
    else if (message.toLowerCase().includes("backend says:") || message.toLowerCase().includes("服务器")) messageAreaElement.classList.add('info');
}
function displayScore(scoreText) { if (!scoreAreaElement) return; scoreAreaElement.textContent = scoreText; }
