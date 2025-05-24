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

const RANK_VALUES = { // Ace is 14 for general comparison, 1 for A-5 straight
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};

const HAND_TYPES = {
    HIGH_CARD: 0,        // 乌龙
    PAIR: 1,             // 对子
    TWO_PAIR: 2,         // 两对
    THREE_OF_A_KIND: 3,  // 三条
    STRAIGHT: 4,         // 顺子
    FLUSH: 5,            // 同花
    FULL_HOUSE: 6,       // 葫芦
    FOUR_OF_A_KIND: 7,   // 铁支 (四梅)
    STRAIGHT_FLUSH: 8,   // 同花顺
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

function getCardImageFilename(card) { /* ... (same as previous correct version) ... */ }
function getCardImagePath(card) { /* ... (same as previous correct version) ... */ }
function getCardBackImagePath() { /* ... (same as previous correct version) ... */ }

function getRankValue(card, aceAsOneForStraight = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOneForStraight && rankUpper === "A") return 1;
    return RANK_VALUES[rankUpper] || 0;
}

function sortHandCardsForDisplay(cards) { /* ... (same as previous correct version) ... */ }

// Sorts cards by rank value, primarily for evaluation logic
function sortCardsByRankValue(cards, aceAsOneForStraight = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneForStraight);
        const valB = getRankValue(b, aceAsOneForStraight);
        return ascending ? valA - valB : valB - valA; // default descending
    });
}

// --- Evaluate 13-Card Special Hands ---
function evaluateThirteenCardSpecial(thirteenCards) {
    // This remains a placeholder. Implementing all these special 13-card hands
    // is a significant task and highly dependent on your specific rules.
    // You should implement this based on the special hands you want to support.
    // console.warn("evaluateThirteenCardSpecial is a placeholder and needs full implementation.");
    return null;
}

