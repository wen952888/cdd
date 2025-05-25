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

// Added A_LOW for A-5 straights
const RANK_VALUES_ACE_LOW = {
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

// --- Image Path Configuration ---
const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';

function getCardImageFilename(card) {
    if (!card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined') {
        console.error("getCardImageFilename ERROR: Invalid card data:", card);
        return `unknown${CARD_IMAGE_EXTENSION}`;
    }
    const rankKey = card.rank.toUpperCase();
    const rankPart = RANK_FILENAME_PART[rankKey];
    const suitInfo = SUITS_DATA[card.suitKey];
    const suitPart = suitInfo ? suitInfo.fileNamePart : null;

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
    return CARD_IMAGE_PATH_PREFIX + filename;
}

function getCardBackImagePath() {
    return CARD_IMAGE_PATH_PREFIX + 'back' + CARD_IMAGE_EXTENSION;
}

// --- Core Game Logic Helper Functions ---
function getRankValue(card, aceAsOne = false) {
    if (!card || typeof card.rank === 'undefined') return 0;
    const rankUpper = card.rank.toUpperCase();
    if (aceAsOne && rankUpper === "A") return 1; // Special case for A-5 straight
    return RANK_VALUES[rankUpper] || 0;
}

// Simplified sortCards, assuming getRankValue handles aceAsOne context if needed by caller
function sortCardsByRank(cards, ascending = false, aceAsOneForStraight = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        // For A-5 straights, A should be low. Otherwise, A is high.
        // This logic might need to be more nuanced based on context in evaluateHand.
        const valA = getRankValue(a, aceAsOneForStraight && a.rank === 'A');
        const valB = getRankValue(b, aceAsOneForStraight && b.rank === 'A');
        return ascending ? valA - valB : valB - valA;
    });
}


