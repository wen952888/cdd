<?php
// backend/api/join_game.php
require_once '../includes/config.php';
require_once '../includes/game_logic.php';

$input = json_decode(file_get_contents('php://input'), true);
$gameId = $input['gameId'] ?? null;
$playerName = trim($input['playerName'] ?? 'Player');

if (empty($playerName) || empty($gameId)) {
    echo json_encode(['success' => false, 'message' => 'Game ID and Player name are required.']);
    exit;
}

if (!isset($_SESSION[$gameId])) {
    echo json_encode(['success' => false, 'message' => 'Game not found.']);
    exit;
}

$gameState = $_SESSION[$gameId];

if (count($gameState['players']) >= MAX_PLAYERS) {
    echo json_encode(['success' => false, 'message' => 'Game is full.']);
    exit;
}

if ($gameState['status'] !== 'waiting') {
    echo json_encode(['success' => false, 'message' => 'Game has already started or finished.']);
    exit;
}


$newPlayerId = 'player_' . uniqid();
foreach ($gameState['players'] as $existingPlayer) {
    if ($existingPlayer['name'] === $playerName) {
        // Potentially allow rejoining if implementing that feature, for now, unique names
        echo json_encode(['success' => false, 'message' => "Player name '{$playerName}' is already taken in this game."]);
        exit;
    }
}

$gameState['players'][$newPlayerId] = [
    'id' => $newPlayerId,
    'name' => $playerName,
    'hand' => []
];
$gameState['turnOrder'][] = $newPlayerId; // Add to turn order
$gameState['lastActionMessage'] = "{$playerName} joined the game.";


// If game is now full, deal cards and start
if (count($gameState['players']) === MAX_PLAYERS) {
    $playerHands = dealCards($gameState['players'], $gameState['deck']);
    foreach ($playerHands as $pid => $hand) {
        sortHand($hand); // Sort hands once dealt
        $gameState['players'][$pid]['hand'] = $hand;
    }
    $gameState['deck'] = []; // Deck is now empty
    $gameState['status'] = 'playing';
    // Determine who starts (e.g., player with 3 of Diamonds - not implemented here, first player starts)
    $gameState['currentPlayerIndex'] = 0; // First player in turnOrder starts
    $starterName = $gameState['players'][$gameState['turnOrder'][0]]['name'];
    $gameState['lastActionMessage'] = "All players joined. Game started! {$starterName}'s turn.";
}

$_SESSION[$gameId] = $gameState;

echo json_encode([
    'success' => true,
    'gameId' => $gameId,
    'playerId' => $newPlayerId,
    'message' => 'Successfully joined game.'
]);
?>
