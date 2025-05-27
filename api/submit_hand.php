<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'game_logic.php';
require_once 'ai_reference.php'; // AI决策

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

function sendError(string $message, int $statusCode = 400): void {
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function sendSuccess(array $gameStateData, string $message = ""): void {
    // 准备给客户端的游戏状态
    $clientGameState = [
        'gameId' => $gameStateData['gameId'],
        'hands' => [ // 只给当前玩家看自己的牌
            'player1' => $gameStateData['hands']['player1'] ?? [], // 假设前端固定为player1
        ],
        'playerCardCounts' => array_map('count', $gameStateData['hands']),
        'currentPlayer' => $gameStateData['currentPlayer'],
        'lastPlayedHand' => $gameStateData['lastPlayedHand'],
        'roundLeadPlayer' => $gameStateData['roundLeadPlayer'],
        'gameOver' => $gameStateData['gameOver'],
        'winner' => $gameStateData['winner'],
        'message' => $message ?: "轮到 " . ($gameStateData['playerNames'][$gameStateData['currentPlayer']] ?? $gameStateData['currentPlayer'])
    ];
    echo json_encode(['success' => true, 'gameState' => $clientGameState]);
    exit;
}


if (!isset($_SESSION['gameState'])) {
    sendError("游戏未开始或会话已过期", 403);
}

$gameState = $_SESSION['gameState'];

if ($gameState['gameOver']) {
    sendError("游戏已结束", 400);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['playerId']) || !isset($input['action'])) {
    sendError("无效的请求数据");
}

$playerId = $input['playerId']; // 前端传来的 player1
$action = $input['action'];
$playedCardsInput = $input['cards'] ?? []; // 前端传来的牌是包含value,suit,displayValue的对象数组

if ($playerId !== $gameState['currentPlayer']) {
    sendError("还没轮到您 ($playerId)，当前是 " . $gameState['currentPlayer'], 403);
}

$playerHand = &$gameState['hands'][$playerId]; // 注意是引用

$message = "";

