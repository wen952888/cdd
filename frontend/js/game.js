// frontend/js/game.js

// --- Card Data ---
const SUITS_DATA = {
    SPADES:   { displayChar: "♠", cssClass: "spades" },
    HEARTS:   { displayChar: "♥", cssClass: "hearts" },
    DIAMONDS: { displayChar: "♦", cssClass: "diamonds" },
    CLUBS:    { displayChar: "♣", cssClass: "clubs" }
};
const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const RANK_VALUES = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14 // Ace high by default
};

const HAND_TYPES = {
    HIGH_CARD: 0,
    PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
    // Potentially add special hands like "Dragon", "Six Pairs and a Half", etc. if your rules include them
};
const HAND_TYPE_MESSAGES = {
    [HAND_TYPES.HIGH_CARD]: "乌龙",
    [HAND_TYPES.PAIR]: "对子",
    [HAND_TYPES.TWO_PAIR]: "两对",
    [HAND_TYPES.THREE_OF_A_KIND]: "三条",
    [HAND_TYPES.STRAIGHT]: "顺子",
    [HAND_TYPES.FLUSH]: "同花",
    [HAND_TYPES.FULL_HOUSE]: "葫芦",
    [HAND_TYPES.FOUR_OF_A_KIND]: "铁支",
    [HAND_TYPES.STRAIGHT_FLUSH]: "同花顺",
};


// --- Deck Management (Client-side stubs, actual dealing is now backend) ---
function createClientSideDeck() { // Renamed to avoid confusion with backend
    const newDeck = [];
    for (const suitKey in SUITS_DATA) {
        const suitInfo = SUITS_DATA[suitKey];
        for (const rank of RANKS_LOGIC_DISPLAY) {
            newDeck.push({
                suitKey: suitKey,
                rank: rank,
                displaySuitChar: suitInfo.displayChar,
                suitCssClass: suitInfo.cssClass,
                id: rank + suitKey // Simple ID for DOM elements if needed
            });
        }
    }
    // console.log("game.js: createClientSideDeck created a deck of length:", newDeck.length);
    return newDeck;
}

function shuffleClientSideDeck(deckToShuffle) {
    if (!Array.isArray(deckToShuffle)) {
        console.error("game.js: shuffleClientSideDeck received non-array:", deckToShuffle);
        return deckToShuffle;
    }
    for (let i = deckToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deckToShuffle[i], deckToShuffle[j]] = [deckToShuffle[j], deckToShuffle[i]];
    }
    return deckToShuffle;
}

// --- Core Hand Evaluation Functions ---
function getRankValue(card, aceAsOne = false) {
    if (!card || typeof card.rank === 'undefined') {
        // console.warn("getRankValue: Invalid card object", card);
        return 0; // Or handle error appropriately
    }
    if (aceAsOne && card.rank === "A") return 1;
    return RANK_VALUES[card.rank] || 0;
}

function sortCards(cards, aceAsOneInStraightContext = false, ascending = false) {
    if (!Array.isArray(cards)) return [];
    return [...cards].sort((a, b) => {
        // Check if a and b are valid card objects
        const valA = (a && a.rank) ? getRankValue(a, aceAsOneInStraightContext && cards.length === 5) : (ascending ? Infinity : -Infinity);
        const valB = (b && b.rank) ? getRankValue(b, aceAsOneInStraightContext && cards.length === 5) : (ascending ? Infinity : -Infinity);
        return ascending ? valA - valB : valB - valA;
    });
}

