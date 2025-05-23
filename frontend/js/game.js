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
    "J": 11, "Q": 12, "K": 13, "A": 14
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
};

// --- createDeck, shuffleDeck ---
function createDeck() {
    const newDeck = []; // 使用局部变量，避免意外修改全局deck (虽然当前全局deck在main.js)
    for (const suitKey in SUITS_DATA) {
        const suitInfo = SUITS_DATA[suitKey];
        for (const rank of RANKS_LOGIC_DISPLAY) {
            newDeck.push({
                suitKey: suitKey,
                rank: rank,
                displaySuitChar: suitInfo.displayChar,
                suitCssClass: suitInfo.cssClass
            });
        }
    }
    console.log("game.js: createDeck created a deck of length:", newDeck.length);
    return newDeck;
}

function shuffleDeck(deckToShuffle) { // 接收一个参数进行原地洗牌
    if (!Array.isArray(deckToShuffle)) {
        console.error("game.js: shuffleDeck received non-array:", deckToShuffle);
        return; // 或者返回 deckToShuffle 不变
    }
    for (let i = deckToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deckToShuffle[i], deckToShuffle[j]] = [deckToShuffle[j], deckToShuffle[i]];
    }
    // console.log("game.js: shuffleDeck completed.");
    // 原地洗牌，不需要返回，但返回也没错
    return deckToShuffle;
}

function dealCards(currentDeck, numberOfCards) {
    console.log("game.js: Inside dealCards - received currentDeck length:", currentDeck ? currentDeck.length : 'undefined', "numberOfCards:", numberOfCards);
    if (!Array.isArray(currentDeck)) {
        console.error("game.js: Deck received in dealCards is not an array or is undefined! Received:", currentDeck);
        return undefined; // 明确返回 undefined
    }
    if (currentDeck.length < numberOfCards) {
        console.warn("game.js: Not enough cards in currentDeck to deal", numberOfCards, "cards. Deck length:", currentDeck.length);
        // 根据游戏规则，这里可能需要返回部分牌，或者返回 undefined/空数组，或者报错
        // 为确保后续不出错，如果牌不够，也返回undefined或一个明确的空数组
        return []; // 或者 return undefined;
    }
    const dealtCards = currentDeck.slice(0, numberOfCards);
    console.log("game.js: dealCards is returning cards of length:", dealtCards.length);
    return dealtCards;
}


// --- 核心功能函数 ---
function getRankValue(card, aceAsOne = false) {
    if (aceAsOne && card.rank === "A") return 1;
    return RANK_VALUES[card.rank];
}

function sortCards(cards, aceAsOneInStraight = false, ascending = false) {
    // 确保传入的是数组副本进行排序，避免修改原始数组
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneInStraight && cards.length === 5);
        const valB = getRankValue(b, aceAsOneInStraight && cards.length === 5);
        return ascending ? valA - valB : valB - valA;
    });
}

