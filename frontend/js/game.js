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
    // Consider adding special十三水牌型 like ROYAL_FLUSH, FIVE_OF_A_KIND (if using jokers), etc.
    // For basic thirteen water, STRAIGHT_FLUSH is usually the highest standard.
};
const HAND_TYPE_MESSAGES = {
    [HAND_TYPES.HIGH_CARD]: "乌龙", [HAND_TYPES.PAIR]: "对子", [HAND_TYPES.TWO_PAIR]: "两对",
    [HAND_TYPES.THREE_OF_A_KIND]: "三条", [HAND_TYPES.STRAIGHT]: "顺子", [HAND_TYPES.FLUSH]: "同花",
    [HAND_TYPES.FULL_HOUSE]: "葫芦", [HAND_TYPES.FOUR_OF_A_KIND]: "铁支", [HAND_TYPES.STRAIGHT_FLUSH]: "同花顺",
};

const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';

function getCardImageFilename(card) { /* ... (same as your version) ... */ }
function getCardImagePath(card) { return CARD_IMAGE_PATH_PREFIX + getCardImageFilename(card); }
function getCardBackImagePath() { return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION; }

function getRankValue(card, aceAsOneForStraight = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOneForStraight && rankUpper === "A") return 1; // Ace as 1 for A-2-3-4-5 straight
    return RANK_VALUES[rankUpper] || 0;
}

function sortHandCardsForDisplay(cards) { /* ... (same as your version) ... */ }

// Sorts cards by rank value, primarily for evaluation logic
function sortCardsByRankValue(cards, aceAsOneForStraight = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneForStraight);
        const valB = getRankValue(b, aceAsOneForStraight);
        return ascending ? valA - valB : valB - valA; // default descending
    });
}


// --- NEW/IMPROVED evaluateHand and compareHandInfos ---