function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards) || (cards.length !== 3 && cards.length !== 5)) {
        // console.warn("evaluateHand: Invalid cards input count", cards ? cards.length : 'undefined');
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "无效牌数", originalCards: cards };
    }
    if (cards.some(card => !card || typeof card.rank === 'undefined' || typeof card.suitKey === 'undefined')) {
        console.warn("evaluateHand: Cards array contains invalid/incomplete card objects", cards);
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "牌数据错误", originalCards: cards };
    }

    const sortedCards = sortCards(cards, true); // Sort with Ace potentially low for straight checks
    const ranks = sortedCards.map(c => getRankValue(c)); // Default Ace high for general ranking
    const suits = sortedCards.map(c => c.suitKey);

    const rankCounts = {};
    sortedCards.forEach(card => { // Use original ranks for counting, not potentially ace-low values
        const rankVal = getRankValue(card); // Ace high for counting
        rankCounts[rankVal] = (rankCounts[rankVal] || 0) + 1;
    });
    const counts = Object.values(rankCounts).sort((a, b) => b - a); // [3,2] for full house, [2,2,1] for two pair

    const isFlush = new Set(suits).size === 1;

    // Straight check
    let isStraight = false;
    let straightHighCardRank = 0; // Stores the rank value of the highest card in the straight
    const uniqueRanksForStraight = sortCards([...new Set(sortedCards.map(c => ({rank: c.rank})))], true).map(c => getRankValue(c, true)); // Sorted unique ranks, Ace can be 1

    if (uniqueRanksForStraight.length >= (cards.length === 3 ? 3 : 5)) {
        // A-5 straight (Wheel)
        if (cards.length === 5) {
            const aceLowRanks = sortedCards.map(c => getRankValue(c, true)).sort((a, b) => a - b);
            if (aceLowRanks[0] === 1 && aceLowRanks[1] === 2 && aceLowRanks[2] === 3 && aceLowRanks[3] === 4 && aceLowRanks[4] === 5) {
                isStraight = true;
                straightHighCardRank = 5; // A2345, 5 is the high card for comparison
            }
        }
        // General straight (including 10-A)
        if (!isStraight) {
            // Check for sequence in unique ranks (default Ace high)
            const normalSortedUniqueRanks = sortCards([...new Set(sortedCards.map(c => ({rank: c.rank})))], false).map(c => getRankValue(c)); // Ace high
            for (let i = 0; i <= normalSortedUniqueRanks.length - cards.length; i++) {
                let isSeq = true;
                for (let j = 0; j < cards.length - 1; j++) {
                    if (normalSortedUniqueRanks[i+j] !== normalSortedUniqueRanks[i+j+1] + 1) {
                        isSeq = false;
                        break;
                    }
                }
                if (isSeq) {
                    isStraight = true;
                    straightHighCardRank = normalSortedUniqueRanks[i];
                    break;
                }
            }
        }
    }

    const primarySortedRanks = sortCards(cards).map(c => getRankValue(c)); // Primary ranks for result (Ace high)

    if (cards.length === 5) {
        if (isFlush && isStraight) return { type: HAND_TYPES.STRAIGHT_FLUSH, ranks: straightHighCardRank === 5 ? [5,4,3,2,1] : primarySortedRanks, highCardRank: straightHighCardRank, message: HAND_TYPE_MESSAGES[HAND_TYPES.STRAIGHT_FLUSH], originalCards: cards };
        if (counts[0] === 4) {
            const quadRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 4));
            const kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            return { type: HAND_TYPES.FOUR_OF_A_KIND, ranks: primarySortedRanks, quadRank: quadRank, kicker: kicker, message: HAND_TYPE_MESSAGES[HAND_TYPES.FOUR_OF_A_KIND], originalCards: cards };
        }
        if (counts[0] === 3 && counts[1] === 2) {
            const threeRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3));
            const pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            return { type: HAND_TYPES.FULL_HOUSE, ranks: primarySortedRanks, threeRank: threeRank, pairRank: pairRank, message: HAND_TYPE_MESSAGES[HAND_TYPES.FULL_HOUSE], originalCards: cards };
        }
        if (isFlush) return { type: HAND_TYPES.FLUSH, ranks: primarySortedRanks, message: HAND_TYPE_MESSAGES[HAND_TYPES.FLUSH], originalCards: cards };
        if (isStraight) return { type: HAND_TYPES.STRAIGHT, ranks: straightHighCardRank === 5 ? [5,4,3,2,1] : primarySortedRanks, highCardRank: straightHighCardRank, message: HAND_TYPE_MESSAGES[HAND_TYPES.STRAIGHT], originalCards: cards };
        if (counts[0] === 3) {
            const threeRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3));
            const kickers = primarySortedRanks.filter(r => r !== threeRank).sort((a,b)=>b-a);
            return { type: HAND_TYPES.THREE_OF_A_KIND, ranks: primarySortedRanks, threeRank: threeRank, kickers: kickers, message: HAND_TYPE_MESSAGES[HAND_TYPES.THREE_OF_A_KIND], originalCards: cards };
        }
        if (counts[0] === 2 && counts[1] === 2) {
            const pairsRanks = Object.keys(rankCounts).filter(k => rankCounts[k] === 2).map(Number).sort((a, b) => b - a);
            const kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            return { type: HAND_TYPES.TWO_PAIR, ranks: primarySortedRanks, highPair: pairsRanks[0], lowPair: pairsRanks[1], kicker: kicker, message: HAND_TYPE_MESSAGES[HAND_TYPES.TWO_PAIR], originalCards: cards };
        }
        if (counts[0] === 2) {
            const pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            const kickers = primarySortedRanks.filter(r => r !== pairRank).sort((a,b)=>b-a);
            return { type: HAND_TYPES.PAIR, ranks: primarySortedRanks, pairRank: pairRank, kickers: kickers, message: HAND_TYPE_MESSAGES[HAND_TYPES.PAIR], originalCards: cards };
        }
    }

    if (cards.length === 3) { // Top row evaluation (Simpler: Three of a kind, Pair, High Card)
        if (counts[0] === 3) return { type: HAND_TYPES.THREE_OF_A_KIND, ranks: primarySortedRanks, threeRank: primarySortedRanks[0], message: HAND_TYPE_MESSAGES[HAND_TYPES.THREE_OF_A_KIND], originalCards: cards };
        if (counts[0] === 2) {
            const pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            const kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            return { type: HAND_TYPES.PAIR, ranks: primarySortedRanks, pairRank: pairRank, kicker: kicker, message: HAND_TYPE_MESSAGES[HAND_TYPES.PAIR], originalCards: cards };
        }
    }

    return { type: HAND_TYPES.HIGH_CARD, ranks: primarySortedRanks, message: HAND_TYPE_MESSAGES[HAND_TYPES.HIGH_CARD], originalCards: cards };
}


