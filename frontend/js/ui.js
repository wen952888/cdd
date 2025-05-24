// frontend/js/ui.js

const messageAreaElement = document.getElementById('message-area');
const scoreAreaElement = document.getElementById('score-area');

function renderCard(card, isFaceUp = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css');

    const img = document.createElement('img');
    let altText = "Playing Card";
    let imgSrc = ""; // Initialize imgSrc

    if (isFaceUp) {
        if (typeof getCardImagePath !== 'function' || typeof RANK_FILENAME_PART === 'undefined' || typeof SUITS_DATA === 'undefined') {
            console.error("renderCard CRITICAL ERROR: getCardImagePath or related data from game.js is not defined. Check script load order.");
            img.alt = "Error: Missing game data for card image";
            // Fallback to a known broken image or placeholder to make error visible
            imgSrc = CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME; // Use UNKNOWN_CARD_FILENAME from game.js
        } else {
            imgSrc = getCardImagePath(card); // From game.js
            const rankPartForAlt = card && card.rank ? (RANK_FILENAME_PART[card.rank.toUpperCase()] || card.rank) : "Unknown Rank";
            const suitPartForAlt = card && card.suitKey && SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].fileNamePart : "Unknown Suit";
            altText = `${rankPartForAlt} of ${suitPartForAlt}`;
            // console.log(`renderCard: Setting FACE UP image for card ${JSON.stringify(card)} to src: ${imgSrc}`);
        }
    } else { // Card back
        if (typeof getCardBackImagePath !== 'function') {
            console.error("renderCard CRITICAL ERROR: getCardBackImagePath from game.js is not defined.");
            img.alt = "Error: Missing game data for card back";
            imgSrc = CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME; // Fallback
        } else {
            imgSrc = getCardBackImagePath(); // From game.js
            altText = "Card Back";
            // console.log(`renderCard: Setting CARD BACK image. src: ${imgSrc}`);
        }
    }
    img.src = imgSrc; // Set the source
    img.alt = altText;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.draggable = false;

    img.onerror = function() {
        console.error(`renderCard IMAGE LOAD ERROR: Failed to load image. Attempted src: "${this.src}". Card data: ${JSON.stringify(card)}`);
        this.alt = `Failed to load: ${altText}`;
        cardDiv.classList.add('card-image-load-error');
        // To make it very obvious something is wrong with this specific card's image:
        // this.src = CARD_IMAGE_PATH_PREFIX + 'error_card.png'; // You'd need an error_card.png
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
    messageAreaElement.textContent = message;
    messageAreaElement.className = 'message-area';
    if (isError) messageAreaElement.classList.add('error');
    else if (message.toLowerCase().includes("backend says:") || message.toLowerCase().includes("服务器"))
         messageAreaElement.classList.add('info');
}

function displayScore(scoreText) {
    if (!scoreAreaElement) { console.warn("displayScore: scoreAreaElement not found."); return; }
    scoreAreaElement.textContent = scoreText;
}
