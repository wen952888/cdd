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
    "J": 11, "Q": 12, "K": 13, "A": 14 // Ace high for general comparison
};

const HAND_TYPES = {
    HIGH_CARD: 0, PAIR: 1, TWO_PAIR: 2, THREE_OF_A_KIND: 3, STRAIGHT: 4,
    FLUSH: 5, FULL_HOUSE: 6, FOUR_OF_A_KIND: 7, STRAIGHT_FLUSH: 8,
    THIRTEEN_CARDS_SPECIAL_BASE: 100,
    SIX_PAIRS_PLUS: 101, THREE_FLUSHES_THIRTEEN: 102, THREE_STRAIGHTS_THIRTEEN: 103,
    ALL_SMALL: 104, ALL_BIG: 105, SAME_COLOR: 106, THREE_SETS_OF_TRIPS: 107, /* Renamed from FOUR_THREE_OF_A_KIND */
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

function getCardImageFilename(card) { /* ... (same as before) ... */ }
function getCardImagePath(card) { return CARD_IMAGE_PATH_PREFIX + getCardImageFilename(card); }
function getCardBackImagePath() { return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION; }

function getRankValue(card, aceAsOneForStraight = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOneForStraight && rankUpper === "A") return 1;
    return RANK_VALUES[rankUpper] || 0;
}

function sortHandCardsForDisplay(cards) { /* ... (same as before) ... */ }

function sortCardsByRankValue(cards, aceAsOneForStraight = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneForStraight);
        const valB = getRankValue(b, aceAsOneForStraight);
        return ascending ? valA - valB : valB - valA;
    });
}

// --- Evaluate 13-Card Special Hands ---
function evaluateThirteenCardSpecial(thirteenCards) { /* ... (same as my previous detailed version) ... */ }
// (Full evaluateThirteenCardSpecial from previous complete version, I'll omit here for brevity but assume it's present)