function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') {
        console.error("compareHandInfos: Invalid handInfo input", handInfo1, handInfo2);
        return 0; // Undetermined or error
    }

    if (handInfo1.type !== handInfo2.type) {
        return handInfo1.type > handInfo2.type ? 1 : -1;
    }

    // Hands are of the same type, compare by ranks/kickers
    switch (handInfo1.type) {
        case HAND_TYPES.STRAIGHT_FLUSH:
        case HAND_TYPES.STRAIGHT:
            // A2345 (highCardRank 5) is lower than KQAJT (highCardRank 13)
            return handInfo1.highCardRank > handInfo2.highCardRank ? 1 : (handInfo1.highCardRank < handInfo2.highCardRank ? -1 : 0);
        case HAND_TYPES.FOUR_OF_A_KIND:
            if (handInfo1.quadRank !== handInfo2.quadRank) return handInfo1.quadRank > handInfo2.quadRank ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.FULL_HOUSE:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            return handInfo1.pairRank > handInfo2.pairRank ? 1 : (handInfo1.pairRank < handInfo2.pairRank ? -1 : 0);
        case HAND_TYPES.FLUSH:
        case HAND_TYPES.HIGH_CARD: // For high card, ranks are already sorted descending
            for (let i = 0; i < handInfo1.ranks.length; i++) {
                if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
                if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
            }
            return 0; // Exact tie
        case HAND_TYPES.THREE_OF_A_KIND:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            // Compare kickers for 5-card hands; 3-card hands are just the three of a kind
            if (handInfo1.originalCards.length === 5 && handInfo1.kickers && handInfo2.kickers) {
                for (let i = 0; i < Math.min(handInfo1.kickers.length, handInfo2.kickers.length); i++) {
                    if (handInfo1.kickers[i] > handInfo2.kickers[i]) return 1;
                    if (handInfo1.kickers[i] < handInfo2.kickers[i]) return -1;
                }
            }
            return 0;
        case HAND_TYPES.TWO_PAIR:
            if (handInfo1.highPair !== handInfo2.highPair) return handInfo1.highPair > handInfo2.highPair ? 1 : -1;
            if (handInfo1.lowPair !== handInfo2.lowPair) return handInfo1.lowPair > handInfo2.lowPair ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.PAIR:
            if (handInfo1.pairRank !== handInfo2.pairRank) return handInfo1.pairRank > handInfo2.pairRank ? 1 : -1;
            // Consolidate kickers for comparison
            const kickers1 = handInfo1.kickers || (typeof handInfo1.kicker !== 'undefined' ? [handInfo1.kicker] : []);
            const kickers2 = handInfo2.kickers || (typeof handInfo2.kicker !== 'undefined' ? [handInfo2.kicker] : []);
            for (let i = 0; i < Math.min(kickers1.length, kickers2.length); i++) {
                if (kickers1[i] > kickers2[i]) return 1;
                if (kickers1[i] < kickers2[i]) return -1;
            }
            return 0;
        default:
            return 0; // Should not happen if types are valid
    }
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo ||
        typeof topInfo.type === 'undefined' ||
        typeof middleInfo.type === 'undefined' ||
        typeof bottomInfo.type === 'undefined') {
        console.warn("checkDaoshui: One or more hand infos are incomplete or undefined.", topInfo, middleInfo, bottomInfo);
        return true; // Treat as daoshui if data is bad
    }
    // Top must be less than or equal to Middle
    if (compareHandInfos(topInfo, middleInfo) > 0) {
        // console.log("倒水: 头道大于中道");
        return true; // Daoshui
    }
    // Middle must be less than or equal to Bottom
    if (compareHandInfos(middleInfo, bottomInfo) > 0) {
        // console.log("倒水: 中道大于尾道");
        return true; // Daoshui
    }
    return false; // Not daoshui
}
