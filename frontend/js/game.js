// frontend/js/game.js

const SUITS_DATA = {
    SPADES:   { displayChar: "♠", cssClass: "spades",   fileNamePart: "spades",   sortOrder: 4 },
    HEARTS:   { displayChar: "♥", cssClass: "hearts",   fileNamePart: "hearts",   sortOrder: 3 },
    CLUBS:    { displayChar: "♣", cssClass: "clubs",    fileNamePart: "clubs",    sortOrder: 2 },
    DIAMONDS: { displayChar: "♦", cssClass: "diamonds", fileNamePart: "diamonds", sortOrder: 1 }
};

const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const RANK_FILENAME_PART = {
    "A": "ace", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
    "8": "8", "9": "9", "10": "10", "J": "jack", "Q": "queen", "K": "king"
};

const RANK_VALUES = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};

const HAND_TYPES = {
    HIGH_CARD: 0, PAIR: 1, TWO_PAIR: 2, THREE_OF_A_KIND: 3, STRAIGHT: 4,
    FLUSH: 5, FULL_HOUSE: 6, FOUR_OF_A_KIND: 7, STRAIGHT_FLUSH: 8,
};
const HAND_TYPE_MESSAGES = {
    [HAND_TYPES.HIGH_CARD]: "乌龙", [HAND_TYPES.PAIR]: "对子", [HAND_TYPES.TWO_PAIR]: "两对",
    [HAND_TYPES.THREE_OF_A_KIND]: "三条", [HAND_TYPES.STRAIGHT]: "顺子", [HAND_TYPES.FLUSH]: "同花",
    [HAND_TYPES.FULL_HOUSE]: "葫芦", [HAND_TYPES.FOUR_OF_A_KIND]: "铁支", [HAND_TYPES.STRAIGHT_FLUSH]: "同花顺",
};

const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';

function getCardImageFilename(card) {
    if (!card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined') {
        console.error("getCardImageFilename ERROR: Invalid card data:", card); return `unknown${CARD_IMAGE_EXTENSION}`;
    }
    const rankKey = card.rank.toUpperCase(); const rankPart = RANK_FILENAME_PART[rankKey];
    const suitInfo = SUITS_DATA[card.suitKey]; const suitPart = suitInfo ? suitInfo.fileNamePart : null;
    if (!rankPart) { console.error(`getCardImageFilename ERROR: No part for rank '${rankKey}'.`, card); return `unknown_rank_${card.rank}${CARD_IMAGE_EXTENSION}`; }
    if (!suitPart) { console.error(`getCardImageFilename ERROR: No part for suit '${card.suitKey}'.`, card); return `unknown_suit_${card.suitKey}${CARD_IMAGE_EXTENSION}`; }
    return `${rankPart}_of_${suitPart}${CARD_IMAGE_EXTENSION}`;
}
function getCardImagePath(card) { return CARD_IMAGE_PATH_PREFIX + getCardImageFilename(card); }
function getCardBackImagePath() { return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION; }

function getRankValue(card, aceAsOne = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOne && rankUpper === "A") return 1;
    return RANK_VALUES[rankUpper] || 0;
}

/**
 * Sorts cards for UI display: Rank descending (A,K,Q...), then Suit descending (Spades, Hearts, Clubs, Diamonds).
 * @param {Array<object>} cards Array of card objects.
 * @returns {Array<object>} New sorted array of card objects.
 */
function sortHandCardsForDisplay(cards) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((cardA, cardB) => {
        const rankValueA = getRankValue(cardA);
        const rankValueB = getRankValue(cardB);
        if (rankValueA !== rankValueB) return rankValueB - rankValueA; // Rank descending
        const suitOrderA = SUITS_DATA[cardA.suitKey] ? SUITS_DATA[cardA.suitKey].sortOrder : 0;
        const suitOrderB = SUITS_DATA[cardB.suitKey] ? SUITS_DATA[cardB.suitKey].sortOrder : 0;
        return suitOrderB - suitOrderA; // Suit descending by sortOrder
    });
}

// This sortCards is for internal logic like straight detection, may differ from display sort.
function sortCards(cards, aceAsOneInStraightContext = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneInStraightContext && (cards.length === 5 || cards.length === 3) ); // Adjusted for 3-card straights too
        const valB = getRankValue(b, aceAsOneInStraightContext && (cards.length === 5 || cards.length === 3) );
        return ascending ? valA - valB : valB - valA;
    });
}

// --- PASTE YOUR FULL, CORRECT evaluateHand, compareHandInfos, checkDaoshui functions here ---
// The versions below are placeholders and WILL NOT WORK for actual game play.
function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards)) return { type: HAND_TYPES.HIGH_CARD, message: "无效牌" };
    const cardCount = cards.length;
    if (cardCount !==3 && cardCount !==5) return { type: HAND_TYPES.HIGH_CARD, message: `无效牌数(${cardCount})` };
    let ranks = cards.map(c => getRankValue(c)).sort((a,b) => b-a); // Example sort
    // !!! REPLACE WITH YOUR ACTUAL, FULL EVALUATION LOGIC !!!
    return { type: HAND_TYPES.HIGH_CARD, ranks: ranks, message: HAND_TYPE_MESSAGES[HAND_TYPES.HIGH_CARD], originalCards: cards };
}
function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2) return 0;
    if (handInfo1.type !== handInfo2.type) return handInfo1.type > handInfo2.type ? 1 : -1;
    // !!! REPLACE WITH YOUR ACTUAL, FULL COMPARISON LOGIC FOR SAME HAND TYPES !!!
    if (handInfo1.ranks && handInfo2.ranks) { // Simplified comparison
        for (let i=0; i<Math.min(handInfo1.ranks.length, handInfo2.ranks.length); i++) {
            if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
            if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
        }
    }
    return 0;
}
function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo) return true; // Fail safe
    // !!! REPLACE WITH YOUR ACTUAL, FULL DAOSHUI CHECK USING compareHandInfos !!!
    if (compareHandInfos(topInfo, middleInfo) > 0) return true;
    if (compareHandInfos(middleInfo, bottomInfo) > 0) return true;
    return false;
}
// --- END OF PLACEHOLDERS - ENSURE YOU HAVE YOUR FULL LOGIC ---
