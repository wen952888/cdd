const dealButton = document.getElementById('deal-button');
const callBackendButton = document.getElementById('call-backend-button');

// IMPORTANT: Use your actual backend URL
const API_BASE_URL = 'https://wenge.cloudns.ch'; // Your backend domain

let deck = [];
let playerHand = [];

function initializeGame() {
    deck = createDeck();
    shuffleDeck(deck);
    // Clear hand and show initial message
    playerHandElement.innerHTML = '<p>点击 "发牌" 开始</p>';
    displayMessage("Game initialized. Click '发牌' to deal.");
}

dealButton.addEventListener('click', () => {
    if (deck.length < 13) {
        initializeGame(); // Re-shuffle if not enough cards
    }
    playerHand = dealCards(deck, 13);
    // deck.splice(0, 13); // Remove dealt cards from deck - if you want the deck to deplete
    // For simplicity, we can just re-shuffle the full deck each time if desired for testing.
    // Or, ensure you have enough cards. For now, let's assume the game is reset or has enough.

    // If only 13 cards are dealt and game restarts on deal, re-initialize deck:
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = dealCards(deck, 13); // Deal 13 cards

    displayHand(playerHand);
    displayMessage("发牌完毕！");
});

callBackendButton.addEventListener('click', async () => {
    displayMessage("Calling backend...", false);
    try {
        const response = await fetch(`${API_BASE_URL}/api/index.php?action=hello`);

        if (!response.ok) {
            const errorText = await response.text(); // Get more error details
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        displayMessage(`Backend says: ${data.message} (Timestamp: ${data.timestamp})`, false);
    } catch (error) {
        console.error("Error calling backend:", error);
        displayMessage(`Error connecting to backend: ${error.message}`, true);
    }
});

// Initialize the game on load
initializeGame();
