// frontend/js/ai.js

let aiReferenceSuggestions = [];
let currentSuggestionIndex = 0;

// Helper: Standard combinations generator C(n,k)
function* combinations(arr, k) {
    if (k < 0 || k > arr.length) return;
    if (k === 0) { yield []; return; }
    if (arr.length === k) { yield [...arr]; return; }
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

function* getAllValidArrangements(cards) {
    if (!cards || cards.length !== 13) {
        console.error("getAllValidArrangements: 需要13张牌");
        return; // Stop generation if input is invalid
    }

    const allCards = [...cards]; // Work with a copy

    for (const topHand of combinations(allCards, 3)) {
        const remainingAfterTop = allCards.filter(c1 => !topHand.find(c2 => c1.id === c2.id));
        if (remainingAfterTop.length !== 10) continue;

        for (const middleHand of combinations(remainingAfterTop, 5)) {
            const bottomHand = remainingAfterTop.filter(c1 => !middleHand.find(c2 => c1.id === c2.id));
            if (bottomHand.length !== 5) continue;

            // Ensure all cards are unique across hands (double check due to filter logic)
            const allSelectedCards = [...topHand, ...middleHand, ...bottomHand];
            if (new Set(allSelectedCards.map(c => c.id)).size !== 13) {
                // console.warn("getAllValidArrangements: Card duplication detected in arrangement, skipping.");
                continue;
            }


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

function scoreArrangement(arrangement) {
    if (!arrangement || !arrangement.topInfo || !arrangement.middleInfo || !arrangement.bottomInfo) return -Infinity;
    let score = 0;
    // Weighted score based on hand type and position
    score += arrangement.topInfo.type * 10;    // Base score for type
    score += arrangement.middleInfo.type * 30;
    score += arrangement.bottomInfo.type * 50;

    // Add bonuses for stronger actual ranks within the same type
    // Example: A high flush > K high flush
    const rankBonus = (info) => {
        if (info.ranks && info.ranks.length > 0) {
            // Sum of first few significant ranks (e.g., pair rank, kicker)
            return info.ranks.slice(0, 3).reduce((acc, r) => acc + r, 0) * 0.1;
        }
        return 0;
    };
    score += rankBonus(arrangement.topInfo);
    score += rankBonus(arrangement.middleInfo);
    score += rankBonus(arrangement.bottomInfo);

    // Bonus for specific strong hands in good positions
    if (arrangement.bottomInfo.type >= HAND_TYPES.FULL_HOUSE) score += 500;
    if (arrangement.middleInfo.type >= HAND_TYPES.STRAIGHT) score += 200;
    if (arrangement.topInfo.type === HAND_TYPES.THREE_OF_A_KIND) score += 300;


    return score;
}

function generateAIReferenceSuggestions(playerCards, count = 3) {
    aiReferenceSuggestions = [];
    currentSuggestionIndex = 0;
    if (!playerCards || playerCards.length !== 13) {
        console.error("generateAIReferenceSuggestions: 牌输入无效");
        return;
    }

    const validArrangements = [];
    for (const arrangement of getAllValidArrangements(playerCards)) {
        if (arrangement) {
            arrangement.score = scoreArrangement(arrangement);
            validArrangements.push(arrangement);
        }
    }

    validArrangements.sort((a, b) => b.score - a.score); // Sort by score descending
    aiReferenceSuggestions = validArrangements.slice(0, count);

    if (aiReferenceSuggestions.length === 0) {
        console.warn("AI未能生成任何有效的参考建议。可能牌太差或评分函数需调整。");
        // Fallback: Provide a very basic (likely bad) arrangement
        const sortedCards = sortCardsByRank([...playerCards]); // Assuming sortCardsByRank is in game.js
        aiReferenceSuggestions.push({
            top: sortedCards.slice(10, 13),
            middle: sortedCards.slice(5, 10),
            bottom: sortedCards.slice(0, 5),
            score: -Infinity,
            message: "保底建议 (可能倒水)"
        });
    }
    console.log(`AI生成了 ${aiReferenceSuggestions.length} 个参考建议。`);
}

function getNextAIReference() {
    if (!aiReferenceSuggestions || aiReferenceSuggestions.length === 0) return null;
    const suggestion = aiReferenceSuggestions[currentSuggestionIndex];
    currentSuggestionIndex = (currentSuggestionIndex + 1) % aiReferenceSuggestions.length;
    return suggestion;
}

function getAITakeoverOrganization(playerCards) {
    if (!playerCards || playerCards.length !== 13) {
        console.error("getAITakeoverOrganization: 牌输入无效");
        return null;
    }

    let bestArrangement = null;
    let maxScore = -Infinity;

    for (const arrangement of getAllValidArrangements(playerCards)) {
        if (arrangement) {
            const currentScore = scoreArrangement(arrangement);
            if (currentScore > maxScore) {
                maxScore = currentScore;
                // Create new arrays for the best arrangement to avoid reference issues
                bestArrangement = {
                    top: [...arrangement.top],
                    middle: [...arrangement.middle],
                    bottom: [...arrangement.bottom]
                };
            }
        }
    }

    if (bestArrangement) {
        console.log("AI托管决策的最优组合 (评分:", maxScore,"):", JSON.parse(JSON.stringify(bestArrangement)));
    } else {
        console.warn("AI托管未能找到最优组合。返回保底。");
        const sortedCards = sortCardsByRank([...playerCards]);
        bestArrangement = {
            top: sortedCards.slice(10, 13),
            middle: sortedCards.slice(5, 10),
            bottom: sortedCards.slice(0, 5)
        };
    }
    return bestArrangement;
}