// --- Evaluate a single Dui (3 or 5 cards) ---
function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards) || (cards.length !== 3 && cards.length !== 5)) {
        return { type: HAND_TYPES.HIGH_CARD, message: "无效牌数", ranks: [], originalCards: cards, isSpecial: false };
    }
    if (cards.some(card => !card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined')) {
        return { type: HAND_TYPES.HIGH_CARD, message: "牌数据错误", ranks: [], originalCards: cards, isSpecial: false };
    }

    const n = cards.length;
    // Sort by rank descending (Ace high) for general purposes and tie-breaking.
    const sortedByRankDesc = sortCardsByRankValue(cards, false, false);
    const primaryRanks = sortedByRankDesc.map(c => getRankValue(c)); // Ace=14

    // For straight checks, we need ranks where Ace can be 1.
    const ranksForStraightCheckAceLow = cards.map(c => getRankValue(c, true)).sort((a, b) => a - b); // Ace=1, ascending

    const suits = cards.map(c => c.suitKey);
    const isFlush = new Set(suits).size === 1;

    // Straight check
    let isStraight = false;
    let straightHighCardRank = 0; // Stores the actual rank value of the straight's highest card (e.g., 14 for A in TJQKA, 5 for A in A2345)

    if (n === 5 || n === 3) { // Allow 3-card straights for head (if rules permit, usually not for comparison with 5-card straights)
        const uniqueRanks = [...new Set(ranksForStraightCheckAceLow)]; // Unique ranks, Ace as 1
        if (uniqueRanks.length >= n) {
            // Check for A-2-3-4-5 (wheel)
            if (n === 5 && uniqueRanks[0] === 1 && uniqueRanks[1] === 2 && uniqueRanks[2] === 3 && uniqueRanks[3] === 4 && uniqueRanks[4] === 5) {
                isStraight = true;
                straightHighCardRank = 5; // High card is 5 for comparison purposes
            } else {
                // General straight check (excluding wheel, which was checked above)
                // Use ranks where Ace is high (14) for this check, then sort descending.
                const uniqueAceHighDesc = [...new Set(primaryRanks)].sort((a,b)=>b-a);
                for (let i = 0; i <= uniqueAceHighDesc.length - n; i++) {
                    let isSeq = true;
                    for (let j = 0; j < n - 1; j++) {
                        if (uniqueAceHighDesc[i + j] !== uniqueAceHighDesc[i + j + 1] + 1) {
                            isSeq = false;
                            break;
                        }
                    }
                    if (isSeq) {
                        isStraight = true;
                        straightHighCardRank = uniqueAceHighDesc[i]; // Highest card of this straight
                        break;
                    }
                }
            }
        }
    }

    // Rank counts
    const rankCounts = {};
    primaryRanks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a); // e.g., [3,2] for full house
    const distinctRankValues = Object.keys(rankCounts).map(Number).sort((a,b)=>b-a);


    let handType = HAND_TYPES.HIGH_CARD;
    let ranksForComparison = [...primaryRanks]; // Default comparison is sorted primary ranks
    let specificHandInfo = {};

    // 5-Card Hand Logic
    if (n === 5) {
        if (isFlush && isStraight) {
            handType = HAND_TYPES.STRAIGHT_FLUSH;
            specificHandInfo.highCardRank = straightHighCardRank; // Use this for comparison
            // For ranks array, store the actual ranks of the straight flush, high to low
            ranksForComparison = straightHighCardRank === 5 ? [5,4,3,2,1] : primaryRanks.filter(r => r <= straightHighCardRank && r > straightHighCardRank - 5).sort((a,b)=>b-a);
        } else if (counts[0] === 4) {
            handType = HAND_TYPES.FOUR_OF_A_KIND;
            specificHandInfo.quadRank = distinctRankValues.find(r => rankCounts[r] === 4);
            specificHandInfo.kicker = distinctRankValues.find(r => rankCounts[r] === 1);
            ranksForComparison = [specificHandInfo.quadRank, specificHandInfo.kicker];
        } else if (counts[0] === 3 && counts[1] === 2) {
            handType = HAND_TYPES.FULL_HOUSE;
            specificHandInfo.threeRank = distinctRankValues.find(r => rankCounts[r] === 3);
            specificHandInfo.pairRank = distinctRankValues.find(r => rankCounts[r] === 2);
            ranksForComparison = [specificHandInfo.threeRank, specificHandInfo.pairRank];
        } else if (isFlush) {
            handType = HAND_TYPES.FLUSH;
            ranksForComparison = primaryRanks; // Already sorted high-low
        } else if (isStraight) {
            handType = HAND_TYPES.STRAIGHT;
            specificHandInfo.highCardRank = straightHighCardRank;
            ranksForComparison = straightHighCardRank === 5 ? [5,4,3,2,1] : primaryRanks.filter(r => r <= straightHighCardRank && r > straightHighCardRank - 5).sort((a,b)=>b-a);
        } else if (counts[0] === 3) {
            handType = HAND_TYPES.THREE_OF_A_KIND;
            specificHandInfo.threeRank = distinctRankValues.find(r => rankCounts[r] === 3);
            specificHandInfo.kickers = primaryRanks.filter(r => r !== specificHandInfo.threeRank).sort((a,b)=>b-a).slice(0,2);
            ranksForComparison = [specificHandInfo.threeRank, ...specificHandInfo.kickers];
        } else if (counts[0] === 2 && counts[1] === 2) {
            handType = HAND_TYPES.TWO_PAIR;
            const pairsRanks = distinctRankValues.filter(r => rankCounts[r] === 2).sort((a, b) => b - a);
            specificHandInfo.highPair = pairsRanks[0];
            specificHandInfo.lowPair = pairsRanks[1];
            specificHandInfo.kicker = distinctRankValues.find(r => rankCounts[r] === 1);
            ranksForComparison = [specificHandInfo.highPair, specificHandInfo.lowPair, specificHandInfo.kicker];
        } else if (counts[0] === 2) {
            handType = HAND_TYPES.PAIR;
            specificHandInfo.pairRank = distinctRankValues.find(r => rankCounts[r] === 2);
            specificHandInfo.kickers = primaryRanks.filter(r => r !== specificHandInfo.pairRank).sort((a,b)=>b-a).slice(0,3);
            ranksForComparison = [specificHandInfo.pairRank, ...specificHandInfo.kickers];
        }
    }
    // 3-Card Hand Logic (Top Dui)
    else if (n === 3) {
        if (counts[0] === 3) {
            handType = HAND_TYPES.THREE_OF_A_KIND;
            specificHandInfo.threeRank = primaryRanks[0]; // All same rank
            ranksForComparison = [specificHandInfo.threeRank];
        } else if (counts[0] === 2) {
            handType = HAND_TYPES.PAIR;
            specificHandInfo.pairRank = distinctRankValues.find(r => rankCounts[r] === 2);
            specificHandInfo.kicker = distinctRankValues.find(r => rankCounts[r] === 1);
            ranksForComparison = [specificHandInfo.pairRank, specificHandInfo.kicker];
        }
        // Standard 13-water head usually doesn't count 3-card flushes or straights
        // If your rules do, add checks for isFlush & isStraight (for n=3) here.
    }

    return {
        type: handType,
        ranks: ranksForComparison.filter(r => typeof r !== 'undefined' && r !== null), // Ensure no undefined/null in ranks
        message: HAND_TYPE_MESSAGES[handType],
        originalCards: cards,
        isSpecial: false, // This is for a standard 3 or 5 card segment
        ...specificHandInfo
    };
}

