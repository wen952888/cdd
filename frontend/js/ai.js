// frontend/js/ai.js

let aiReferenceSuggestions = []; // 用于存储多个AI建议
let currentSuggestionIndex = 0;  // 当前显示的建议索引

/**
 * 生成器函数：获取所有不倒水的牌道组合。
 * @param {Array<Object>} cards - 13张牌对象数组。
 */
function* getAllValidArrangements(cards) {
    if (cards.length !== 13) {
        console.error("getAllValidArrangements: 需要13张牌");
        yield null; // 或者 throw error
        return;
    }

    const allCards = [...cards];

    // 标准组合生成器 (C(n,k))
    function* combinations(arr, k) {
        if (k < 0 || k > arr.length) return;
        if (k === 0) {
            yield [];
            return;
        }
        if (arr.length === k) {
            yield [...arr];
            return;
        }
        if (arr.length === 0 && k > 0) return;

        const head = arr[0];
        const tail = arr.slice(1);

        for (const combo of combinations(tail, k - 1)) {
            yield [head, ...combo];
        }
        for (const combo of combinations(tail, k)) {
            yield combo;
        }
    }

    for (const topHand of combinations(allCards, 3)) {
        const remainingAfterTop = allCards.filter(c => !topHand.find(tc => tc.id === c.id));
        if (remainingAfterTop.length !== 10) continue; // 安全检查

        for (const middleHand of combinations(remainingAfterTop, 5)) {
            const bottomHand = remainingAfterTop.filter(c => !middleHand.find(mc => mc.id === c.id));
            if (bottomHand.length !== 5) continue; // 安全检查

            const topInfo = evaluateHand(topHand);
            const middleInfo = evaluateHand(middleHand);
            const bottomInfo = evaluateHand(bottomHand);

            if (!checkDaoshui(topInfo, middleInfo, bottomInfo)) {
                yield {
                    top: [...topHand], middle: [...middleHand], bottom: [...bottomHand],
                    topInfo, middleInfo, bottomInfo
                };
            }
        }
    }
}


/**
 * AI评分函数：给一个合法的牌道组合打分。
 * @param {Object} arrangement - 包含三道牌及牌型信息的对象。
 * @returns {number} 分数。
 */
function scoreArrangement(arrangement) {
    if (!arrangement) return -Infinity;
    let score = 0;
    // 基础分是牌型等级，可以加权重
    score += arrangement.topInfo.type * 1;    // 例如头道权重低
    score += arrangement.middleInfo.type * 2; // 中道权重中
    score += arrangement.bottomInfo.type * 3; // 尾道权重高

    // 根据牌型具体点数进行加分 (更细致的评分)
    // 例如：葫芦比顺子分数高，但都是葫芦时，三条大的葫芦分更高
    // 这里可以扩展很多，比如对特定牌型（如铁支、同花顺在尾道）给予巨大加分

    // 示例：对子点数加成
    const addPairBonus = (info) => {
        if (info.type === HAND_TYPES.PAIR && info.ranks.length > 0) return info.ranks[0] * 0.1;
        if (info.type === HAND_TYPES.TWO_PAIR && info.ranks.length > 0) return (info.ranks[0] + info.ranks[2]) * 0.1;
        if (info.type === HAND_TYPES.THREE_OF_A_KIND && info.ranks.length > 0) return info.ranks[0] * 0.2;
        // ... 更多具体牌型的点数加成
        return 0;
    };
    score += addPairBonus(arrangement.topInfo);
    score += addPairBonus(arrangement.middleInfo);
    score += addPairBonus(arrangement.bottomInfo);
    
    return score;
}


/**
 * AI参考功能：生成多个不同的、合理的牌道组合建议。
 * @param {Array<Object>} playerCards - 玩家的13张牌对象数组。
 * @param {number} count - 需要生成的建议数量。
 */
function generateAIReferenceSuggestions(playerCards, count = 3) {
    aiReferenceSuggestions = [];
    currentSuggestionIndex = 0;
    if (!playerCards || playerCards.length !== 13) return;

    const validArrangements = [];
    for (const arrangement of getAllValidArrangements(playerCards)) {
        if (arrangement) {
            arrangement.score = scoreArrangement(arrangement);
            validArrangements.push(arrangement);
        }
    }

    // 按分数降序排列
    validArrangements.sort((a, b) => b.score - a.score);

    // 取前N个，或者如果少于N个则全部取出
    aiReferenceSuggestions = validArrangements.slice(0, count);

    if (aiReferenceSuggestions.length === 0) {
        console.warn("AI未能生成任何有效的参考建议。");
        // 可以尝试一个保底的、非常简单的摆法（即使可能倒水）
        const sortedCards = sortCardsByRank([...playerCards]);
        aiReferenceSuggestions.push({
            top: sortedCards.slice(10, 13),
            middle: sortedCards.slice(5, 10),
            bottom: sortedCards.slice(0, 5),
            score: -Infinity, // 标记为低质量
            message: "保底建议 (可能倒水)"
        });
    }
    console.log(`AI生成了 ${aiReferenceSuggestions.length} 个参考建议。`);
}

/**
 * 获取下一个AI参考建议。
 * @returns {Object|null} AI建议的牌道组合或null。
 */
function getNextAIReference() {
    if (aiReferenceSuggestions.length === 0) return null;
    const suggestion = aiReferenceSuggestions[currentSuggestionIndex];
    currentSuggestionIndex = (currentSuggestionIndex + 1) % aiReferenceSuggestions.length; // 循环获取
    return suggestion;
}

/**
 * AI托管决策：从所有有效组合中选择最优的一个。
 * @param {Array<Object>} playerCards - 玩家的13张牌对象数组。
 * @returns {Object|null} 最优的牌道组合或null。
 */
function getAITakeoverOrganization(playerCards) {
    if (!playerCards || playerCards.length !== 13) return null;

    let bestArrangement = null;
    let maxScore = -Infinity;

    for (const arrangement of getAllValidArrangements(playerCards)) {
        if (arrangement) {
            const currentScore = scoreArrangement(arrangement);
            if (currentScore > maxScore) {
                maxScore = currentScore;
                bestArrangement = {
                    top: arrangement.top,
                    middle: arrangement.middle,
                    bottom: arrangement.bottom
                };
            }
        }
    }
    if (bestArrangement) {
        console.log("AI托管决策的最优组合:", bestArrangement, "评分为:", maxScore);
    } else {
        console.warn("AI托管未能找到最优组合，可能返回一个保底组合。");
        // 保底：如果找不到任何不倒水的（理论上不应该发生，除非牌太差或逻辑问题）
        // 就返回一个简单排序的（很可能倒水）
        const sortedCards = sortCardsByRank([...playerCards]);
        bestArrangement = {
            top: sortedCards.slice(10, 13),
            middle: sortedCards.slice(5, 10),
            bottom: sortedCards.slice(0, 5)
        };
    }
    return bestArrangement;
}
