// --- Card Data ---
// Using objects for suits to store display symbol and filename part
const SUIT_DATA = {
    SPADES:   { display: "♠", filename: "spades" },
    HEARTS:   { display: "♥", filename: "hearts" },
    DIAMONDS: { display: "♦", filename: "diamonds" },
    CLUBS:    { display: "♣", filename: "clubs" }
};

// Ranks: For logic and display, and a mapping for filenames
const RANKS_LOGIC_DISPLAY = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_TO_FILENAME_PART = {
    "A": "ace", "K": "king", "Q": "queen", "J": "jack",
    "10": "10", "9": "9", "8": "8", "7": "7", "6": "6",
    "5": "5", "4": "4", "3": "3", "2": "2"
};

const ASSETS_CARDS_PATH = 'assets/cards/'; // Path to your card images

function createDeck() {
    const deck = [];
    for (const suitKey in SUIT_DATA) { // "SPADES", "HEARTS", etc.
        const suitInfo = SUIT_DATA[suitKey];
        for (const rank of RANKS_LOGIC_DISPLAY) {
            deck.push({
                suitKey: suitKey, // "SPADES"
                rank: rank,       // "A", "K", "10", "2"
                displaySuit: suitInfo.display,
                filenameSuit: suitInfo.filename,
                filenameRank: RANK_TO_FILENAME_PART[rank]
            });
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealCards(deck, numberOfCards) {
    return deck.slice(0, numberOfCards);
}

function getCardImageSrc(card) {
    if (!card || !card.filenameRank || !card.filenameSuit) {
        console.error("Invalid card data for image source:", card);
        return `${ASSETS_CARDS_PATH}back.png`; // Fallback or error image
    }
    return `${ASSETS_CARDS_PATH}${card.filenameRank}_of_${card.filenameSuit}.png`;
}

function getCardAltText(card) {
    if (!card || !card.rank || !card.suitKey) {
        return "Card";
    }
    // Capitalize first letter of suit for alt text
    const suitName = card.filenameSuit.charAt(0).toUpperCase() + card.filenameSuit.slice(1);
    return `${card.rank} of ${suitName}`;
}
// More complex thirteen water logic (card evaluation, comparison) would go here.
