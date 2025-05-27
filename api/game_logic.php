<?php
declare(strict_types=1);

// 定义牌的常量
define('SUITS', ['diamonds', 'clubs', 'hearts', 'spades']); // 方块<梅花<红桃<黑桃
define('DISPLAY_VALUES', ['3','4','5','6','7','8','9','10','J','Q','K','A','2']);
define('CARD_VALUES', [ // 用于比较大小
    '3' => 3, '4' => 4, '5' => 5, '6' => 6, '7' => 7, '8' => 8, '9' => 9, '10' => 10,
    'J' => 11, 'Q' => 12, 'K' => 13, 'A' => 14, '2' => 15
]);

// --- 卡牌创建与处理 ---
function createDeck(): array {
    $deck = [];
    foreach (SUITS as $suit) {
        foreach (DISPLAY_VALUES as $displayValue) {
            $deck[] = [
                'displayValue' => $displayValue,
                'suit' => $suit,
                'value' => CARD_VALUES[$displayValue], // 数值，用于比较
                'rank' => CARD_VALUES[$displayValue] * 4 + array_search($suit, SUITS) // 综合排序值
            ];
        }
    }
    return $deck;
}

function shuffleDeck(array &$deck): void {
    shuffle($deck);
}

function dealCards(array $deck, int $numPlayers = 4): array {
    $hands = array_fill_keys(array_map(fn($i) => "player".($i+1), range(0, $numPlayers-1)), []);
    $playerIndex = 0;
    foreach ($deck as $card) {
        $playerKeys = array_keys($hands);
        $hands[$playerKeys[$playerIndex]][] = $card;
        $playerIndex = ($playerIndex + 1) % $numPlayers;
    }

    foreach ($hands as $playerId => &$hand) {
        sortHand($hand);
    }
    return $hands;
}

function sortHand(array &$hand): void {
    usort($hand, function ($a, $b) {
        return $a['rank'] <=> $b['rank']; // 使用综合排序值
    });
}

// --- 牌型判断与比较 ---

// 获取牌型 (非常简化，只处理单张、对子、三条、五张牌的顺子、同花、葫芦、炸弹、同花顺)
function getHandTypeAndRank(array $cards): ?array {
    if (empty($cards)) return null;
    sortHand($cards); // 确保牌是排序的

    $n = count($cards);
    $values = array_map(fn($c) => $c['value'], $cards);
    $suits = array_map(fn($c) => $c['suit'], $cards);
    $displayValues = array_map(fn($c) => $c['displayValue'], $cards);

    // 单张
    if ($n === 1) return ['type' => 'single', 'rankCard' => $cards[0], 'cards' => $cards];

    // 对子
    if ($n === 2 && $values[0] === $values[1]) return ['type' => 'pair', 'rankCard' => $cards[1], 'cards' => $cards]; // 取花色大的那张作为rankCard

    // 三条
    if ($n === 3 && $values[0] === $values[1] && $values[1] === $values[2]) return ['type' => 'triple', 'rankCard' => $cards[2], 'cards' => $cards];


    if ($n === 5) {
        $isFlush = count(array_unique($suits)) === 1;
        
        // 检查是否为顺子 (A2345 和 10JQKA)
        $isStraight = false;
        $uniqueValues = array_unique($values);
        sort($uniqueValues); // 确保唯一值数组是排序的
        if (count($uniqueValues) === 5) { // 必须是5个不同的值
            // 普通顺子: 检查是否连续
            $isNormalStraight = true;
            for ($i = 0; $i < 4; $i++) {
                if ($uniqueValues[$i+1] - $uniqueValues[$i] !== 1) {
                    $isNormalStraight = false;
                    break;
                }
            }
            // 特殊顺子 A,2,3,4,5 (value: 14,15,3,4,5 -> sort: 3,4,5,14,15)
            // 锄大地中2是最大的，所以A2345通常不作为顺子，或作为最小顺子 2345A
            // 此处简化：10-J-Q-K-A (10,11,12,13,14) 是最大顺子。2不能在顺子中当2。
            // A-2-3-4-5 (14,3,4,5,6) 不是标准顺子。但有时 2-3-4-5-A (A当1) 是最小顺。
            // 这里我们只认数值连续的。
            if ($isNormalStraight) $isStraight = true;

            // 大弟的顺子规则特殊，2不能参与普通顺子，A可以。10JQKA最大，A2345最小
            // 这里的isStraight判断需要根据具体锄大地规则调整
            // 简化版：只认数值连续
            if( ($uniqueValues[4] - $uniqueValues[0] === 4) ) $isStraight = true;
        }


        // 同花顺: 顺子+同花 (大弟里同花顺最大)
        if ($isStraight && $isFlush) return ['type' => 'straight_flush', 'rankCard' => $cards[4], 'cards' => $cards]; // 按最大牌的rank比较

        // 炸弹 (四条带一张，这里简化为只有四张一样的)
        // 锄大地通常是四张一样的牌 + 任意一张，或者直接就是“炸弹”牌型
        // 此处我们认为5张牌中4张一样是"四条"类型，但通常五张牌的“炸弹/铁支”是强于“同花顺”之外的牌型
        // 这里简单处理一种情况：AAAA K (四条带单)
        $valueCounts = array_count_values($values);
        arsort($valueCounts);
        $firstCount = reset($valueCounts);
        if ($firstCount === 4) { // 四条
            $quadValue = key($valueCounts);
            $quadRankCard = null;
            foreach(array_reverse($cards) as $c){ if($c['value'] === $quadValue) {$quadRankCard = $c; break;}} // 找到这四张里花色最大的
            return ['type' => 'quads', 'rankCard' => $quadRankCard, 'cards' => $cards]; // rankCard 是四张中最大的那张
        }
        
        // 葫芦 (三条带对子)
        if ( ( ($values[0] === $values[1] && $values[1] === $values[2]) && ($values[3] === $values[4]) ) ||
             ( ($values[0] === $values[1]) && ($values[2] === $values[3] && $values[3] === $values[4]) ) ) {
            // 找出三条的那张牌作为rankCard
            $rankCard = ($valueCounts[$values[2]] === 3) ? $cards[2] : $cards[4]; // 取三条中花色最大的
            if($values[0] === $values[1] && $values[1] === $values[2]) { // AAA BB
                 $rankCard = $cards[2]; // 取三条中的牌
            } else { // AA BBB
                 $rankCard = $cards[4]; // 取三条中的牌
            }
            return ['type' => 'full_house', 'rankCard' => $rankCard, 'cards' => $cards];
        }

        // 同花 (非顺子)
        if ($isFlush) return ['type' => 'flush', 'rankCard' => $cards[4], 'cards' => $cards]; // 比最大一张牌的点数，再比花色

        // 顺子 (非同花)
        if ($isStraight) return ['type' => 'straight', 'rankCard' => $cards[4], 'cards' => $cards]; // 比最大一张牌的点数，再比花色
    }
    
    // 其他五张牌组合在锄大弟中通常不被认为是标准牌型，除非是“五鬼”等特殊规则
    // 此处简化，不符合以上的就是无效牌型

    return null; // 无效或未识别的牌型
}


