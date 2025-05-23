// --- Card Data ---
const SUITS_DATA = {
    SPADES:   { displayChar: "♠", cssClass: "spades" },
    HEARTS:   { displayChar: "♥", cssClass: "hearts" },
    DIAMONDS: { displayChar: "♦", cssClass: "diamonds" },
    CLUBS:    { displayChar: "♣", cssClass: "clubs" }
};

// Ranks: For logic and display
const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
// 我们不再需要 RANK_TO_FILENAME_PART
// 我们不再需要 ASSETS_CARDS_PATH

function createDeck() {
    const deck = [];
    for (const suitKey in SUITS_DATA) {
        const suitInfo = SUITS_DATA[suitKey];
        for (const rank of RANKS_LOGIC_DISPLAY) {
            deck.push({
                suitKey: suitKey,         // "SPADES", "HEARTS", etc.
                rank: rank,               // "A", "K", "10", "2"
                displaySuitChar: suitInfo.displayChar, // "♠", "♥"
                suitCssClass: suitInfo.cssClass      // "spades", "hearts"
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

// 不再需要 getCardImageSrc 和 getCardAltText 函数了

// More complex thirteen water logic (card evaluation, comparison) would go here.