function evaluateHand(cards) {
    if (!cards || !Array.isArray(cards) || (cards.length !== 3 && cards.length !== 5)) {
        console.warn("evaluateHand: Invalid cards input", cards);
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "无效牌数" };
    }
    if (cards.some(card => card === undefined || card === null)) { // 检查牌组中是否有undefined的牌
        console.warn("evaluateHand: Cards array contains undefined/null elements", cards);
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "牌组错误" };
    }


    const sortedCards = sortCards(cards, true);
    // 确保 sortedCards 中的每个元素都有 rank 属性
    if (sortedCards.some(c => !c || typeof c.rank === 'undefined')) {
        console.error("evaluateHand: sortedCards contains invalid card objects", sortedCards);
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "牌数据错误" };
    }

    const ranks = sortedCards.map(c => getRankValue(c));
    const suits = sortedCards.map(c => c.suitKey);

    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    const isFlush = new Set(suits).size === 1;

    const uniqueSortedRanksForStraight = [...new Set(ranks)].sort((a, b) => b - a);
    let isStraight = false;
    let straightHighCard = 0;

    if (uniqueSortedRanksForStraight.length >= (cards.length === 3 ? 3 : 5)) { // 至少需要牌数那么多的不同点数才可能构成顺子
        // 判断A2345顺子 (A为1)
        const aceLowStraightRanks = sortedCards.map(c => getRankValue(c, true)).sort((a, b) => a - b); // [1,2,3,4,5]
        if (cards.length === 5 && aceLowStraightRanks[0] === 1 && aceLowStraightRanks[1] === 2 && aceLowStraightRanks[2] === 3 && aceLowStraightRanks[3] === 4 && aceLowStraightRanks[4] === 5) {
             isStraight = true;
             straightHighCard = 5; // A2345顺子中，5是最大的牌
             if (isFlush) return { type: HAND_TYPES.STRAIGHT_FLUSH, ranks: aceLowStraightRanks.reverse(), highCard: straightHighCard, message: "同花顺 (A2345)" };
             return { type: HAND_TYPES.STRAIGHT, ranks: aceLowStraightRanks.reverse(), highCard: straightHighCard, message: "顺子 (A2345)" };
        }

        // 普通顺子判断
        // 对于5张牌：检查最大的5张是否连续
        // 对于3张牌：检查3张是否连续
        let straightCandidateRanks = uniqueSortedRanksForStraight.slice(0, cards.length);
        if (straightCandidateRanks.length === cards.length && straightCandidateRanks.every((rank, i) => i === 0 || rank === straightCandidateRanks[i-1] - 1)) {
            isStraight = true;
            straightHighCard = straightCandidateRanks[0];
        }
    }


    if (cards.length === 5) {
        if (isFlush && isStraight) return { type: HAND_TYPES.STRAIGHT_FLUSH, ranks: ranks, highCard: straightHighCard, message: "同花顺" };
        if (counts[0] === 4) {
            const quadRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 4));
            const kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            return { type: HAND_TYPES.FOUR_OF_A_KIND, ranks: ranks, quadRank: quadRank, kicker: kicker, message: "铁支" };
        }
        if (counts[0] === 3 && counts[1] === 2) {
            const threeRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3));
            const pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            return { type: HAND_TYPES.FULL_HOUSE, ranks: ranks, threeRank: threeRank, pairRank: pairRank, message: "葫芦" };
        }
        if (isFlush) return { type: HAND_TYPES.FLUSH, ranks: ranks, message: "同花" };
        if (isStraight) return { type: HAND_TYPES.STRAIGHT, ranks: ranks, highCard: straightHighCard, message: "顺子" };
        if (counts[0] === 3) {
            const threeRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3));
            const kickers = ranks.filter(r => r !== threeRank).sort((a,b)=>b-a);
            return { type: HAND_TYPES.THREE_OF_A_KIND, ranks: ranks, threeRank: threeRank, kickers: kickers, message: "三条" };
        }
        if (counts[0] === 2 && counts[1] === 2) {
            const pairsRanks = Object.keys(rankCounts).filter(k => rankCounts[k] === 2).map(Number).sort((a, b) => b - a);
            const kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            return { type: HAND_TYPES.TWO_PAIR, ranks: ranks, highPair: pairsRanks[0], lowPair: pairsRanks[1], kicker: kicker, message: "两对" };
        }
        if (counts[0] === 2) {
            const pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            const kickers = ranks.filter(r => r !== pairRank).sort((a,b)=>b-a);
            return { type: HAND_TYPES.PAIR, ranks: ranks, pairRank: pairRank, kickers: kickers, message: "对子" };
        }
    }

    if (cards.length === 3) {
        if (counts[0] === 3) return { type: HAND_TYPES.THREE_OF_A_KIND, ranks: ranks, threeRank: ranks[0], message: "三条" };
        if (counts[0] === 2) {
            const pairRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2));
            const kicker = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1));
            return { type: HAND_TYPES.PAIR, ranks: ranks, pairRank: pairRank, kicker: kicker, message: "对子" };
        }
    }

    return { type: HAND_TYPES.HIGH_CARD, ranks: ranks, message: "乌龙" };
}


function compareHandInfos(handInfo1, handInfo2) {
    if (!handInfo1 || !handInfo2 || typeof handInfo1.type === 'undefined' || typeof handInfo2.type === 'undefined') {
        console.error("compareHandInfos: Invalid handInfo input", handInfo1, handInfo2);
        return 0; // 或者抛出错误
    }
    if (handInfo1.type > handInfo2.type) return 1;
    if (handInfo1.type < handInfo2.type) return -1;

    switch (handInfo1.type) {
        case HAND_TYPES.STRAIGHT_FLUSH:
        case HAND_TYPES.STRAIGHT:
             // A2345顺子 (highCard为5) 比 KQA23 (highCard为K=13) 小
            return handInfo1.highCard > handInfo2.highCard ? 1 : (handInfo1.highCard < handInfo2.highCard ? -1 : 0);
        case HAND_TYPES.FOUR_OF_A_KIND:
            if (handInfo1.quadRank !== handInfo2.quadRank) return handInfo1.quadRank > handInfo2.quadRank ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.FULL_HOUSE:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            // 在十三水中，如果三条相同，则葫芦大小取决于这对 (虽然一副牌不太可能三条相同)
            return handInfo1.pairRank > handInfo2.pairRank ? 1 : (handInfo1.pairRank < handInfo2.pairRank ? -1 : 0);
        case HAND_TYPES.FLUSH:
        case HAND_TYPES.HIGH_CARD:
            for (let i = 0; i < handInfo1.ranks.length; i++) {
                if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
                if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
            }
            return 0;
        case HAND_TYPES.THREE_OF_A_KIND:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            if (handInfo1.kickers && handInfo2.kickers) { // 适用于5张牌的三条
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
            const kickers1 = handInfo1.kickers || (typeof handInfo1.kicker !== 'undefined' ? [handInfo1.kicker] : []);
            const kickers2 = handInfo2.kickers || (typeof handInfo2.kicker !== 'undefined' ? [handInfo2.kicker] : []);
            for (let i = 0; i < Math.min(kickers1.length, kickers2.length); i++) {
                if (kickers1[i] > kickers2[i]) return 1;
                if (kickers1[i] < kickers2[i]) return -1;
            }
            return 0;
        default:
            return 0;
    }
}

function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (!topInfo || !middleInfo || !bottomInfo) {
        console.error("checkDaoshui: One or more hand infos are undefined.");
        return true; // 视为倒水以策安全
    }
    if (compareHandInfos(topInfo, middleInfo) > 0) {
        console.log("倒水: 头道大于中道");
        return true;
    }
    if (compareHandInfos(middleInfo, bottomInfo) > 0) {
        console.log("倒水: 中道大于尾道");
        return true;
    }
    return false;
}
