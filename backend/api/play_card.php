<?php
// backend/api/play_card.php
require_once '../includes/config.php';
require_once '../includes/game_logic.php';

$input = json_decode(file_get_contents('php://input'), true);
$gameId = $input['gameId'] ?? null;
$playerId = $input['playerId'] ?? null;
$playedCardIds = $input['cards'] ?? []; // Array of card IDs like ["SA", "HK"]

if (!$gameId || !$playerId || empty($playedCardIds)) {
    echo json_encode(['success' => false, 'message' => 'Game ID, Player ID, and cards are required.']);
    exit;
}

if (!isset($_SESSION[$gameId])) {
    echo json_encode(['success' => false, 'message' => 'Game not found.']);
    exit;
}

$gameState = $_SESSION[$gameId];

if ($gameState['status'] !== 'playing') {
    echo json_encode(['success' => false, 'message' => "Game is not active. Status: {$gameState['status']}"]);
    exit;
}

if (!isset($gameState['players'][$playerId])) {
    echo json_encode(['success' => false, 'message' => 'Player not in this game.']);
    exit;
}

$currentPlayerId = $gameState['turnOrder'][$gameState['currentPlayerIndex']];
if ($playerId !== $currentPlayerId) {
    echo json_encode(['success' => false, 'message' => "It's not your turn."]);
    exit;
}

$player = $gameState['players'][$playerId];

// Validate the play (THIS IS SIMPLIFIED)
$validationResult = isValidPlay($playedCardIds, $player['hand'], $gameState['lastPlayedCardsInfo']);

if (!$validationResult['valid']) {
    echo json_encode(['success' => false, 'message' => $validationResult['message']]);
    exit;
}

$playedCardObjects = $validationResult['playedCardObjects'];

// Remove played cards from player's hand
$newHand = array_filter($player['hand'], function ($cardInHand) use ($playedCardIds) {
    return !in_array($cardInHand['id'], $playedCardIds);
});
$gameState['players'][$playerId]['hand'] = array_values($newHand); // Re-index
sortHand($gameState['players'][$playerId]['hand']);


$gameState['lastPlayedCardsInfo'] = [
    'playerId' => $playerId,
    'cards' => $playedCardObjects // Store the sorted card objects
];
$gameState['passCount'] = 0; // Reset pass count on a successful play

$playerName = $player['name'];
$gameState['lastActionMessage'] = "{$playerName} played " . count($playedCardObjects) . " card(s).";

// Check for winner
$winnerId = determineWinner($gameState);
if ($winnerId) {
    $gameState['status'] = 'finished';
    $gameState['winnerId'] = $winnerId;
    $winnerName = $gameState['players'][$winnerId]['name'];
    $gameState['lastActionMessage'] = "{$playerName} played their last cards! {$winnerName} wins!";
} else {
    // Advance turn
    $gameState['currentPlayerIndex'] = getNextPlayerIndex($gameState['currentPlayerIndex'], count($gameState['turnOrder']));
    $nextPlayerName = $gameState['players'][$gameState['turnOrder'][$gameState['currentPlayerIndex']]]['name'];
    $gameState['lastActionMessage'] .= " Next turn: {$nextPlayerName}.";
}

$_SESSION[$gameId] = $gameState;
echo json_encode(['success' => true, 'message' => 'Cards played successfully.']);
?>