// 比较两手牌 (假设牌型已确定且手牌张数相同，或者打出的是炸弹)
// 返回: 1 (hand1 > hand2), 0 (相等, 不可能在锄大弟中), -1 (hand1 < hand2)
function compareHands(array $hand1Details, array $hand2Details): int {
    $typePriority = [ // 牌型优先级，数字越大越优先
        'single' => 1, 'pair' => 2, 'triple' => 3,
        'straight' => 4, 'flush' => 5, 'full_house' => 6,
        'quads' => 7, // 四条（非同花顺的炸弹）
        'straight_flush' => 8 // 同花顺（最大的炸弹）
    ];

    // 1. 如果牌型不同 (只有炸弹可以压非炸弹，或者同为5张牌型时比较优先级)
    if ($hand1Details['type'] !== $hand2Details['type']) {
        // 规则：高级牌型可以压低级牌型（当张数相同时）
        // 炸弹可以压所有非炸弹的5张牌型
        $p1 = $typePriority[$hand1Details['type']];
        $p2 = $typePriority[$hand2Details['type']];

        if (count($hand1Details['cards']) === count($hand2Details['cards']) || 
            $hand1Details['type'] === 'quads' || $hand1Details['type'] === 'straight_flush') { // 张数相同，或打出的是炸弹
            if ($p1 > $p2) return 1;
            if ($p1 < $p2) return -1;
        }
        // 如果张数不同，且打出的不是炸弹压普通牌，则通常不可比较 (除非是同类型但张数不同，如三带一 vs 三带二，这在锄大地不常见)
        return 0; // 默认不可比较或视为相等（逻辑错误）
    }

    // 2. 牌型相同，比较rankCard
    // rankCard 已经在 getHandTypeAndRank 中设定为该牌型中起决定性作用的牌
    if ($hand1Details['rankCard']['rank'] > $hand2Details['rankCard']['rank']) return 1;
    if ($hand1Details['rankCard']['rank'] < $hand2Details['rankCard']['rank']) return -1;

    return 0; // 完全相同 (理论上不应发生，除非是bug或首轮出牌)
}

// 查找第一个拿到梅花3的玩家 (锄大地的经典开局规则)
function findStartingPlayer(array $playerHands): string {
    foreach ($playerHands as $playerId => $hand) {
        foreach ($hand as $card) {
            if ($card['displayValue'] === '3' && $card['suit'] === 'clubs') { // 梅花3
                return $playerId;
            }
        }
    }
    // 如果没有梅花3 (例如测试时牌不全)，则随机选一个或player1
    $playerKeys = array_keys($playerHands);
    return $playerKeys[0] ?? 'player1';
}
?>
