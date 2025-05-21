<?php
// backend/api/get_state.php
require_once '../includes/config.php';
require_once '../includes/game_logic.php';

$gameId = $_GET['gameId'] ?? null;
$requestingPlayerId = $_GET['playerId'] ?? null;

if (!$gameId || !$requestingPlayerId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Game ID and Player ID are required.', 'errorType' => 'MISSING_PARAMS']);
    exit;
}

if (!isset($_SESSION[$gameId])) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Game not found.', 'errorType' => 'GAME_NOT_FOUND']);
    exit;
}

$gameState = $_SESSION[$gameId];

if (!isset($gameState['players'][$requestingPlayerId])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Player not part of this game.', 'errorType' => 'PLAYER_NOT_IN_GAME']);
    exit;
}

// Prepare a version of the state safe for client (hides other players' hands)
$clientState = getClientVisibleGameState($gameId, $gameState, $requestingPlayerId);

echo json_encode(['success' => true, 'data' => $clientState]);
?>