// --- Evaluate a single Dui (3 or 5 cards) ---
function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards) || (cards.length !== 3 && cards.length !== 5)) {
        return { type: HAND_TYPES.HIGH_CARD, message: "无效牌数", ranks: [], originalCards: cards, isSpecial: false };
    }
    if (cards.some(card => !card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined')) {
        return { type: HAND_TYPES.HIGH_CARD, message: "牌数据错误", ranks: [], originalCards: cards, isSpecial: false };
    }

    const n = cards.length;
    const sortedByRankDesc = sortCardsByRankValue(cards, false, false); // Ace=14, Desc
    const primaryRanks = sortedByRankDesc.map(c => getRankValue(c)); // For general comparison

    const suits = cards.map(c => c.suitKey);
    const isFlush = (n === 5 || n === 3) && new Set(suits).size === 1; // Allow 3-card flush if rules permit for head

    let isStraight = false;
    let straightHighCardRank = 0; // Actual rank value of straight's highest card (A in TJQKA -> 14, A in A2345 -> 5)
    if (n === 5 || n === 3) {
        const ranksForStraightAceLow = cards.map(c => getRankValue(c, true)).sort((a, b) => a - b); // Ace=1, Asc
        const uniqueRanksForStraight = [...new Set(ranksForStraightAceLow)];

        if (uniqueRanksForStraight.length >= n) {
            // Check for A-2-3-4-5 wheel (for 5 cards, or A-2-3 for 3 cards)
            if (uniqueRanksForStraight[0] === 1 && uniqueRanksForStraight[1] === 2 && uniqueRanksForStraight[n - 1] === n) { // Check if starts with Ace(1), 2 ... up to n
                let isWheelSeq = true;
                for(let i=0; i < n; i++) {
                    if(uniqueRanksForStraight[i] !== i + 1) {
                        isWheelSeq = false;
                        break;
                    }
                }
                if(isWheelSeq) {
                    isStraight = true;
                    straightHighCardRank = n; // For A23, high is 3. For A2345, high is 5.
                }
            }
            // General straight check (using Ace high, unless it's a wheel)
            if (!isStraight) {
                const uniqueAceHighDesc = [...new Set(primaryRanks)].sort((a,b)=>b-a);
                for (let i = 0; i <= uniqueAceHighDesc.length - n; i++) {
                    let currentSeq = true;
                    for (let j = 0; j < n - 1; j++) {
                        if (uniqueAceHighDesc[i + j] !== uniqueAceHighDesc[i + j + 1] + 1) {
                            currentSeq = false;
                            break;
                        }
                    }
                    if (currentSeq) {
                        isStraight = true;
                        straightHighCardRank = uniqueAceHighDesc[i];
                        break;
                    }
                }
            }
        }
    }

    const rankCounts = {};
    primaryRanks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const distinctRanksSorted = Object.keys(rankCounts).map(Number).sort((a,b)=>b-a);

    let handType = HAND_TYPES.HIGH_CARD;
    let ranksForComparison = [...primaryRanks];
    let specificHandInfo = {};

    if (n === 5) {
        if (isFlush && isStraight) {
            handType = HAND_TYPES.STRAIGHT_FLUSH; specificHandInfo.highCardRank = straightHighCardRank;
            ranksForComparison = straightHighCardRank === 5 ? [5,4,3,2,1] : primaryRanks.filter(r => r <= straightHighCardRank && r > straightHighCardRank - 5).sort((a,b)=>b-a);
        } else if (counts[0] === 4) {
            handType = HAND_TYPES.FOUR_OF_A_KIND;
            specificHandInfo.quadRank = distinctRanksSorted.find(r => rankCounts[r] === 4);
            specificHandInfo.kicker = distinctRanksSorted.find(r => rankCounts[r] === 1);
            ranksForComparison = [specificHandInfo.quadRank, specificHandInfo.kicker].filter(r => r !== undefined);
        } else if (counts[0] === 3 && counts[1] === 2) {
            handType = HAND_TYPES.FULL_HOUSE;
            specificHandInfo.threeRank = distinctRanksSorted.find(r => rankCounts[r] === 3);
            specificHandInfo.pairRank = distinctRanksSorted.find(r => rankCounts[r] === 2);
            ranksForComparison = [specificHandInfo.threeRank, specificHandInfo.pairRank];
        } else if (isFlush) {
            handType = HAND_TYPES.FLUSH; ranksForComparison = primaryRanks;
        } else if (isStraight) {
            handType = HAND_TYPES.STRAIGHT; specificHandInfo.highCardRank = straightHighCardRank;
            ranksForComparison = straightHighCardRank === 5 ? [5,4,3,2,1] : primaryRanks.filter(r => r <= straightHighCardRank && r > straightHighCardRank - 5).sort((a,b)=>b-a);
        } else if (counts[0] === 3) {
            handType = HAND_TYPES.THREE_OF_A_KIND;
            specificHandInfo.threeRank = distinctRanksSorted.find(r => rankCounts[r] === 3);
            specificHandInfo.kickers = primaryRanks.filter(r => r !== specificHandInfo.threeRank).sort((a,b)=>b-a).slice(0,2);
            ranksForComparison = [specificHandInfo.threeRank, ...specificHandInfo.kickers];
        } else if (counts[0] === 2 && counts[1] === 2) {
            handType = HAND_TYPES.TWO_PAIR;
            const pairs = distinctRanksSorted.filter(r => rankCounts[r] === 2).sort((a,b)=>b-a);
            specificHandInfo.highPair = pairs[0]; specificHandInfo.lowPair = pairs[1];
            specificHandInfo.kicker = distinctRanksSorted.find(r => rankCounts[r] === 1);
            ranksForComparison = [specificHandInfo.highPair, specificHandInfo.lowPair, specificHandInfo.kicker].filter(r => r !== undefined);
        } else if (counts[0] === 2) {
            handType = HAND_TYPES.PAIR;
            specificHandInfo.pairRank = distinctRanksSorted.find(r => rankCounts[r] === 2);
            specificHandInfo.kickers = primaryRanks.filter(r => r !== specificHandInfo.pairRank).sort((a,b)=>b-a).slice(0,3);
            ranksForComparison = [specificHandInfo.pairRank, ...specificHandInfo.kickers];
        }
    } else if (n === 3) { // Top Dui (or special 3-card if rules allow)
        if (counts[0] === 3) {
            handType = HAND_TYPES.THREE_OF_A_KIND; specificHandInfo.threeRank = primaryRanks[0];
            ranksForComparison = [specificHandInfo.threeRank];
        } else if (counts[0] === 2) {
            handType = HAND_TYPES.PAIR;
            specificHandInfo.pairRank = distinctRanksSorted.find(r => rankCounts[r] === 2);
            specificHandInfo.kicker = distinctRanksSorted.find(r => rankCounts[r] === 1);
            ranksForComparison = [specificHandInfo.pairRank, specificHandInfo.kicker].filter(r => r !== undefined);
        }
        // Standard 13-water head does NOT count 3-card flush or straight.
        // If your rules are different, add checks for isFlush & isStraight (n=3) here.
        // Example (if 3-card flushes/straights were valid and ranked above pairs):
        // if (isFlush && isStraight && n===3) { handType = HAND_TYPES.STRAIGHT_FLUSH; ...}
        // else if (isFlush && n===3) { handType = HAND_TYPES.FLUSH; ...}
        // else if (isStraight && n===3) { handType = HAND_TYPES.STRAIGHT; ...}
    }

    return {
        type: handType,
        ranks: ranksForComparison.filter(r => r !== undefined && r !== null),
        message: HAND_TYPE_MESSAGES[handType],
        originalCards: cards, isSpecial: false, ...specificHandInfo
    };
}

