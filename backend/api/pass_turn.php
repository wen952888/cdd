<?php
// backend/api/pass_turn.php
require_once '../includes/config.php';
require_once '../includes/game_logic.php';

$input = json_decode(file_get_contents('php://input'), true);
$gameId = $input['gameId'] ?? null;
$playerId = $input['playerId'] ?? null;

if (!$gameId || !$playerId) {
    echo json_encode(['success' => false, 'message' => 'Game ID and Player ID are required.']);
    exit;
}

if (!isset($_SESSION[$gameId])) {
    echo json_encode(['success' => false, 'message' => 'Game not found.']);
    exit;
}

$gameState = $_SESSION[$gameId];

if ($gameState['status'] !== 'playing') {
    echo json_encode(['success' => false, 'message' => 'Game is not active.']);
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

// Cannot pass if you are starting a new round (i.e., no last played cards or you were the last one to play)
if ($gameState['lastPlayedCardsInfo'] === null || $gameState['lastPlayedCardsInfo']['playerId'] === $playerId) {
     if ($gameState['passCount'] < (count($gameState['players']) -1) ) { // If not everyone else has passed
        echo json_encode(['success' => false, 'message' => "You cannot pass when you are starting a new round."]);
        exit;
     }
}


$gameState['passCount']++;
$playerName = $gameState['players'][$playerId]['name'];
$gameState['lastActionMessage'] = "{$playerName} passed.";

// If all other players pass, the player who last played cards gets to start a new round
// For 4 players, if 3 pass, the round resets for the current player (who is about to be advanced to)
$numPlayers = count($gameState['players']);
if ($gameState['passCount'] >= ($numPlayers - 1) && $numPlayers > 1) {
    $gameState['lastPlayedCardsInfo'] = null; // Clear the table
    $gameState['passCount'] = 0; // Reset pass count
    // The next player (who might be the one who just played last successfully before passes) gets to start
    $gameState['lastActionMessage'] .= " Everyone passed. Table cleared.";
}

// Advance turn
$gameState['currentPlayerIndex'] = getNextPlayerIndex($gameState['currentPlayerIndex'], $numPlayers);
$nextPlayerName = $gameState['players'][$gameState['turnOrder'][$gameState['currentPlayerIndex']]]['name'];
$gameState['lastActionMessage'] .= " Next turn: {$nextPlayerName}.";


$_SESSION[$gameId] = $gameState;
echo json_encode(['success' => true, 'message' => 'Turn passed.']);
?>