function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards)) {
        return { type: HAND_TYPES.HIGH_CARD, message: "无效输入", ranks: [], originalCards: cards };
    }
    const cardCount = cards.length;
    if (cardCount !== 3 && cardCount !== 5) {
        return { type: HAND_TYPES.HIGH_CARD, message: `无效牌数(${cardCount})`, ranks: [], originalCards: cards };
    }
    if (cards.some(card => !card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined')) {
        return { type: HAND_TYPES.HIGH_CARD, message: "牌数据错误", ranks: [], originalCards: cards };
    }

    // Helper to get rank values, sorted descending by default
    const getSortedRankValues = (crds, aceLow = false) =>
        crds.map(c => getRankValue(c, aceLow && c.rank === 'A')).sort((a, b) => b - a);

    // --- Rank and Suit Analysis ---
    const rankCounts = {};
    const suitCounts = {};
    const rankValues = []; // Stores numeric rank values for sorting and comparison

    cards.forEach(card => {
        const rankVal = getRankValue(card);
        rankCounts[rankVal] = (rankCounts[rankVal] || 0) + 1;
        suitCounts[card.suitKey] = (suitCounts[card.suitKey] || 0) + 1;
        rankValues.push(rankVal);
    });
    rankValues.sort((a, b) => b - a); // Sort ranks descending (Aces high by default)

    // --- Check for Flush and Straight ---
    const isFlush = Object.values(suitCounts).some(count => count >= (cardCount === 3 ? 3 : 5));

    // Straight check (Aces can be high or low)
    let isStraight = false;
    let straightHighCardValue = 0; // Stores the highest card of the straight
    const uniqueSortedRanks = [...new Set(rankValues)].sort((a, b) => a - b); // Ascending for straight check

    if (uniqueSortedRanks.length >= (cardCount === 3 ? 3 : 5)) { // Need at least 5 unique ranks for a 5-card straight, 3 for 3-card
        // Standard straight check
        for (let i = 0; i <= uniqueSortedRanks.length - (cardCount === 3 ? 3 : 5); i++) {
            let potentialStraight = true;
            for (let j = 0; j < (cardCount === 3 ? 3 : 5) - 1; j++) {
                if (uniqueSortedRanks[i+j+1] - uniqueSortedRanks[i+j] !== 1) {
                    potentialStraight = false;
                    break;
                }
            }
            if (potentialStraight) {
                isStraight = true;
                straightHighCardValue = uniqueSortedRanks[i + (cardCount === 3 ? 2 : 4)];
                break;
            }
        }
        // A-2-3-4-5 (Steel Wheel) straight check for 5-card hands
        if (!isStraight && cardCount === 5) {
            const aceLowRanks = cards.map(c => getRankValue(c, c.rank === 'A')).sort((a, b) => a - b);
            const uniqueAceLowRanks = [...new Set(aceLowRanks)].sort((a, b) => a - b);
            if (uniqueAceLowRanks.length >= 5 &&
                uniqueAceLowRanks[0] === RANK_VALUES_ACE_LOW.A && // Ace (as 1)
                uniqueAceLowRanks[1] === RANK_VALUES_ACE_LOW["2"] &&
                uniqueAceLowRanks[2] === RANK_VALUES_ACE_LOW["3"] &&
                uniqueAceLowRanks[3] === RANK_VALUES_ACE_LOW["4"] &&
                uniqueAceLowRanks[4] === RANK_VALUES_ACE_LOW["5"]) {
                isStraight = true;
                straightHighCardValue = RANK_VALUES_ACE_LOW["5"]; // High card is 5 for A-5 straight
                // For comparison ranks, A-5 straight is ranked by its 5.
                // Override rankValues for this specific straight type for correct comparison.
                // rankValues = [5, 4, 3, 2, 1]; // This ensures A-5 is lower than 6-high straight.
            }
        }
    }
    
    // For 3-card hands, straight and flush are less common / sometimes not standard.
    // Here, we will allow them for now. Adjust if your rules differ.

    // --- Determine Hand Type ---
    let type = HAND_TYPES.HIGH_CARD;
    let evaluatedRanks = [...rankValues]; // Default to sorted high cards

    if (isStraight && isFlush && cardCount === 5) {
        type = HAND_TYPES.STRAIGHT_FLUSH;
        // For A-5 straight flush, use [5,4,3,2,1] for comparison. Otherwise, use standard descending.
        if (straightHighCardValue === RANK_VALUES_ACE_LOW["5"] && cards.some(c => c.rank === 'A')) {
            evaluatedRanks = [5, 4, 3, 2, 1];
        } else {
            // Build ranks from straightHighCardValue downwards
            evaluatedRanks = Array.from({ length: 5 }, (_, k) => straightHighCardValue - k);
        }
    } else if (Object.values(rankCounts).includes(4) && cardCount === 5) {
        type = HAND_TYPES.FOUR_OF_A_KIND;
        const fourRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 4));
        const kicker = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 1));
        evaluatedRanks = [fourRank, fourRank, fourRank, fourRank, kicker];
    } else if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2) && cardCount === 5) {
        type = HAND_TYPES.FULL_HOUSE;
        const tripleRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 3));
        const pairRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 2));
        evaluatedRanks = [tripleRank, tripleRank, tripleRank, pairRank, pairRank];
    } else if (isFlush) {
        type = HAND_TYPES.FLUSH;
        evaluatedRanks = getSortedRankValues(cards); // Already sorted high-to-low
    } else if (isStraight) {
        type = HAND_TYPES.STRAIGHT;
         // For A-5 straight, use [5,4,3,2,1] for comparison. Otherwise, use standard descending.
        if (straightHighCardValue === RANK_VALUES_ACE_LOW["5"] && cards.some(c => c.rank === 'A') && cardCount === 5) {
            evaluatedRanks = [5, 4, 3, 2, 1];
        } else if (cardCount === 5){
            // Build ranks from straightHighCardValue downwards for 5 cards
            evaluatedRanks = Array.from({ length: 5 }, (_, k) => straightHighCardValue - k);
        } else { // 3 card straight
             evaluatedRanks = Array.from({ length: 3 }, (_, k) => straightHighCardValue - k);
        }
    } else { // Check for Three of a Kind, Two Pair, Pair, or High Card
        const tripleRankStr = Object.keys(rankCounts).find(r => rankCounts[r] === 3);
        if (tripleRankStr) {
            type = HAND_TYPES.THREE_OF_A_KIND;
            const tripleRankVal = parseInt(tripleRankStr);
            const kickers = cards
                .filter(c => getRankValue(c) !== tripleRankVal)
                .map(c => getRankValue(c))
                .sort((a, b) => b - a);
            if (cardCount === 5) {
                evaluatedRanks = [tripleRankVal, tripleRankVal, tripleRankVal, ...kickers];
            } else { // 3-card hand (is a set)
                evaluatedRanks = [tripleRankVal, tripleRankVal, tripleRankVal];
            }
        } else {
            const pairRankStrs = Object.keys(rankCounts).filter(r => rankCounts[r] === 2);
            if (pairRankStrs.length === 2 && cardCount === 5) { // Two Pair (only for 5-card hands)
                type = HAND_TYPES.TWO_PAIR;
                const highPairRank = Math.max(...pairRankStrs.map(r => parseInt(r)));
                const lowPairRank = Math.min(...pairRankStrs.map(r => parseInt(r)));
                const kicker = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 1));
                evaluatedRanks = [highPairRank, highPairRank, lowPairRank, lowPairRank, kicker];
            } else if (pairRankStrs.length === 1) { // One Pair
                type = HAND_TYPES.PAIR;
                const pairRankVal = parseInt(pairRankStrs[0]);
                const kickers = cards
                    .filter(c => getRankValue(c) !== pairRankVal)
                    .map(c => getRankValue(c))
                    .sort((a, b) => b - a);
                 if (cardCount === 5) {
                    evaluatedRanks = [pairRankVal, pairRankVal, ...kickers.slice(0,3)];
                 } else { // 3-card hand
                    evaluatedRanks = [pairRankVal, pairRankVal, kickers[0]];
                 }
            } else { // High Card
                type = HAND_TYPES.HIGH_CARD;
                evaluatedRanks = getSortedRankValues(cards);
            }
        }
    }
    
    // Ensure evaluatedRanks has the correct length, padding with low values if necessary (shouldn't happen with good logic)
    // while(evaluatedRanks.length < cardCount) evaluatedRanks.push(0);
    // evaluatedRanks = evaluatedRanks.slice(0, cardCount);


    let message = HAND_TYPE_MESSAGES[type] || "计算中...";
    if (type === HAND_TYPES.HIGH_CARD && evaluatedRanks.length === 0 && cardCount > 0) {
        message = "牌数据错误";
    }

    return { type: type, ranks: evaluatedRanks, message: message, originalCards: cards };
}


function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') {
        return 0; 
    }
    if (handInfo1.type !== handInfo2.type) {
        return handInfo1.type > handInfo2.type ? 1 : -1;
    }
    
    if (handInfo1.ranks && handInfo2.ranks) {
        // Special case for A-5 straight (ranks might be [5,4,3,2,1])
        // If both are A-5 straights (or straight flushes), they are ranked by the 5.
        // The evaluatedRanks should already handle this by setting A-5 straight ranks appropriately.
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
        return true; 
    }

    // 头道牌型不能大于中道牌型
    if (compareHandInfos(topInfo, middleInfo) > 0) {
        // console.log("倒水: 头道 > 中道", topInfo, middleInfo);
        return true;
    }
    // 中道牌型不能大于尾道牌型
    if (compareHandInfos(middleInfo, bottomInfo) > 0) {
        // console.log("倒水: 中道 > 尾道", middleInfo, bottomInfo);
        return true;
    }
    return false; // Not Daoshui
}
// --- END: CRITICAL GAME LOGIC ---
