// frontend/js/game.js

// --- Card Data (保持不变) ---
const SUITS_DATA = { /* ... */ };
const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// --- 牌值映射 (用于比较大小) ---
const RANK_VALUES = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14 // A 通常最大，但在A2345顺子中最小
};
// 十三水A通常算最大，特殊A2345顺子中A算1

// --- 牌型常量 (示例) ---
const HAND_TYPES = {
    HIGH_CARD: 0,    // 乌龙
    PAIR: 1,         // 对子
    TWO_PAIR: 2,     // 两对
    THREE_OF_A_KIND: 3, // 三条
    STRAIGHT: 4,      // 顺子
    FLUSH: 5,         // 同花
    FULL_HOUSE: 6,    // 葫芦
    FOUR_OF_A_KIND: 7, // 铁支
    STRAIGHT_FLUSH: 8, // 同花顺
    // ... 其他特殊牌型
    // ROYAL_FLUSH: 9, // (同花大顺是STRAIGHT_FLUSH的一种)
    // FIVE_OF_A_KIND: 10, // 五同 (如果带鬼牌)
};

// --- 游戏状态 ---
let playerHand = []; // 玩家13张手牌
let playerOrganizedHand = { // 玩家理好的牌
    top: [],    // 头道 (3张)
    middle: [], // 中道 (5张)
    bottom: []  // 尾道 (5张)
};
// (如果有多人或AI，需要为他们也创建类似结构)

// --- createDeck, shuffleDeck, dealCards (基本不变) ---
function createDeck() { /* ... */ }
function shuffleDeck(deck) { /* ... */ }
function dealCards(deck, numberOfCards) { /* ... */ }


// --- 核心功能函数 (需要实现) ---

/**
 * 获取卡牌的点数值
 * @param {object} card - 卡牌对象
 * @param {boolean} aceAsOne - 在A2345顺子中A是否算1
 * @returns {number}
 */
function getRankValue(card, aceAsOne = false) {
    if (aceAsOne && card.rank === "A") return 1;
    return RANK_VALUES[card.rank];
}

/**
 * 对一组牌按点数排序 (从大到小或从小到大)
 * @param {array} cards - 卡牌数组
 * @param {boolean} aceAsOneInStraight - 是否在判断顺子时A可以当1
 * @param {boolean} ascending - 是否升序
 * @returns {array} - 排序后的卡牌数组
 */
function sortCards(cards, aceAsOneInStraight = false, ascending = false) {
    return [...cards].sort((a, b) => {
        const valA = getRankValue(a, aceAsOneInStraight && cards.length === 5); // A2345顺子时A为1
        const valB = getRankValue(b, aceAsOneInStraight && cards.length === 5);
        return ascending ? valA - valB : valB - valA;
    });
}

/**
 * 判断一组牌的牌型 (重要且复杂)
 * @param {array} cards - 3张或5张牌
 * @returns {object} - { type: HAND_TYPES.XXX, value: ..., kicker: ... }
 *                     value 是该牌型的主要比较值 (例如对子K, value是K的点数)
 *                     kicker 是次要比较值 (例如对子K带QJ9, kicker是QJ9)
 */
function evaluateHand(cards) {
    // 0. 参数校验
    if (!cards || (cards.length !== 3 && cards.length !== 5)) {
        return { type: HAND_TYPES.HIGH_CARD, ranks: [], message: "无效牌数" };
    }

    const sortedCards = sortCards(cards, true); // 默认A2345顺子中A可以为1进行排序和判断
    const ranks = sortedCards.map(c => getRankValue(c));
    const suits = sortedCards.map(c => c.suitKey);

    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a); // [3,1,1] for three of a kind

    const isFlush = new Set(suits).size === 1;
    
    // 判断A2345顺子 (A为1)
    const isAceLowStraight = ranks.join(',') === '14,5,4,3,2'; // A,5,4,3,2 (A作为14排序后) -> 实际为A,2,3,4,5
    if (isAceLowStraight) { // 如果是A2345, 将A的值视为1，重新排序
        const aceLowRanks = sortedCards.map(c => getRankValue(c, true)).sort((a,b) => a-b); // 1,2,3,4,5
        if (aceLowRanks.every((rank, i) => i === 0 || rank === aceLowRanks[i-1] + 1)) {
            if (isFlush) return { type: HAND_TYPES.STRAIGHT_FLUSH, ranks: aceLowRanks, highCard: 5, message: "同花顺 (A2345)"};
            return { type: HAND_TYPES.STRAIGHT, ranks: aceLowRanks, highCard: 5, message: "顺子 (A2345)"};
        }
    }
    
    // 普通顺子判断 (A为14)
    const isStraight = ranks.every((rank, i) => i === 0 || rank === ranks[i-1] - 1);


    // 5张牌的牌型
    if (cards.length === 5) {
        if (isFlush && isStraight) return { type: HAND_TYPES.STRAIGHT_FLUSH, ranks: ranks, highCard: ranks[0], message: "同花顺" };
        if (counts[0] === 4) return { type: HAND_TYPES.FOUR_OF_A_KIND, ranks: ranks, quadRank: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 4)), kicker: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1)), message: "铁支" };
        if (counts[0] === 3 && counts[1] === 2) return { type: HAND_TYPES.FULL_HOUSE, ranks: ranks, threeRank: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3)), pairRank: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2)), message: "葫芦" };
        if (isFlush) return { type: HAND_TYPES.FLUSH, ranks: ranks, message: "同花" };
        if (isStraight) return { type: HAND_TYPES.STRAIGHT, ranks: ranks, highCard: ranks[0], message: "顺子" };
        if (counts[0] === 3) return { type: HAND_TYPES.THREE_OF_A_KIND, ranks: ranks, threeRank: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3)), kickers: ranks.filter(r => r !== parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 3))), message: "三条" };
        if (counts[0] === 2 && counts[1] === 2) {
            const pairs = Object.keys(rankCounts).filter(k => rankCounts[k] === 2).map(Number).sort((a,b)=>b-a);
            return { type: HAND_TYPES.TWO_PAIR, ranks: ranks, highPair: pairs[0], lowPair: pairs[1], kicker: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1)), message: "两对" };
        }
        if (counts[0] === 2) return { type: HAND_TYPES.PAIR, ranks: ranks, pairRank: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2)), kickers: ranks.filter(r => r !== parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2))), message: "对子" };
    }

    // 3张牌的牌型 (头道)
    if (cards.length === 3) {
        // 三条 (冲三)
        if (counts[0] === 3) return { type: HAND_TYPES.THREE_OF_A_KIND, ranks: ranks, threeRank: ranks[0], message: "三条" }; // 头道三条
        // 对子
        if (counts[0] === 2) return { type: HAND_TYPES.PAIR, ranks: ranks, pairRank: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 2)), kicker: parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === 1)), message: "对子" };
    }

    return { type: HAND_TYPES.HIGH_CARD, ranks: ranks, message: "乌龙" }; // 乌龙
}


