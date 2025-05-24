<?php
// backend/ai_thirteen_water.php

// --- IMPORTANT: Set your Cloudflare Pages URL for CORS ---
$allowed_origin = "*"; // For development, replace with specific origin in production
// header("Access-Control-Allow-Origin: " . $allowed_origin);
// A more robust way for specific origin:
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // Replace with your actual frontend URL
    $allowed_origins_array = ['https://your-frontend.pages.dev', 'http://localhost:xxxx']; // Add your local dev URL if needed
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins_array)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    } else {
        // Optionally, deny request or do nothing, letting it fail CORS check
    }
} else {
    // Fallback or for direct access testing (not via XHR from browser)
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0); // Handle preflight OPTIONS request
}

$response_data = ['success' => false, 'message' => 'AI request failed.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input_json = file_get_contents('php://input');
    $input_data = json_decode($input_json, true);

    if ($input_data && isset($input_data['hand']) && is_array($input_data['hand']) && count($input_data['hand']) === 13 && isset($input_data['action'])) {
        $player_hand_from_frontend = $input_data['hand']; // Array of {rank: "A", suitKey: "SPADES"}
        $action = $input_data['action']; // 'getReference' or 'getBestMove'

        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // !!! CRITICAL: Implement your Thirteen Water AI Logic Here          !!!
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // This is where the complex part goes. You need an algorithm to:
        // 1. Take the 13 cards ($player_hand_from_frontend).
        // 2. Analyze all possible valid (non-daoshui) three-row combinations.
        // 3. Evaluate the strength of each combination (this requires your PHP hand evaluation logic).
        // 4. Select the "best" or a "good" combination based on some strategy.
        //
        // For a simple placeholder/test, we'll just sort the hand and divide it.
        // This is NOT a good AI, just a way to return structured data.

        // Placeholder: Sort cards (you'll need your getRankValuePHP and suit order logic here)
        // Example of a very naive sorting (Rank only, Ace high)
        $rank_values_php = ["2"=>2, "3"=>3, "4"=>4, "5"=>5, "6"=>6, "7"=>7, "8"=>8, "9"=>9, "10"=>10, "J"=>11, "Q"=>12, "K"=>13, "A"=>14];
        usort($player_hand_from_frontend, function($a, $b) use ($rank_values_php) {
            $valA = $rank_values_php[strtoupper($a['rank'])] ?? 0;
            $valB = $rank_values_php[strtoupper($b['rank'])] ?? 0;
            return $valB - $valA; // Descending rank
        });

        // Placeholder: Naive division into rows (top 3, middle 5, bottom 5)
        $ai_top_row = array_slice($player_hand_from_frontend, 0, 3);
        $ai_middle_row = array_slice($player_hand_from_frontend, 3, 5);
        $ai_bottom_row = array_slice($player_hand_from_frontend, 8, 5);

        // You MUST ensure this naive division doesn't result in daoshui if used directly.
        // A real AI would check for daoshui and try other combinations.

        $response_data['success'] = true;
        $response_data['message'] = 'AI processed hand (placeholder logic).';
        $response_data['organizedHand'] = [
            'top'    => $ai_top_row,
            'middle' => $ai_middle_row,
            'bottom' => $ai_bottom_row
        ];
        // For 'getReference', you might just send this.
        // For 'getBestMove' (AI Autoplay), frontend will use this to arrange cards.

    } else {
        $response_data['message'] = 'Invalid AI request: Missing hand, action, or incorrect hand size.';
    }
} else {
    $response_data['message'] = 'Invalid request method for AI.';
}

echo json_encode($response_data);
exit;
?>
