<?php
// IMPORTANT: Set your frontend domain for CORS
$frontend_domain = 'https://cdd-3ae.pages.dev';

header("Access-Control-Allow-Origin: " . $frontend_domain);
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Allow common methods
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); // Allow common headers

// Handle OPTIONS preflight request (sent by browsers before POST/PUT etc. with custom headers)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    // Return an empty response for preflight
    http_response_code(204); // No Content
    exit;
}

// Set content type to JSON for all responses from this script
header('Content-Type: application/json');

// Basic routing based on a query parameter
$action = isset($_GET['action']) ? $_GET['action'] : null;

if ($action === 'hello') {
    $responseData = [
        'message' => 'Hello from PHP Backend on ' . ($_SERVER['HTTP_HOST'] ?? 'wenge.cloudns.ch') . '!',
        'timestamp' => time(),
        'php_version' => phpversion()
    ];
    echo json_encode($responseData);
    exit;
}

// --- Placeholder for Thirteen Water Game API Endpoints ---
// Example: /api/index.php?action=deal
// if ($action === 'deal') {
//     // Your PHP logic to create a deck, shuffle, and deal 13 cards
//     // $deck = create_deck_php();
//     // $hand = deal_cards_php($deck, 13);
//     // echo json_encode(['hand' => $hand]);
//     exit;
// }

// --- Placeholder for user authentication, game state, etc. ---


// Default response if no action matches
http_response_code(404); // Not Found
echo json_encode([
    'error' => 'API endpoint not found.',
    'requested_action' => $action
]);
exit;

?>
