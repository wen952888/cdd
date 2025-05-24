// frontend/js/ui.js

const messageAreaElement = document.getElementById('message-area');
const scoreAreaElement = document.getElementById('score-area');

function renderCard(card, isFaceUp = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css');

    const img = document.createElement('img');
    let altText = "Card Image";
    let imgSrc = ""; // Variable to hold the final image source

    if (isFaceUp) {
        if (typeof getCardImagePath !== 'function') {
            console.error("renderCard CRITICAL ERROR: getCardImagePath function is not defined. Is game.js loaded BEFORE ui.js?");
            img.alt = "Error: Image path function missing";
            // Potentially set a placeholder src like 'images/error.png' or leave it to break visibly
        } else {
            imgSrc = getCardImagePath(card); // getCardImagePath is from game.js
            altText = card && card.rank && card.suitKey ? `${RANK_FILENAME_PART[card.rank.toUpperCase()] || card.rank} of ${SUITS_DATA[card.suitKey] ? SUITS_DATA[card.suitKey].fileNamePart : card.suitKey}` : "Playing card";
            console.log(`renderCard: Setting FACE UP image for card ${JSON.stringify(card)} to src: ${imgSrc}`); // DETAILED LOG
        }
    } else {
        // This part is for if you ever want to show card backs, e.g., for an opponent's hand
        if (typeof getCardBackImagePath !== 'function') {
            console.error("renderCard CRITICAL ERROR: getCardBackImagePath function is not defined.");
            img.alt = "Error: Card back path function missing";
        } else {
            imgSrc = getCardBackImagePath(); // getCardBackImagePath is from game.js
            altText = "Card Back";
            console.log(`renderCard: Setting CARD BACK image. src: ${imgSrc}`); // DETAILED LOG
        }
    }
    img.src = imgSrc; // Set the source
    img.alt = altText;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain'; // Or 'cover' etc.
    img.draggable = false;

    // Error handling for image loading itself
    img.onerror = function() {
        console.error(`renderCard ERROR: Failed to load image for src: ${imgSrc}. Card data: ${JSON.stringify(card)}`);
        // Optionally, set a fallback image or style
        // this.src = 'images/cards/fallback_image.png'; // Make sure this fallback exists
        this.alt = `Failed to load: ${altText}`;
        cardDiv.classList.add('card-image-load-error'); // Add a class for styling error state
    };
    img.onload = function() {
        // console.log(`renderCard INFO: Successfully loaded image: ${imgSrc}`); // Optional: for successful loads
    };


    cardDiv.appendChild(img);

    if (card) {
        cardDiv.cardData = card;
        // Ensure ID is sufficiently unique if many cards are re-rendered often
        cardDiv.id = `card-dom-${card.id || (card.rank + card.suitKey + Math.random().toString(36).substr(2, 7))}`;
    }
    return cardDiv;
}

// ... (displayMessage and displayScore functions remain the same) ...
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
