// frontend/js/game.js

// --- Card Data & Mappings ---
const SUITS_DATA = {
    SPADES:   { displayChar: "♠", cssClass: "spades",   fileNamePart: "spades"   },
    HEARTS:   { displayChar: "♥", cssClass: "hearts",   fileNamePart: "hearts"   },
    DIAMONDS: { displayChar: "♦", cssClass: "diamonds", fileNamePart: "diamonds" },
    CLUBS:    { displayChar: "♣", cssClass: "clubs",    fileNamePart: "clubs"    }
};

const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const RANK_FILENAME_PART = {
    "A": "ace", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
    "8": "8", "9": "9", "10": "10", "J": "jack", "Q": "queen", "K": "king"
};

const RANK_VALUES = { // Ace high default
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};
const RANK_VALUES_ACE_LOW = { // For A-5 straights
    "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13
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
        console.error("getCardImageFilename ERROR: Invalid card data:", card);
        return `unknown${CARD_IMAGE_EXTENSION}`; // Fallback image
    }
    const rankKey = String(card.rank).toUpperCase(); // Ensure rank is string for safety
    const rankPart = RANK_FILENAME_PART[rankKey];
    const suitInfo = SUITS_DATA[card.suitKey];
    const suitPart = suitInfo ? suitInfo.fileNamePart : null;

    if (!rankPart || !suitPart) {
        console.error(`getCardImageFilename ERROR: Invalid rank or suit. RankKey: ${rankKey}, SuitKey: ${card.suitKey}. Card:`, card);
        return `unknown_card${CARD_IMAGE_EXTENSION}`; // Generic unknown if parts fail
    }
    return `${rankPart}_of_${suitPart}${CARD_IMAGE_EXTENSION}`;
}

function getCardImagePath(card) {
    const filename = getCardImageFilename(card);
    return CARD_IMAGE_PATH_PREFIX + filename;
}

function getCardBackImagePath() {
    return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION;
}

function getRankValue(card, useAceLowSystem = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = String(card.rank).toUpperCase();
    if (useAceLowSystem) {
        return RANK_VALUES_ACE_LOW[rankUpper] || 0;
    }
    return RANK_VALUES[rankUpper] || 0;
}

// Sorts cards primarily by rank (descending), then optionally by suit (implementation specific if needed)
function sortCardsByRank(cards, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a); // Default Ace high for general sorting
        const valB = getRankValue(b);
        return ascending ? valA - valB : valB - valA;
    });
}

// --- Core Game Logic: evaluateHand, compareHandInfos, checkDaoshui ---
// (Assuming these functions are complex and have been refined as per previous discussions)
// Make sure they are robust and handle all card combinations correctly.

function evaluateHand(cards) {
    // ... (Your most up-to-date and tested evaluateHand logic here) ...
    // This function needs to be very robust.
    // For brevity, I'm not re-pasting the entire complex function,
    // but it should handle 3-card and 5-card hands, all poker types,
    // and return { type: HAND_TYPE, ranks: [...], message: "牌型", originalCards: cards }
    // Ensure `ranks` is correctly structured for `compareHandInfos`.

    // Placeholder if full logic is too long for this context:
    if (!cards || !Array.isArray(cards) || (cards.length !== 3 && cards.length !== 5)) {
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "无效牌数", originalCards: cards };
    }
    if (cards.some(c => !c || !c.rank || !c.suitKey)) {
         return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "牌数据错误", originalCards: cards };
    }
    // Simplified example for demonstration (replace with your full logic)
    const sortedRanks = cards.map(c => getRankValue(c)).sort((a,b) => b-a);
    let type = HAND_TYPES.HIGH_CARD;
    // Add logic for pair, three of a kind for 3-card hands
    // Add logic for all types for 5-card hands
    // This is where the full poker hand evaluation goes.
    if (cards.length === 3) {
        if (sortedRanks[0] === sortedRanks[1] && sortedRanks[1] === sortedRanks[2]) type = HAND_TYPES.THREE_OF_A_KIND;
        else if (sortedRanks[0] === sortedRanks[1] || sortedRanks[1] === sortedRanks[2]) type = HAND_TYPES.PAIR;
    } else if (cards.length === 5) {
        // Extremely simplified - needs full poker logic.
        // This is just to ensure it returns *something*.
        const rankCounts = {};
        sortedRanks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
        if (Object.values(rankCounts).includes(4)) type = HAND_TYPES.FOUR_OF_A_KIND;
        else if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2)) type = HAND_TYPES.FULL_HOUSE;
        // ... many more types
    }

    return { type: type, ranks: sortedRanks, message: HAND_TYPE_MESSAGES[type] || "计算中", originalCards: cards };
}

function compareHandInfos(handInfo1, handInfo2) {
    // ... (Your most up-to-date compareHandInfos logic) ...
    // Compares two handInfo objects (from evaluateHand).
    // Returns >0 if hand1 > hand2, <0 if hand1 < hand2, 0 if tie.
    // Must correctly compare based on type, then on structured `ranks`.
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') return 0;
    if (handInfo1.type !== handInfo2.type) return handInfo1.type > handInfo2.type ? 1 : -1;
    if (handInfo1.ranks && handInfo2.ranks) {
        for (let i = 0; i < Math.min(handInfo1.ranks.length, handInfo2.ranks.length); i++) {
            if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
            if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
        }
    }
    return 0;
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    // ... (Your most up-to-date checkDaoshui logic) ...
    // Returns true if Daoshui, false otherwise.
    // Uses compareHandInfos.
    if (!topInfo || !middleInfo || !bottomInfo || typeof topInfo.type === 'undefined' || typeof middleInfo.type === 'undefined' || typeof bottomInfo.type === 'undefined') return true; // Fail safe
    if (compareHandInfos(topInfo, middleInfo) > 0) return true;
    if (compareHandInfos(middleInfo, bottomInfo) > 0) return true;
    return false;
}