function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') return 0;

    // Handle special 13-card hands first if this function is ever used to compare them
    const isSpecial1 = handInfo1.type >= HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE;
    const isSpecial2 = handInfo2.type >= HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE;
    if (isSpecial1 && !isSpecial2) return 1;
    if (!isSpecial1 && isSpecial2) return -1;
    // If both are special or both are regular, proceed. Values in HAND_TYPES should handle ranking.

    if (handInfo1.type !== handInfo2.type) {
        return handInfo1.type > handInfo2.type ? 1 : -1;
    }

    // Same type, compare based on specific properties or ranks array
    switch (handInfo1.type) {
        case HAND_TYPES.STRAIGHT_FLUSH:
        case HAND_TYPES.STRAIGHT:
            return handInfo1.highCardRank > handInfo2.highCardRank ? 1 : (handInfo1.highCardRank < handInfo2.highCardRank ? -1 : 0);
        case HAND_TYPES.FOUR_OF_A_KIND:
            if (handInfo1.quadRank !== handInfo2.quadRank) return handInfo1.quadRank > handInfo2.quadRank ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.FULL_HOUSE:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            return handInfo1.pairRank > handInfo2.pairRank ? 1 : (handInfo1.pairRank < handInfo2.pairRank ? -1 : 0);
        case HAND_TYPES.FLUSH:
        case HAND_TYPES.HIGH_CARD: // Ranks array is primary comparison, already sorted high-low
            for (let i = 0; i < Math.min(handInfo1.ranks.length, handInfo2.ranks.length); i++) {
                if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
                if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
            }
            return 0;
        case HAND_TYPES.THREE_OF_A_KIND:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            if (handInfo1.originalCards.length === 5 && handInfo1.kickers && handInfo2.kickers) { // 5-card hand
                for (let i = 0; i < Math.min(handInfo1.kickers.length, handInfo2.kickers.length); i++) {
                    if (handInfo1.kickers[i] > handInfo2.kickers[i]) return 1;
                    if (handInfo1.kickers[i] < handInfo2.kickers[i]) return -1;
                }
            } // For 3-card three-of-a-kind, threeRank comparison is enough
            return 0;
        case HAND_TYPES.TWO_PAIR:
            if (handInfo1.highPair !== handInfo2.highPair) return handInfo1.highPair > handInfo2.highPair ? 1 : -1;
            if (handInfo1.lowPair !== handInfo2.lowPair) return handInfo1.lowPair > handInfo2.lowPair ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.PAIR:
            if (handInfo1.pairRank !== handInfo2.pairRank) return handInfo1.pairRank > handInfo2.pairRank ? 1 : -1;
            const kickers1 = handInfo1.originalCards.length === 5 ? handInfo1.kickers : (typeof handInfo1.kicker !== 'undefined' ? [handInfo1.kicker] : []);
            const kickers2 = handInfo2.originalCards.length === 5 ? handInfo2.kickers : (typeof handInfo2.kicker !== 'undefined' ? [handInfo2.kicker] : []);
            if (kickers1 && kickers2) {
                for (let i = 0; i < Math.min(kickers1.length, kickers2.length); i++) {
                    if (kickers1[i] > kickers2[i]) return 1;
                    if (kickers1[i] < kickers2[i]) return -1;
                }
            }
            return 0;
        default: // For special 13-card hands of the same type, or unknown types
            // If special hands have the same HAND_TYPE, they are considered equal unless specific tie-breaking rules exist for them.
            // For now, if types are equal (and special), consider them equal.
            return 0;
    }
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo ||
        typeof topInfo.type === 'undefined' || typeof middleInfo.type === 'undefined' || typeof bottomInfo.type === 'undefined' ||
        topInfo.isSpecial || middleInfo.isSpecial || bottomInfo.isSpecial) {
        console.warn("checkDaoshui called with invalid or special handInfo objects for duix.", topInfo, middleInfo, bottomInfo);
        return true; // Fail safe
    }
    const topVsMiddle = compareHandInfos(topInfo, middleInfo);
    if (topVsMiddle > 0) { console.warn("Daoshui: Top > Middle", topInfo, middleInfo); return true; }
    const middleVsBottom = compareHandInfos(middleInfo, bottomInfo);
    if (middleVsBottom > 0) { console.warn("Daoshui: Middle > Bottom", middleInfo, bottomInfo); return true; }
    return false;
}
