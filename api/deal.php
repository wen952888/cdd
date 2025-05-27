<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *"); // 允许所有来源，生产环境请指定前端域名
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'game_logic.php';

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

$deck = createDeck();
shuffleDeck($deck);
$playerHands = dealCards($deck);

$startingPlayer = findStartingPlayer($playerHands); // 找到梅花3的玩家

$gameId = uniqid('game_'); // 生成一个简单的游戏ID

$_SESSION['gameState'] = [
    'gameId' => $gameId,
    'hands' => $playerHands,
    'currentPlayer' => $startingPlayer,
    'lastPlayedHand' => null, // ['playerId' => null, 'cards' => [], 'typeDetails' => null]
    'roundLeadPlayer' => $startingPlayer, // 本轮的领出者
    'passesInARow' => 0,
    'gameOver' => false,
    'winner' => null,
    'playerNames' => [ // 可以从前端JS的playerElements同步或在此定义
        'player1' => '玩家 1 (您)',
        'player2' => '玩家 2',
        'player3' => '玩家 3',
        'player4' => '玩家 4',
    ]
];

// 为前端准备数据
$clientGameState = [
    'gameId' => $_SESSION['gameState']['gameId'],
    'hands' => [ // 只给当前玩家看自己的牌，其他玩家给牌数
        'player1' => $_SESSION['gameState']['hands']['player1'], // 假设前端固定为player1
        // 其他玩家的牌不直接发给前端，只发数量
    ],
    'playerCardCounts' => array_map('count', $_SESSION['gameState']['hands']),
    'currentPlayer' => $_SESSION['gameState']['currentPlayer'],
    'lastPlayedHand' => $_SESSION['gameState']['lastPlayedHand'],
    'roundLeadPlayer' => $_SESSION['gameState']['roundLeadPlayer'],
    'gameOver' => false,
    'winner' => null,
    'message' => "新游戏开始！轮到 " . ($_SESSION['gameState']['playerNames'][$startingPlayer] ?? $startingPlayer) . " (持有梅花3者优先)."
];


echo json_encode(['success' => true, 'gameState' => $clientGameState]);
exit;
?>
