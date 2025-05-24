// frontend/js/ui.js

const playerHandElement = document.getElementById('player-hand');
const topRowElement = document.getElementById('player-top-row');
const middleRowElement = document.getElementById('player-middle-row');
const bottomRowElement = document.getElementById('player-bottom-row');
const messageAreaElement = document.getElementById('message-area');
const scoreAreaElement = document.getElementById('score-area'); // Added for score display

/**
 * Renders a single card DOM element.
 * @param {object} card - The card data object (must include rank, displaySuitChar, suitCssClass).
 * @returns {HTMLElement} The card div element.
 */
function renderCard(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-css', card.suitCssClass);
    cardDiv.dataset.rank = card.rank;
    cardDiv.dataset.suit = card.displaySuitChar;
    cardDiv.cardData = card; // Attach full card object to the DOM element

    const centerSuitSpan = document.createElement('span');
    centerSuitSpan.classList.add('card-center-suit');
    centerSuitSpan.textContent = card.displaySuitChar;
    cardDiv.appendChild(centerSuitSpan);

    return cardDiv;
}

/**
 * Displays the initial 13 cards in the player's hand area.
 * @param {Array<object>} hand - Array of card objects.
 */
function displayInitialHand(hand) {
    if (!playerHandElement) {
        console.error("UI Error: playerHandElement not found!");
        return;
    }
    playerHandElement.innerHTML = ''; // Clear previous cards
    if (hand && Array.isArray(hand) && hand.length > 0) {
        hand.forEach(card => {
            if (card && card.rank && card.suitKey) {
                playerHandElement.appendChild(renderCard(card));
            } else {
                console.warn("Undefined or incomplete card object in hand array during displayInitialHand:", card);
            }
        });
    } else {
        // console.warn("Hand is not valid or empty in displayInitialHand:", hand);
        playerHandElement.innerHTML = '<p>点击 "发牌" 开始</p>'; // Placeholder if no cards
    }
}

/**
 * Updates the display of the organized hand rows (top, middle, bottom).
 * Also updates the evaluation text for each row and checks for daoshui.
 * @param {object} organizedHand - Object with top, middle, bottom arrays of card objects.
 */
function displayOrganizedHand(organizedHand) {
    if (!organizedHand) {
        console.error("UI Error: organizedHand data is missing!");
        return;
    }

    const renderRow = (rowElement, cards) => {
        if (!rowElement) return;
        rowElement.innerHTML = ''; // Clear previous cards
        if (cards && Array.isArray(cards)) {
            cards.forEach(card => {
                if (card && card.rank && card.suitKey) {
                    rowElement.appendChild(renderCard(card));
                }
            });
        }
    };

    renderRow(topRowElement, organizedHand.top);
    renderRow(middleRowElement, organizedHand.middle);
    renderRow(bottomRowElement, organizedHand.bottom);

    // Update evaluation text for each row
    const updateEvalTextForRow = (spanId, cardsInRow) => {
        const spanElement = document.getElementById(spanId);
        if (spanElement) {
            if (cardsInRow && cardsInRow.length > 0 &&
                ( (spanId.includes('top') && cardsInRow.length === 3) ||
                  ( (spanId.includes('middle') || spanId.includes('bottom')) && cardsInRow.length === 5) ||
                  (cardsInRow.length > 0) // general case if specific counts not met yet, show something
                )
            ) {
                const evalResult = evaluateHand(cardsInRow); // evaluateHand is in game.js
                spanElement.textContent = ` (${evalResult.message || '未知'})`;
                // Add class based on daoshui status later if needed
            } else {
                spanElement.textContent = ''; // Clear if not enough cards or no cards
            }
        }
    };

    updateEvalTextForRow('top-eval-text', organizedHand.top);
    updateEvalTextForRow('middle-eval-text', organizedHand.middle);
    updateEvalTextForRow('bottom-eval-text', organizedHand.bottom);

    // Client-side daoshui check for immediate feedback (server will re-validate)
    if (organizedHand.top && organizedHand.middle && organizedHand.bottom &&
        organizedHand.top.length === 3 && organizedHand.middle.length === 5 && organizedHand.bottom.length === 5) {
        const topEval = evaluateHand(organizedHand.top);
        const middleEval = evaluateHand(organizedHand.middle);
        const bottomEval = evaluateHand(organizedHand.bottom);
        if (checkDaoshui(topEval, middleEval, bottomEval)) {
            displayMessage("警告: 检测到倒水！请调整牌型。", true);
            // Visually indicate daoshui rows if desired
            topRowElement.classList.add('daoshui-warning');
            middleRowElement.classList.add('daoshui-warning');
            bottomRowElement.classList.add('daoshui-warning');

        } else {
            topRowElement.classList.remove('daoshui-warning');
            middleRowElement.classList.remove('daoshui-warning');
            bottomRowElement.classList.remove('daoshui-warning');
        }
    } else {
        // Clear warnings if card counts are not met for full check
        topRowElement.classList.remove('daoshui-warning');
        middleRowElement.classList.remove('daoshui-warning');
        bottomRowElement.classList.remove('daoshui-warning');
    }
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