function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards) || (cards.length !== 3 && cards.length !== 5)) {
        return { type: HAND_TYPES.HIGH_CARD, message: "无效牌数", ranks: [], originalCards: cards };
    }
    if (cards.some(card => !card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined')) {
        return { type: HAND_TYPES.HIGH_CARD, message: "牌数据错误", ranks: [], originalCards: cards };
    }

    const n = cards.length;
    const sortedByRankDesc = sortCardsByRankValue(cards, false, false); // Sort Ace high for general ranking
    const ranks = sortedByRankDesc.map(c => getRankValue(c)); // Ace high ranks
    const suits = cards.map(c => c.suitKey);

    const isFlush = n === 5 && new Set(suits).size === 1;

    // Straight check (handles A-5 and regular straights)
    let isStraight = false;
    let straightHighCardRank = 0; // Rank value of the highest card in the straight
    if (n === 5 || n === 3) { // Straights can be 3 or 5 cards in 13 water (for head/middle/bottom)
        const uniqueSortedRanksAceLow = [...new Set(cards.map(c => getRankValue(c, true)))].sort((a, b) => a - b); // Ace as 1, ascending
        const uniqueSortedRanksAceHigh = [...new Set(ranks)].sort((a, b) => b - a); // Ace as 14, descending

        if (uniqueSortedRanksAceLow.length >= n) {
            // Check for A-2-3-4-5 (wheel straight) for 5 cards
            if (n === 5 && uniqueSortedRanksAceLow[0] === 1 && uniqueSortedRanksAceLow[1] === 2 &&
                uniqueSortedRanksAceLow[2] === 3 && uniqueSortedRanksAceLow[3] === 4 && uniqueSortedRanksAceLow[4] === 5) {
                isStraight = true;
                straightHighCardRank = 5; // For comparison, A-5 straight's high card is 5
            }
            // General straight check (works for 3 or 5 cards)
            if (!isStraight) {
                for (let i = 0; i <= uniqueSortedRanksAceHigh.length - n; i++) {
                    let currentSeq = true;
                    for (let j = 0; j < n - 1; j++) {
                        if (uniqueSortedRanksAceHigh[i + j] !== uniqueSortedRanksAceHigh[i + j + 1] + 1) {
                            currentSeq = false;
                            break;
                        }
                    }
                    if (currentSeq) {
                        isStraight = true;
                        straightHighCardRank = uniqueSortedRanksAceHigh[i];
                        break;
                    }
                }
            }
        }
    }

    // Rank counts for pairs, three of a kind, four of a kind, full house
    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a); // e.g., [3,2] for full house

    let handType = HAND_TYPES.HIGH_CARD;
    let handRanksForComparison = [...ranks]; // Default comparison ranks (sorted high to low)
    let specificHandInfo = {}; // To store things like pairRank, threeRank for comparison

    if (n === 5) {
        if (isFlush && isStraight) {
            handType = HAND_TYPES.STRAIGHT_FLUSH;
            handRanksForComparison = straightHighCardRank === 5 ? [5,4,3,2,1] : ranks.filter(r => r <= straightHighCardRank && r > straightHighCardRank - 5 ).sort((a,b)=>b-a) ; // Ranks of the straight
            specificHandInfo.highCardRank = straightHighCardRank;
        } else if (counts[0] === 4) {
            handType = HAND_TYPES.FOUR_OF_A_KIND;
            specificHandInfo.quadRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 4));
            specificHandInfo.kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            handRanksForComparison = [specificHandInfo.quadRank, specificHandInfo.kicker];
        } else if (counts[0] === 3 && counts[1] === 2) {
            handType = HAND_TYPES.FULL_HOUSE;
            specificHandInfo.threeRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3));
            specificHandInfo.pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            handRanksForComparison = [specificHandInfo.threeRank, specificHandInfo.pairRank];
        } else if (isFlush) {
            handType = HAND_TYPES.FLUSH;
            handRanksForComparison = ranks; // Already sorted high-low
        } else if (isStraight) {
            handType = HAND_TYPES.STRAIGHT;
            handRanksForComparison = straightHighCardRank === 5 ? [5,4,3,2,1] : ranks.filter(r => r <= straightHighCardRank && r > straightHighCardRank - 5 ).sort((a,b)=>b-a);
            specificHandInfo.highCardRank = straightHighCardRank;
        } else if (counts[0] === 3) {
            handType = HAND_TYPES.THREE_OF_A_KIND;
            specificHandInfo.threeRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3));
            specificHandInfo.kickers = ranks.filter(r => r !== specificHandInfo.threeRank).sort((a,b)=>b-a).slice(0,2);
            handRanksForComparison = [specificHandInfo.threeRank, ...specificHandInfo.kickers];
        } else if (counts[0] === 2 && counts[1] === 2) {
            handType = HAND_TYPES.TWO_PAIR;
            const pairsRanks = Object.keys(rankCounts).filter(k => rankCounts[k] === 2).map(Number).sort((a, b) => b - a);
            specificHandInfo.highPair = pairsRanks[0];
            specificHandInfo.lowPair = pairsRanks[1];
            specificHandInfo.kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            handRanksForComparison = [specificHandInfo.highPair, specificHandInfo.lowPair, specificHandInfo.kicker];
        } else if (counts[0] === 2) {
            handType = HAND_TYPES.PAIR;
            specificHandInfo.pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            specificHandInfo.kickers = ranks.filter(r => r !== specificHandInfo.pairRank).sort((a,b)=>b-a).slice(0,3);
            handRanksForComparison = [specificHandInfo.pairRank, ...specificHandInfo.kickers];
        }
    } else if (n === 3) { // Top row (or special 3-card hands)
        // Only Three of a Kind, Pair, or High Card are standard for 3-card hands in 13-water head.
        // Some rules might allow 3-card straights/flushes, but that's less common.
        if (counts[0] === 3) {
            handType = HAND_TYPES.THREE_OF_A_KIND;
            specificHandInfo.threeRank = ranks[0]; // All three are same rank
            handRanksForComparison = [specificHandInfo.threeRank];
        } else if (counts[0] === 2) {
            handType = HAND_TYPES.PAIR;
            specificHandInfo.pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            specificHandInfo.kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            handRanksForComparison = [specificHandInfo.pairRank, specificHandInfo.kicker];
        }
        // Straights and Flushes for 3 cards are usually not standard for head-to-head comparison with 5-card hands
        // but if your rules include them for special scoring:
        // if (isFlush && n === 3) { handType = HAND_TYPES.FLUSH; ... }
        // if (isStraight && n === 3) { handType = HAND_TYPES.STRAIGHT; ... }
    }

    return {
        type: handType,
        ranks: handRanksForComparison, // Ranks used for comparison
        message: HAND_TYPE_MESSAGES[handType],
        originalCards: cards,
        ...specificHandInfo // Add specific info like quadRank, threeRank, highCardRank etc.
    };
}


