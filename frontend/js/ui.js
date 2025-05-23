// UI manipulation
const playerHandElement = document.getElementById('player-hand');
const messageAreaElement = document.getElementById('message-area');

function renderCard(card) {
    const cardImage = document.createElement('img');
    cardImage.classList.add('card-image');
    cardImage.src = getCardImageSrc(card);
    cardImage.alt = getCardAltText(card);
    // You might want to set width/height here or in CSS
    // cardImage.style.width = "70px"; // Example
    // cardImage.style.height = "100px"; // Example

    return cardImage;
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