// --- 处理玩家操作 ---
if ($action === 'play') {
    if (empty($playedCardsInput)) {
        sendError("没有选择要打出的牌");
    }
    // 将前端传来的牌转换为服务器端可用的格式 (如果需要)
    // 此处假设前端传来的牌已经是后端可识别的结构
    // 但最好是根据ID从玩家手牌中精确找到这些牌，以防作弊
    $actualPlayedCards = [];
    $tempPlayerHand = $playerHand; // 复制一份用于查找和移除

    foreach ($playedCardsInput as $playedCardInput) {
        $found = false;
        foreach ($tempPlayerHand as $key => $handCard) {
            if ($handCard['displayValue'] === $playedCardInput['displayValue'] && $handCard['suit'] === $playedCardInput['suit']) {
                $actualPlayedCards[] = $handCard; // 使用服务器端的牌对象
                unset($tempPlayerHand[$key]); // 从临时手牌中移除，表示这张牌被用了
                $found = true;
                break;
            }
        }
        if (!$found) {
            sendError("出牌无效：包含不在您手中的牌 (" . $playedCardInput['displayValue'] . $playedCardInput['suit'] . ")");
        }
    }
    sortHand($actualPlayedCards);


    $playedHandDetails = getHandTypeAndRank($actualPlayedCards);
    if (!$playedHandDetails) {
        sendError("无效的牌型");
    }

    // 检查是否能打过上一手
    $canPlay = false;
    if ($gameState['currentPlayer'] === $gameState['roundLeadPlayer'] || !$gameState['lastPlayedHand'] || empty($gameState['lastPlayedHand']['cards'])) {
        $canPlay = true; // 本轮首次出牌，或上家都不要
    } else {
        // 必须出同张数的牌 (除非是炸弹压普通牌型)
        if (count($actualPlayedCards) !== count($gameState['lastPlayedHand']['cards']) &&
            $playedHandDetails['type'] !== 'quads' && $playedHandDetails['type'] !== 'straight_flush' // 打出的不是炸弹
        ) {
             sendError("出牌张数必须与上一手相同");
        }
        
        if (compareHands($playedHandDetails, $gameState['lastPlayedHand']['typeDetails']) === 1) {
            $canPlay = true;
        }
    }

    if (!$canPlay) {
        sendError("您的牌无法大过上一手牌");
    }

    // 更新手牌
    $newHand = [];
    foreach($playerHand as $cardInHand) {
        $isPlayed = false;
        foreach($actualPlayedCards as $playedC) {
            if($cardInHand['displayValue'] === $playedC['displayValue'] && $cardInHand['suit'] === $playedC['suit']){
                $isPlayed = true;
                break;
            }
        }
        if(!$isPlayed) $newHand[] = $cardInHand;
    }
    $playerHand = $newHand;
    sortHand($playerHand);


    $gameState['lastPlayedHand'] = [
        'playerId' => $playerId,
        'cards' => $actualPlayedCards,
        'typeDetails' => $playedHandDetails
    ];
    $gameState['passesInARow'] = 0;
    $message = ($gameState['playerNames'][$playerId] ?? $playerId) . " 打出了 " . count($actualPlayedCards) . "张牌。";

    if (empty($playerHand)) {
        $gameState['gameOver'] = true;
        $gameState['winner'] = $playerId;
        $_SESSION['gameState'] = $gameState;
        sendSuccess($gameState, ($gameState['playerNames'][$playerId] ?? $playerId) . " 获胜！游戏结束！");
    }

} elseif ($action === 'pass') {
    // 检查是否允许Pass
    if ($gameState['currentPlayer'] === $gameState['roundLeadPlayer'] && (!$gameState['lastPlayedHand'] || empty($gameState['lastPlayedHand']['cards']))) {
        sendError("您是本轮第一个出牌，不能Pass！");
    }
    $gameState['passesInARow']++;
    $message = ($gameState['playerNames'][$playerId] ?? $playerId) . " Pass。";

} else {
    sendError("无效的操作");
}

// --- 轮转和AI处理 ---
$playerIds = array_keys($gameState['hands']);
$currentPlayerIndex = array_search($gameState['currentPlayer'], $playerIds);

