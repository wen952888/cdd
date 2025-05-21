<?php
// backend/api/create_game.php
require_once '../includes/config.php';
require_once '../includes/game_logic.php';

$input = json_decode(file_get_contents('php://input'), true);
$playerName = trim($input['playerName'] ?? 'Player');

if (empty($playerName)) {
    echo json_encode(['success' => false, 'message' => 'Player name cannot be empty.']);
    exit;
}

$gameId = 'game_' . uniqid();
$playerId = 'player_' . uniqid();

$deck = createDeck();
shuffleDeck($deck);

$newPlayer = [
    'id' => $playerId,
    'name' => $playerName,
    'hand' => [] // Cards dealt later or on game start
];

$initialGameState = [
    'gameId' => $gameId,
    'status' => 'waiting', // 'waiting', 'playing', 'finished'
    'players' => [$playerId => $newPlayer],
    'deck' => $deck, // Store remaining deck
    'turnOrder' => [$playerId], // Player who creates is first in turn order for now
    'currentPlayerIndex' => 0,
    'lastPlayedCardsInfo' => null, // Structure: ['playerId' => ..., 'cards' => [...card objects...]]
    'passCount' => 0,
    'winnerId' => null,
    'lastActionMessage' => "Game created by {$playerName}. Waiting for players..."
];

// For a 1-player create, we don't deal yet. We wait for more players.
$_SESSION[$gameId] = $initialGameState;

echo json_encode([
    'success' => true,
    'gameId' => $gameId,
    'playerId' => $playerId,
    'message' => 'Game created successfully. Waiting for other players.'
]);
?>