function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') {
        console.warn("compareHandInfos: Invalid handInfo input", handInfo1, handInfo2);
        return 0;
    }

    if (handInfo1.type !== handInfo2.type) {
        return handInfo1.type > handInfo2.type ? 1 : -1;
    }

    // Hands are of the same type, compare by specific rules
    switch (handInfo1.type) {
        case HAND_TYPES.STRAIGHT_FLUSH:
        case HAND_TYPES.STRAIGHT:
            // A-5 straight (highCardRank 5) is the lowest straight
            return handInfo1.highCardRank > handInfo2.highCardRank ? 1 : (handInfo1.highCardRank < handInfo2.highCardRank ? -1 : 0);
        case HAND_TYPES.FOUR_OF_A_KIND:
            if (handInfo1.quadRank !== handInfo2.quadRank) return handInfo1.quadRank > handInfo2.quadRank ? 1 : -1;
            if (handInfo1.originalCards.length === 5) { // Only compare kicker if it's a 5-card hand
                 return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
            }
            return 0; // No kicker for 4-card four-of-a-kind (not standard)
        case HAND_TYPES.FULL_HOUSE:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            return handInfo1.pairRank > handInfo2.pairRank ? 1 : (handInfo1.pairRank < handInfo2.pairRank ? -1 : 0);
        case HAND_TYPES.FLUSH:
        case HAND_TYPES.HIGH_CARD:
            // 'ranks' should already be sorted high-to-low by evaluateHand
            for (let i = 0; i < handInfo1.ranks.length; i++) {
                if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
                if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
            }
            return 0;
        case HAND_TYPES.THREE_OF_A_KIND:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            // For 5-card hands, compare kickers
            if (handInfo1.originalCards.length === 5 && handInfo1.kickers && handInfo2.kickers) {
                for (let i = 0; i < Math.min(handInfo1.kickers.length, handInfo2.kickers.length); i++) {
                    if (handInfo1.kickers[i] > handInfo2.kickers[i]) return 1;
                    if (handInfo1.kickers[i] < handInfo2.kickers[i]) return -1;
                }
            } else if (handInfo1.originalCards.length === 3) {
                // For 3-card three of a kind, no kickers to compare if threeRanks are same (shouldn't happen with one deck)
                return 0;
            }
            return 0;
        case HAND_TYPES.TWO_PAIR:
            if (handInfo1.highPair !== handInfo2.highPair) return handInfo1.highPair > handInfo2.highPair ? 1 : -1;
            if (handInfo1.lowPair !== handInfo2.lowPair) return handInfo1.lowPair > handInfo2.lowPair ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.PAIR:
            if (handInfo1.pairRank !== handInfo2.pairRank) return handInfo1.pairRank > handInfo2.pairRank ? 1 : -1;
            // Compare kickers
            const kickers1 = handInfo1.originalCards.length === 5 ? handInfo1.kickers : [handInfo1.kicker];
            const kickers2 = handInfo2.originalCards.length === 5 ? handInfo2.kickers : [handInfo2.kicker];
            if (kickers1 && kickers2) {
                for (let i = 0; i < Math.min(kickers1.length, kickers2.length); i++) {
                    if (kickers1[i] > kickers2[i]) return 1;
                    if (kickers1[i] < kickers2[i]) return -1;
                }
            }
            return 0;
        default:
            return 0;
    }
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo ||
        typeof topInfo.type === 'undefined' ||
        typeof middleInfo.type === 'undefined' ||
        typeof bottomInfo.type === 'undefined') {
        console.warn("checkDaoshui called with incomplete handInfo objects.");
        return true; // Fail safe: if info is bad, assume daoshui to prevent invalid game state.
    }

    // console.log("Checking Daoshui:");
    // console.log("Top:", JSON.stringify(topInfo));
    // console.log("Middle:", JSON.stringify(middleInfo));
    // console.log("Bottom:", JSON.stringify(bottomInfo));

    const topVsMiddle = compareHandInfos(topInfo, middleInfo);
    // console.log("Top vs Middle Comparison Result:", topVsMiddle);
    if (topVsMiddle > 0) { // topHand is stronger than middleHand
        console.warn("Daoshui detected: Top hand is stronger than Middle hand.");
        return true;
    }

    const middleVsBottom = compareHandInfos(middleInfo, bottomInfo);
    // console.log("Middle vs Bottom Comparison Result:", middleVsBottom);
    if (middleVsBottom > 0) { // middleHand is stronger than bottomHand
        console.warn("Daoshui detected: Middle hand is stronger than Bottom hand.");
        return true;
    }

    return false; // Not daoshui
}