do { // 循环直到找到一个非空手牌的玩家，或者游戏结束
    if ($gameState['gameOver']) break;

    $currentPlayerIndex = ($currentPlayerIndex + 1) % count($playerIds);
    $gameState['currentPlayer'] = $playerIds[$currentPlayerIndex];

    // 如果连续Pass使得一轮结束
    if ($gameState['passesInARow'] >= count($playerIds) - 1) {
        if ($gameState['lastPlayedHand'] && $gameState['lastPlayedHand']['playerId']) { // 确保有人出过牌
             $gameState['currentPlayer'] = $gameState['lastPlayedHand']['playerId']; // 由最后出牌的人开始新一轮
             $message .= " 所有其他玩家Pass，轮到 " . ($gameState['playerNames'][$gameState['currentPlayer']] ?? $gameState['currentPlayer']) . " 重新出牌。";
        } else {
            // 如果是游戏开始，第一个人就想pass（但已被阻止），或者一个错误状态
            // 理论上不应该到这里，因为第一个人不能pass
        }
        $gameState['lastPlayedHand'] = null; // 清空出牌区
        $gameState['roundLeadPlayer'] = $gameState['currentPlayer'];
        $gameState['passesInARow'] = 0;
    }
    
    // 如果轮到AI (player2, player3, player4)
    // AI应该在自己的回合内决定，而不是作为上一个玩家操作的附属品
    // 但为了简化，我们在这里立即处理AI，如果下一个是AI
    if (strpos($gameState['currentPlayer'], 'player') === 0 && $gameState['currentPlayer'] !== 'player1' && !$gameState['gameOver']) {
        if (empty($gameState['hands'][$gameState['currentPlayer']])) { // AI没牌了，跳过
            $message .= ($gameState['playerNames'][$gameState['currentPlayer']] ?? $gameState['currentPlayer']) . " 已出完牌，跳过。";
            continue; // 继续找下一个有牌的玩家
        }

        $aiDecision = makeAIDecision(
            $gameState['hands'][$gameState['currentPlayer']],
            $gameState['lastPlayedHand'] ? $gameState['lastPlayedHand']['typeDetails'] : null,
            ($gameState['currentPlayer'] === $gameState['roundLeadPlayer'] || !$gameState['lastPlayedHand'] || empty($gameState['lastPlayedHand']['cards'])),
            $gameState['currentPlayer']
        );

        if ($aiDecision['action'] === 'play') {
            // AI出牌逻辑 (类似人类玩家出牌)
            $aiPlayedCards = $aiDecision['cards'];
            sortHand($aiPlayedCards);
            $aiHandDetails = getHandTypeAndRank($aiPlayedCards);

            // 从AI手牌中移除
            $newAiHand = [];
            foreach($gameState['hands'][$gameState['currentPlayer']] as $cardInHand) {
                $isPlayed = false;
                foreach($aiPlayedCards as $playedC) {
                    if($cardInHand['displayValue'] === $playedC['displayValue'] && $cardInHand['suit'] === $playedC['suit']){
                        $isPlayed = true; break;
                    }
                }
                if(!$isPlayed) $newAiHand[] = $cardInHand;
            }
            $gameState['hands'][$gameState['currentPlayer']] = $newAiHand;
            sortHand($gameState['hands'][$gameState['currentPlayer']]);

            $gameState['lastPlayedHand'] = [
                'playerId' => $gameState['currentPlayer'],
                'cards' => $aiPlayedCards,
                'typeDetails' => $aiHandDetails
            ];
            $gameState['passesInARow'] = 0;
            $message .= " " . ($gameState['playerNames'][$gameState['currentPlayer']] ?? $gameState['currentPlayer']) . " 打出了 " . count($aiPlayedCards) . "张牌.";

            if (empty($gameState['hands'][$gameState['currentPlayer']])) {
                $gameState['gameOver'] = true;
                $gameState['winner'] = $gameState['currentPlayer'];
                $_SESSION['gameState'] = $gameState;
                sendSuccess($gameState, $message . " " .($gameState['playerNames'][$gameState['currentPlayer']] ?? $gameState['currentPlayer']) . " 获胜！游戏结束！");
            }
        } else { // AI Pass
            $gameState['passesInARow']++;
            $message .= " " . ($gameState['playerNames'][$gameState['currentPlayer']] ?? $gameState['currentPlayer']) . " Pass.";
            // 再次检查Pass是否导致轮次结束
            if ($gameState['passesInARow'] >= count($playerIds) - 1) {
                 if ($gameState['lastPlayedHand'] && $gameState['lastPlayedHand']['playerId']) {
                    $gameState['currentPlayer'] = $gameState['lastPlayedHand']['playerId'];
                    $message .= " 所有其他玩家Pass，轮到 " . ($gameState['playerNames'][$gameState['currentPlayer']] ?? $gameState['currentPlayer']) . " 重新出牌。";
                }
                $gameState['lastPlayedHand'] = null;
                $gameState['roundLeadPlayer'] = $gameState['currentPlayer'];
                $gameState['passesInARow'] = 0;
                // 如果下一个又是AI，则循环会继续处理
            }
        }
         // AI操作完，轮到下一个玩家 (currentPlayerIndex会在循环开始时递增)
    } else { // 轮到人类玩家了，或者游戏结束
        break; // 跳出do-while，让人类玩家操作
    }

} while (!$gameState['gameOver'] && $gameState['currentPlayer'] !== 'player1'); // 如果不是人类玩家，或者游戏没结束，则AI继续


$_SESSION['gameState'] = $gameState;
sendSuccess($gameState, $message);
?>
