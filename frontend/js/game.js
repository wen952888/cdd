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
const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';
const UNKNOWN_CARD_FILENAME = `unknown${CARD_IMAGE_EXTENSION}`;

function getCardImageFilename(card) {
    if (!card || typeof card.rank !== 'string' || typeof card.suitKey !== 'string') {
        // console.error("getCardImageFilename ERROR: Invalid card data. Card:", JSON.stringify(card));
        return UNKNOWN_CARD_FILENAME;
    }
    const rankKey = card.rank.toUpperCase(); const rankPart = RANK_FILENAME_PART[rankKey];
    const suitInfo = SUITS_DATA[card.suitKey]; const suitPart = suitInfo ? suitInfo.fileNamePart : null;
    if (!rankPart) { /* console.error(...); */ return `unknown_rank_${card.rank.toLowerCase()}${CARD_IMAGE_EXTENSION}`; }
    if (!suitPart) { /* console.error(...); */ return `unknown_suit_${card.suitKey.toLowerCase()}${CARD_IMAGE_EXTENSION}`; }
    return `${rankPart}_of_${suitPart}${CARD_IMAGE_EXTENSION}`;
}
function getCardImagePath(card) {
    const filename = getCardImageFilename(card);
    if (!filename || typeof filename !== 'string') { return CARD_IMAGE_PATH_PREFIX + UNKNOWN_CARD_FILENAME; }
    return CARD_IMAGE_PATH_PREFIX + filename;
}
function getCardBackImagePath() { return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION; }
function getRankValue(card, aceAsOne = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOne && rankUpper === "A") return 1;
    return RANK_VALUES[rankUpper] || 0;
}
function sortHandCardsForDisplay(cards) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((cardA, cardB) => {
        const rA = getRankValue(cardA), rB = getRankValue(cardB); if (rA !== rB) return rB - rA;
        const sA = SUITS_DATA[cardA.suitKey]?.sortOrder || 0, sB = SUITS_DATA[cardB.suitKey]?.sortOrder || 0;
        return sB - sA;
    });
}
function sortCardsByRankValue(cards, aceAsOne = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a,b) => (ascending?1:-1)*(getRankValue(a,aceAsOne) - getRankValue(b,aceAsOne)));
}
function evaluateThirteenCardSpecial(thirteenCards) { /* ... (Full function from previous, or your implementation) ... */ return null; }

// --- REPLACE THE FOLLOWING 3 FUNCTIONS WITH YOUR FULL, WORKING LOGIC ---
function evaluateHand(cards) {
    // This is a VERY basic placeholder. You NEED your full logic here.
    if (!cards || !Array.isArray(cards)) return { type: HAND_TYPES.HIGH_CARD, message: "无效牌", ranks: [], isSpecial: false };
    const count = cards.length;
    if (count !== 3 && count !== 5) return { type: HAND_TYPES.HIGH_CARD, message: `牌数错误(${count})`, ranks: [], isSpecial: false };
    const ranks = sortCardsByRankValue(cards, false, false).map(c => getRankValue(c));
    return { type: HAND_TYPES.HIGH_CARD, ranks: ranks, message: HAND_TYPE_MESSAGES[HAND_TYPES.HIGH_CARD], originalCards: cards, isSpecial: false };
}
function compareHandInfos(h1, h2) {
    // This is a VERY basic placeholder. You NEED your full logic here.
    if (!h1 || !h2) return 0;
    if (h1.isSpecial && !h2.isSpecial) return 1; if (!h1.isSpecial && h2.isSpecial) return -1;
    if (h1.type !== h2.type) return h1.type > h2.type ? 1 : -1;
    if (h1.ranks && h2.ranks) { for (let i = 0; i < h1.ranks.length; i++) { if (h1.ranks[i] !== h2.ranks[i]) return h1.ranks[i] > h2.ranks[i] ? 1 : -1; } }
    return 0;
}
function checkDaoshui(top, middle, bottom) {
    // This is a VERY basic placeholder. You NEED your full logic here.
    if (!top || !middle || !bottom || top.isSpecial || middle.isSpecial || bottom.isSpecial) return true;
    if (compareHandInfos(top, middle) > 0) return true;
    if (compareHandInfos(middle, bottom) > 0) return true;
    return false;
}
// --- END OF PLACEHOLDERS ---