/**
 * 比较两道牌的大小 (核心)
 * @param {object} handInfo1 - evaluateHand返回的对象
 * @param {object} handInfo2 - evaluateHand返回的对象
 * @returns {number} 1: hand1胜, -1: hand2胜, 0: 平局 (理论上十三水比到具体牌，很少平)
 */
function compareHandInfos(handInfo1, handInfo2) {
    if (handInfo1.type > handInfo2.type) return 1;
    if (handInfo1.type < handInfo2.type) return -1;

    // 牌型相同，比较具体点数
    switch (handInfo1.type) {
        case HAND_TYPES.STRAIGHT_FLUSH:
        case HAND_TYPES.STRAIGHT:
            return handInfo1.highCard > handInfo2.highCard ? 1 : (handInfo1.highCard < handInfo2.highCard ? -1 : 0); // A2345顺子最小
        case HAND_TYPES.FOUR_OF_A_KIND:
            if (handInfo1.quadRank !== handInfo2.quadRank) return handInfo1.quadRank > handInfo2.quadRank ? 1 : -1;
            return handInfo1.kicker > handInfo2.kicker ? 1 : (handInfo1.kicker < handInfo2.kicker ? -1 : 0);
        case HAND_TYPES.FULL_HOUSE:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            // 三条点数相同十三水里不太可能出现，因为只有一副牌，但为逻辑完整性可以加上
            // return handInfo1.pairRank > handInfo2.pairRank ? 1 : (handInfo1.pairRank < handInfo2.pairRank ? -1 : 0);
            return 0; // 假设葫芦的三条不同则分胜负
        case HAND_TYPES.FLUSH:
        case HAND_TYPES.HIGH_CARD:
            // 从大到小比较每一张牌
            for (let i = 0; i < handInfo1.ranks.length; i++) {
                if (handInfo1.ranks[i] > handInfo2.ranks[i]) return 1;
                if (handInfo1.ranks[i] < handInfo2.ranks[i]) return -1;
            }
            return 0; // 完全相同
        case HAND_TYPES.THREE_OF_A_KIND:
            if (handInfo1.threeRank !== handInfo2.threeRank) return handInfo1.threeRank > handInfo2.threeRank ? 1 : -1;
            // 比较kicker (如果是5张牌的三条)
            if (handInfo1.kickers && handInfo2.kickers) {
                 for (let i = 0; i < handInfo1.kickers.length; i++) {
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
            // 比较kicker
            const kickers1 = handInfo1.kickers || [handInfo1.kicker]; // 兼容3张和5张牌的对子
            const kickers2 = handInfo2.kickers || [handInfo2.kicker];
            for (let i = 0; i < kickers1.length; i++) {
                if (kickers1[i] > kickers2[i]) return 1;
                if (kickers1[i] < kickers2[i]) return -1;
            }
            return 0;
        default:
            return 0;
    }
}

/**
 * 检查是否倒水
 * @param {object} topInfo - 头道牌型信息
 * @param {object} middleInfo - 中道牌型信息
 * @param {object} bottomInfo - 尾道牌型信息
 * @returns {boolean} - true 如果倒水
 */
function checkDaoshui(topInfo, middleInfo, bottomInfo) {
    if (compareHandInfos(topInfo, middleInfo) > 0) return true; // 头道大于中道
    if (compareHandInfos(middleInfo, bottomInfo) > 0) return true; // 中道大于尾道
    return false;
}

// --- 特殊牌型判断 (需要详细实现) ---
// 例如：
// function checkSpecialHands(all13Cards) {
//   // 判断一条龙、十三幺等
//   // 返回特殊牌型对象或null
// }

// --- 计分逻辑 (需要详细实现) ---
// function calculateScore(player1Organized, player2Organized) {
//   // ...
// }

// 游戏初始化和流程控制相关函数也需要在这里
// function startGame() { ... }
// function nextRound() { ... }
