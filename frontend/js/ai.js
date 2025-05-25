// frontend/js/ai.js

/**
 * AI参考功能：根据当前手牌，返回一个推荐的牌道组合。
 * 这只是一个非常基础的占位符，需要复杂的算法来实现。
 * @param {Array<Object>} playerCards - 玩家的13张牌对象数组。
 * @returns {Object|null} 返回一个对象 {top: [...], middle: [...], bottom: [...]} 或 null（如果无法建议）。
 */
function getAIReferenceOrganization(playerCards) {
    console.log("AI 参考：接收到的牌", JSON.parse(JSON.stringify(playerCards)));
    if (!playerCards || playerCards.length !== 13) {
        console.error("AI 参考：牌数不为13张");
        return null;
    }

    // 极简占位符逻辑：尝试将牌平均分配或按某种简单规则
    // 实际AI需要：
    // 1. 枚举所有可能的牌道组合 (头3, 中5, 尾5)
    // 2. 对每种组合进行评估 (使用 evaluateHand)
    // 3. 确保组合不倒水 (使用 checkDaoshui)
    // 4. 选择一个“最优”或“较好”的组合返回
    //    “最优”的定义可能很复杂，比如期望得分最高，或者最不容易被打枪等。

    // 这是一个非常非常 naive 的实现，仅作演示，【【【【绝对不能用于实际逻辑】】】】
    // 它仅仅是按牌力从大到小依次放入尾道、中道、头道，不考虑倒水和牌型组合优化
    const sortedCards = sortCardsByRank([...playerCards]); // 假设 sortCardsByRank 存在且按牌力降序

    const bottom = sortedCards.slice(0, 5);
    const middle = sortedCards.slice(5, 10);
    const top = sortedCards.slice(10, 13);
    
    // 【【【重要】】】这个 naive 实现很可能导致倒水，需要完整逻辑
    // 应该先尝试组成最强的尾道，然后中道，再头道，并不断检查倒水
    // 例如：先找同花顺、铁支等放入尾道

    // 模拟一个稍微好一点的，但仍然非常简化的逻辑
    // 目标：尽量不倒水，并尝试把最好的牌放尾道
    // 这是一个NP难问题，真正的AI会用启发式搜索或蒙特卡洛树搜索等

    // 尝试生成所有组合（非常耗时，仅用于少量牌或需要优化）
    // 对于13张牌，组合数 C(13,3) * C(10,5) * C(5,5) = 286 * 252 * 1 = 72072
    // 这个数量级可以暴力枚举，但每次评估和排序的成本要注意

    let bestOrganization = null;
    let bestScore = -Infinity; // 假设有一个评分函数能给组合打分

    function generateCombinations(cards, path, remaining, results) {
        if (path.length === 3) { // 头、中、尾都选好了
            const [pTop, pMiddle, pBottom] = path;
            const topInfo = evaluateHand(pTop);
            const middleInfo = evaluateHand(pMiddle);
            const bottomInfo = evaluateHand(pBottom);

            if (!checkDaoshui(topInfo, middleInfo, bottomInfo)) {
                // 假设有一个简单的评分，比如各道牌型等级之和
                const currentScore = topInfo.type + middleInfo.type + bottomInfo.type;
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    bestOrganization = { top: [...pTop], middle: [...pMiddle], bottom: [...pBottom] };
                }
            }
            return;
        }

        const currentStage = path.length; // 0 for top, 1 for middle, 2 for bottom
        const numToSelect = currentStage === 0 ? 3 : 5;

        if (remaining.length < numToSelect) return;

        function findN(arr, n, currentSelection, startIndex, currentPathResults) {
            if (currentSelection.length === n) {
                const nextRemaining = arr.filter(c => !currentSelection.find(sel => sel.id === c.id));
                generateCombinations(cards, [...path, [...currentSelection]], nextRemaining, results);
                return;
            }
            if (startIndex >= arr.length) return;

            // Include current element
            currentSelection.push(arr[startIndex]);
            findN(arr, n, currentSelection, startIndex + 1, currentPathResults);
            currentSelection.pop(); // Backtrack

            // Exclude current element
            findN(arr, n, currentSelection, startIndex + 1, currentPathResults);
        }
        findN(remaining, numToSelect, [], 0, results);
    }

    generateCombinations(playerCards, [], [...playerCards], []);


    if (bestOrganization) {
        console.log("AI 参考找到的最佳组合:", bestOrganization, "评分为:", bestScore);
        return bestOrganization;
    } else {
         // 如果暴力枚举没找到（不太可能，除非评分或倒水逻辑有问题），返回naive的
        console.warn("AI 参考：未能通过枚举找到不倒水的组合，返回naive版本（可能倒水）");
        return { top, middle, bottom };
    }
}

/**
 * AI托管功能：根据当前手牌，返回一个确定的牌道组合以供游戏直接使用。
 * @param {Array<Object>} playerCards - 玩家的13张牌对象数组。
 * @returns {Object|null} 返回一个对象 {top: [...], middle: [...], bottom: [...]} 或 null。
 */
function getAITakeoverOrganization(playerCards) {
    // AI托管可以使用与AI参考相同的逻辑，或者更激进/保守的策略
    // 目前直接复用参考逻辑
    console.log("AI 托管：接收到的牌", JSON.parse(JSON.stringify(playerCards)));
    const org = getAIReferenceOrganization(playerCards);
    if (org) {
        // 确保返回的牌仍然是原始牌对象的引用或具有相同ID的副本
        // getAIReferenceOrganization内部的 bestOrganization = { top: [...pTop], ...} 使用了扩展运算符，是副本
        // 这通常是好的，避免修改原始牌数据。
        // 但要确保牌对象结构一致。
        // 验证返回的牌确实是来自 playerCards (通过ID)
        const checkCards = (organizedSet, originalSet) => {
            const organizedIds = new Set([...organizedSet.top, ...organizedSet.middle, ...organizedSet.bottom].map(c => c.id));
            const originalIds = new Set(originalSet.map(c => c.id));
            if (organizedIds.size !== 13 || originalIds.size !== 13) return false;
            for (const id of organizedIds) {
                if (!originalIds.has(id)) return false;
            }
            return true;
        };
        if (!checkCards(org, playerCards)) {
            console.error("AI 托管：返回的牌与原始牌不匹配！");
            return null; // 防止使用错误的牌数据
        }
    }
    return org;
}