function compareHandInfos(h1, h2) {
    if (!h1 || !h2 || typeof h1.type === 'undefined' || typeof h2.type === 'undefined') return 0;
    const s1 = h1.type >= HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE, s2 = h2.type >= HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE;
    if (s1 && !s2) return 1; if (!s1 && s2) return -1;
    if (h1.type !== h2.type) return h1.type > h2.type ? 1 : -1;

    switch (h1.type) {
        case HAND_TYPES.STRAIGHT_FLUSH: case HAND_TYPES.STRAIGHT:
            return h1.highCardRank > h2.highCardRank ? 1 : (h1.highCardRank < h2.highCardRank ? -1 : 0);
        case HAND_TYPES.FOUR_OF_A_KIND:
            if (h1.quadRank !== h2.quadRank) return h1.quadRank > h2.quadRank ? 1 : -1;
            return h1.kicker > h2.kicker ? 1 : (h1.kicker < h2.kicker ? -1 : 0);
        case HAND_TYPES.FULL_HOUSE:
            if (h1.threeRank !== h2.threeRank) return h1.threeRank > h2.threeRank ? 1 : -1;
            return h1.pairRank > h2.pairRank ? 1 : (h1.pairRank < h2.pairRank ? -1 : 0);
        case HAND_TYPES.FLUSH: case HAND_TYPES.HIGH_CARD:
            for (let i=0; i<Math.min(h1.ranks.length, h2.ranks.length); i++) { if (h1.ranks[i] !== h2.ranks[i]) return h1.ranks[i] > h2.ranks[i] ? 1 : -1; } return 0;
        case HAND_TYPES.THREE_OF_A_KIND:
            if (h1.threeRank !== h2.threeRank) return h1.threeRank > h2.threeRank ? 1 : -1;
            if (h1.originalCards.length === 5 && h1.kickers && h2.kickers) { for (let i=0; i<Math.min(h1.kickers.length, h2.kickers.length); i++) { if (h1.kickers[i] !== h2.kickers[i]) return h1.kickers[i] > h2.kickers[i] ? 1 : -1; } } return 0;
        case HAND_TYPES.TWO_PAIR:
            if (h1.highPair !== h2.highPair) return h1.highPair > h2.highPair ? 1 : -1;
            if (h1.lowPair !== h2.lowPair) return h1.lowPair > h2.lowPair ? 1 : -1;
            return h1.kicker > h2.kicker ? 1 : (h1.kicker < h2.kicker ? -1 : 0);
        case HAND_TYPES.PAIR:
            if (h1.pairRank !== h2.pairRank) return h1.pairRank > h2.pairRank ? 1 : -1;
            const k1 = h1.originalCards.length === 5 ? h1.kickers : (h1.kicker !== undefined ? [h1.kicker] : []);
            const k2 = h2.originalCards.length === 5 ? h2.kickers : (h2.kicker !== undefined ? [h2.kicker] : []);
            if (k1 && k2) { for (let i=0; i<Math.min(k1.length, k2.length); i++) { if (k1[i] !== k2[i]) return k1[i] > k2[i] ? 1 : -1; } } return 0;
        default: return 0; // Default for unhandled or special types of same value
    }
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo || topInfo.isSpecial || middleInfo.isSpecial || bottomInfo.isSpecial) {
        console.warn("checkDaoshui with invalid/special hands for duix.", topInfo, middleInfo, bottomInfo); return true;
    }
    if (compareHandInfos(topInfo, middleInfo) > 0) { /* console.warn("Daoshui: Top > Middle"); */ return true; }
    if (compareHandInfos(middleInfo, bottomInfo) > 0) { /* console.warn("Daoshui: Middle > Bottom"); */ return true; }
    return false;
}
