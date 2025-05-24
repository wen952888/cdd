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
    THIRTEEN_CARDS_SPECIAL_BASE: 100, SIX_PAIRS_PLUS: 101,
    THREE_FLUSHES_THIRTEEN: 102, THREE_STRAIGHTS_THIRTEEN: 103, ALL_SMALL: 104,
    ALL_BIG: 105, SAME_COLOR: 106, THREE_SETS_OF_TRIPS: 107,
    FIVE_PAIRS_AND_TRIPS: 108, TWELVE_ROYALS: 109, DRAGON: 110, ROYAL_DRAGON: 111,
};

const HAND_TYPE_MESSAGES = {
    [HAND_TYPES.HIGH_CARD]: "乌龙", [HAND_TYPES.PAIR]: "对子", [HAND_TYPES.TWO_PAIR]: "两对",
    [HAND_TYPES.THREE_OF_A_KIND]: "三条", [HAND_TYPES.STRAIGHT]: "顺子", [HAND_TYPES.FLUSH]: "同花",
    [HAND_TYPES.FULL_HOUSE]: "葫芦", [HAND_TYPES.FOUR_OF_A_KIND]: "铁支", [HAND_TYPES.STRAIGHT_FLUSH]: "同花顺",
    [HAND_TYPES.SIX_PAIRS_PLUS]: "六对半", [HAND_TYPES.THREE_FLUSHES_THIRTEEN]: "三同花（特殊）",
    [HAND_TYPES.THREE_STRAIGHTS_THIRTEEN]: "三顺子（特殊）", [HAND_TYPES.ALL_SMALL]: "全小",
    [HAND_TYPES.ALL_BIG]: "全大", [HAND_TYPES.SAME_COLOR]: "凑一色",
    [HAND_TYPES.THREE_SETS_OF_TRIPS]: "三套三条", [HAND_TYPES.FIVE_PAIRS_AND_TRIPS]: "五对三条",
    [HAND_TYPES.TWELVE_ROYALS]: "十二皇族", [HAND_TYPES.DRAGON]: "一条龙", [HAND_TYPES.ROYAL_DRAGON]: "至尊清龙",
};

const CARD_IMAGE_PATH_PREFIX = 'images/cards/'; // Path relative to index.html
const CARD_IMAGE_EXTENSION = '.png';
const UNKNOWN_CARD_FILENAME = `unknown${CARD_IMAGE_EXTENSION}`;

function getCardImageFilename(card) {
    if (!card || typeof card.rank !== 'string' || typeof card.suitKey !== 'string') {
        // console.error("getCardImageFilename ERROR: Invalid card data (rank or suitKey missing or not string). Card:", JSON.stringify(card));
        return UNKNOWN_CARD_FILENAME;
    }
    const rankKey = card.rank.toUpperCase();
    const rankPart = RANK_FILENAME_PART[rankKey];
    const suitInfo = SUITS_DATA[card.suitKey]; // Backend should send uppercase suitKey like "SPADES"
    const suitPart = suitInfo ? suitInfo.fileNamePart : null;

    // Optional: Add detailed logging here if problems persist
    // console.log(`DEBUG getCardImageFilename - Card: ${JSON.stringify(card)}, RankKey: ${rankKey}, RankPart: ${rankPart}, SuitInfo: ${JSON.stringify(suitInfo)}, SuitPart: ${suitPart}`);

    if (!rankPart) {
        // console.error(`getCardImageFilename ERROR: No filename part for rank '${rankKey}'. Card:`, JSON.stringify(card));
        return `unknown_rank_${card.rank.toLowerCase()}${CARD_IMAGE_EXTENSION}`;
    }
    if (!suitPart) {
        // console.error(`getCardImageFilename ERROR: No filename part for suitKey '${card.suitKey}'. Card:`, JSON.stringify(card));
        return `unknown_suit_${card.suitKey.toLowerCase()}${CARD_IMAGE_EXTENSION}`;
    }
    return `${rankPart}_of_${suitPart}${CARD_IMAGE_EXTENSION}`;
}

function getCardImagePath(card) {
    const filename = getCardImageFilename(card);
    if (!filename || typeof filename !== 'string') {
        console.error("getCardImagePath ERROR: getCardImageFilename returned invalid value:", filename, "For card:", JSON.stringify(card));
        return CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME;
    }
    const fullPath = CARD_IMAGE_PATH_PREFIX + filename;
    // console.log("Attempting to get image path. Card:", JSON.stringify(card), "Path:", fullPath); // Keep this log for debugging
    return fullPath;
}

function getCardBackImagePath() {
    return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION;
}

function getRankValue(card, aceAsOneForStraight = false) { /* ... (Full function from previous correct version) ... */ }
function sortHandCardsForDisplay(cards) { /* ... (Full function from previous correct version) ... */ }
function sortCardsByRankValue(cards, aceAsOneForStraight = false, ascending = false) { /* ... (Full function from previous correct version) ... */ }
function evaluateThirteenCardSpecial(thirteenCards) { /* ... (Full function from previous correct version, or your implementation) ... */ return null; }

// --- PASTE YOUR FULL, CORRECT evaluateHand, compareHandInfos, checkDaoshui functions here ---
// The versions below are simplified placeholders and WILL NOT WORK for actual game play.
// You MUST replace these with your complete and correct implementations.
function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards)) return { type: HAND_TYPES.HIGH_CARD, message: "无效牌", ranks: [], isSpecial: false };
    const cardCount = cards.length;
    if (cardCount !==3 && cardCount !==5) return { type: HAND_TYPES.HIGH_CARD, message: `无效牌数(${cardCount})`, ranks: [], isSpecial: false };
    // This is a highly simplified placeholder. Replace with your actual logic.
    let ranks = cards.map(c => getRankValue(c)).sort((a,b) => b-a);
    return { type: HAND_TYPES.HIGH_CARD, ranks: ranks, message: HAND_TYPE_MESSAGES[HAND_TYPES.HIGH_CARD], originalCards: cards, isSpecial: false };
}
function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2) return 0;
    if (handInfo1.isSpecial && !handInfo2.isSpecial) return 1; // Special beats regular
    if (!handInfo1.isSpecial && handInfo2.isSpecial) return -1; // Regular loses to special
    if (handInfo1.type !== handInfo2.type) return handInfo1.type > handInfo2.type ? 1 : -1;
    if (handInfo1.ranks && handInfo2.ranks) {
        for (let i=0; i<Math.min(handInfo1.ranks.length, handInfo2.ranks.length); i++) {
            if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
            if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
        }
    }
    return 0;
}
function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo || topInfo.isSpecial || middleInfo.isSpecial || bottomInfo.isSpecial) return true;
    if (compareHandInfos(topInfo, middleInfo) > 0) return true;
    if (compareHandInfos(middleInfo, bottomInfo) > 0) return true;
    return false;
}
// --- END OF PLACEHOLDERS - ENSURE YOU HAVE YOUR FULL LOGIC ---
