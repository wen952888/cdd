<?php
declare(strict_types=1);

// require_once 'game_logic.php'; // game_logic.php 的函数会被 submit_hand.php 引入

function makeAIDecision(array $aiHand, ?array $lastPlayedHandDetails, bool $isLeadingTurn, string $aiPlayerId): array {
    sortHand($aiHand); // 确保AI手牌有序

    // 1. 如果是领出 (isLeadingTurn is true OR lastPlayedHandDetails is null)
    if ($isLeadingTurn || $lastPlayedHandDetails === null || empty($lastPlayedHandDetails['cards'])) {
        // AI尝试打出手中最小的单张
        if (!empty($aiHand)) {
            $cardToPlay = $aiHand[0]; // 打第一张（最小的）
            return ['action' => 'play', 'cards' => [$cardToPlay]];
        }
        return ['action' => 'pass']; // 没牌了？不可能到这里
    }

    // 2. 如果需要压过上一手牌
    // 尝试找到能打过上一手牌的最小组合 (极度简化：只尝试打出相同牌型的更大牌)
    
    // 尝试打单张
    if ($lastPlayedHandDetails['type'] === 'single' && count($lastPlayedHandDetails['cards']) === 1) {
        foreach ($aiHand as $card) {
            if ($card['rank'] > $lastPlayedHandDetails['rankCard']['rank']) {
                return ['action' => 'play', 'cards' => [$card]];
            }
        }
    }

    // 尝试打对子 (简化：只找点数更大的对子)
    if ($lastPlayedHandDetails['type'] === 'pair' && count($lastPlayedHandDetails['cards']) === 2) {
        for ($i = 0; $i < count($aiHand) - 1; $i++) {
            if ($aiHand[$i]['value'] === $aiHand[$i+1]['value']) { // 找到一个对子
                // 比较这个对子和上一手对子
                $currentPairDetails = getHandTypeAndRank([$aiHand[$i], $aiHand[$i+1]]);
                if ($currentPairDetails && compareHands($currentPairDetails, $lastPlayedHandDetails) === 1) {
                    return ['action' => 'play', 'cards' => [$aiHand[$i], $aiHand[$i+1]]];
                }
            }
        }
    }
    
    // ... 此处可以添加对其他牌型的处理逻辑，如三条、顺子等 ...
    // 现实的AI会尝试所有可能的组合，并从中选择最优的。
    // 这里的AI非常笨，很多情况会选择Pass。

    // 如果找不到能打的，就Pass
    return ['action' => 'pass'];
}
?>
