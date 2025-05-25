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

// --- Image Path Configuration ---
// IMPORTANT: Adjust if your images are in a different location relative to index.html
const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';

function getCardImageFilename(card) {
    if (!card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined') {
        console.error("getCardImageFilename ERROR: Invalid card data:", card);
        return `unknown${CARD_IMAGE_EXTENSION}`;
    }
    const rankKey = card.rank.toUpperCase();
    const rankPart = RANK_FILENAME_PART[rankKey];
    const suitInfo = SUITS_DATA[card.suitKey]; // Assuming suitKey from backend matches SUITS_DATA keys
    const suitPart = suitInfo ? suitInfo.fileNamePart : null;

    // console.log(`getCardImageFilename - Card: ${JSON.stringify(card)}, RankKey: ${rankKey}, RankPart: ${rankPart}, SuitInfo: ${JSON.stringify(suitInfo)}, SuitPart: ${suitPart}`);

    if (!rankPart) {
        console.error(`getCardImageFilename ERROR: No filename part for rank '${rankKey}'. Card:`, card);
        return `unknown_rank_${card.rank}${CARD_IMAGE_EXTENSION}`;
    }
    if (!suitPart) {
        console.error(`getCardImageFilename ERROR: No filename part for suitKey '${card.suitKey}'. Card:`, card);
        return `unknown_suit_${card.suitKey}${CARD_IMAGE_EXTENSION}`;
    }
    return `${rankPart}_of_${suitPart}${CARD_IMAGE_EXTENSION}`;
}

function getCardImagePath(card) {
    const filename = getCardImageFilename(card);
    const fullPath = CARD_IMAGE_PATH_PREFIX + filename;
    // console.log("Attempting to get image path. Card:", JSON.stringify(card), "Path:", fullPath);
    return fullPath;
}

function getCardBackImagePath() {
    return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION;
}

// --- Core Game Logic Helper Functions ---
function getRankValue(card, aceAsOne = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOne && rankUpper === "A") return 1;
    return RANK_VALUES[rankUpper] || 0;
}

function sortCards(cards, aceAsOneInStraightContext = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneInStraightContext && cards.length === 5);
        const valB = getRankValue(b, aceAsOneInStraightContext && cards.length === 5);
        return ascending ? valA - valB : valB - valA;
    });
}

// --- START: CRITICAL GAME LOGIC - REPLACE WITH YOUR FULL IMPLEMENTATIONS ---
// The following functions (evaluateHand, compareHandInfos, checkDaoshui)
// are placeholders. You MUST provide your complete and correct logic for these.
function evaluateHand(cards) {
    // console.log("evaluateHand received cards:", cards);
    if (!cards || !Array.isArray(cards)) {
        // console.warn("evaluateHand: Invalid input - not an array or null/undefined", cards);
        return { type: HAND_TYPES.HIGH_CARD, message: "无效输入", ranks: [], originalCards: cards };
    }
    const cardCount = cards.length;
    if (cardCount !== 3 && cardCount !== 5) {
        // console.warn(`evaluateHand: Invalid card count (${cardCount})`, cards);
        return { type: HAND_TYPES.HIGH_CARD, message: `无效牌数(${cardCount})`, ranks: [], originalCards: cards };
    }
    if (cards.some(card => !card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined')) {
        // console.warn("evaluateHand: Array contains invalid card objects", cards);
        return { type: HAND_TYPES.HIGH_CARD, message: "牌数据错误", ranks: [], originalCards: cards };
    }

    // ** PASTE YOUR FULL, WORKING evaluateHand LOGIC HERE **
    // This is a highly simplified placeholder for demonstration.
    let ranks = cards.map(c => getRankValue(c)).sort((a, b) => b - a); // Sort ranks descending for high card
    let message = HAND_TYPE_MESSAGES[HAND_TYPES.HIGH_CARD];
    // Add more sophisticated logic here to determine actual hand type
    // For example, if it's a pair, three of a kind, straight, flush, etc.
    // and update 'message' and 'type' accordingly.

    // Example: Basic pair check (very simplified)
    if (cardCount === 5 || cardCount === 3) { // Simplified
        const rankCounts = {};
        ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
        if (Object.values(rankCounts).includes(2)) message = HAND_TYPE_MESSAGES[HAND_TYPES.PAIR];
        if (Object.values(rankCounts).includes(3)) message = HAND_TYPE_MESSAGES[HAND_TYPES.THREE_OF_A_KIND];
        // This needs to be much more robust for all hand types.
    }

    return { type: HAND_TYPES.HIGH_CARD, ranks: ranks, message: message, originalCards: cards };
}

function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') {
        // console.warn("compareHandInfos: Invalid handInfo input", handInfo1, handInfo2);
        return 0;
    }
    if (handInfo1.type !== handInfo2.type) {
        return handInfo1.type > handInfo2.type ? 1 : -1;
    }
    // ** PASTE YOUR FULL, WORKING compareHandInfos LOGIC HERE for same-type comparisons **
    // Placeholder: Compare by highest card if types are same (very simplified)
    if (handInfo1.ranks && handInfo2.ranks) {
        for (let i = 0; i < Math.min(handInfo1.ranks.length, handInfo2.ranks.length); i++) {
            if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
            if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
        }
    }
    return 0; // Tie
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo ||
        typeof topInfo.type === 'undefined' ||
        typeof middleInfo.type === 'undefined' ||
        typeof bottomInfo.type === 'undefined') {
        // console.warn("checkDaoshui: One or more hand infos are incomplete.");
        return true; // Fail safe, consider it daoshui
    }
    // ** PASTE YOUR FULL, WORKING checkDaoshui LOGIC HERE **
    if (compareHandInfos(topInfo, middleInfo) > 0) {
        // console.log("Daoshui: Top > Middle");
        return true;
    }
    if (compareHandInfos(middleInfo, bottomInfo) > 0) {
        // console.log("Daoshui: Middle > Bottom");
        return true;
    }
    return false;
}
// --- END: CRITICAL GAME LOGIC - REPLACE WITH YOUR FULL IMPLEMENTATIONS ---
