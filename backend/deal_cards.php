<?php
// backend/deal_cards.php
header("Access-Control-Allow-Origin: *"); // Adjust for production
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

function createDeck() {
    $suits = ['SPADES', 'HEARTS', 'CLUBS', 'DIAMONDS']; // Match SUITS_DATA keys in game.js
    $ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    $deck = [];
    foreach ($suits as $suitKey) {
        foreach ($ranks as $rank) {
            // Backend only needs to send essential data for card identification
            $deck[] = ['rank' => $rank, 'suitKey' => $suitKey];
        }
    }
    return $deck;
}

$deck = createDeck();
shuffle($deck);
$playerCards = array_slice($deck, 0, 13);

echo json_encode(['cards' => $playerCards]);
exit;
?>
