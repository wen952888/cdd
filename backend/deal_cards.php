<?php
// backend/deal_cards.php

// --- IMPORTANT: Set your Cloudflare Pages URL for CORS ---
// Example: $allowed_origin = "https://your-project-name.pages.dev";
$allowed_origin = "*"; // For development, replace with specific origin in production

header("Access-Control-Allow-Origin: " . $allowed_origin);
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0); // Handle preflight OPTIONS request
}

// Card data structures (align with frontend's SUITS_DATA)
$suit_details_php = [
    "SPADES"   => ["displayChar" => "♠", "cssClass" => "spades"],
    "HEARTS"   => ["displayChar" => "♥", "cssClass" => "hearts"],
    "DIAMONDS" => ["displayChar" => "♦", "cssClass" => "diamonds"],
    "CLUBS"    => ["displayChar" => "♣", "cssClass" => "clubs"]
];
$ranks_php = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeckPHP() {
    global $suit_details_php, $ranks_php;
    $deck = [];
    foreach (array_keys($suit_details_php) as $suitKey) {
        foreach ($ranks_php as $rank) {
            $deck[] = [
                'suitKey' => $suitKey, // e.g., "SPADES"
                'rank' => $rank,       // e.g., "A"
                // Frontend also uses displaySuitChar and suitCssClass, send them directly
                'displaySuitChar' => $suit_details_php[$suitKey]['displayChar'],
                'suitCssClass' => $suit_details_php[$suitKey]['cssClass']
                // 'id' => $rank . $suitKey // Optional: frontend main.js can construct this if needed
            ];
        }
    }
    return $deck;
}

$deck = createDeckPHP();
shuffle($deck); // PHP's built-in shuffle

$player_cards = array_slice($deck, 0, 13);

echo json_encode(['cards' => $player_cards]);
exit;
?>
