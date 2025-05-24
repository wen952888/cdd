<?php
// backend/submit_hand.php

// --- IMPORTANT: Set your Cloudflare Pages URL for CORS ---
$allowed_origin = "*"; // For development, replace with specific origin in production

header("Access-Control-Allow-Origin: " . $allowed_origin);
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Allow POST
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$response_data = ['success' => false, 'message' => 'An unknown error occurred.', 'score' => 0];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input_json = file_get_contents('php://input');
    $input_data = json_decode($input_json, true); // true for associative array

    if ($input_data && isset($input_data['top']) && isset($input_data['middle']) && isset($input_data['bottom'])) {
        $player_top = $input_data['top'];
        $player_middle = $input_data['middle'];
        $player_bottom = $input_data['bottom'];

        // 1. Validate card counts
        if (count($player_top) !== 3 || count($player_middle) !== 5 || count($player_bottom) !== 5) {
            $response_data['message'] = '服务器错误: 牌墩数量不正确 (头3, 中5, 尾5).';
            echo json_encode($response_data);
            exit;
        }

        // --- TODO: Implement PHP version of hand evaluation and comparison ---
        // You need to translate game.js's evaluateHand, compareHandInfos, checkDaoshui to PHP.
        // This is the most complex part of the backend.

        // Placeholder logic:
        $php_top_eval = evaluateHandPHP($player_top);     // You need to write evaluateHandPHP
        $php_middle_eval = evaluateHandPHP($player_middle);
        $php_bottom_eval = evaluateHandPHP($player_bottom);

        $is_daoshui = checkDaoshuiPHP($php_top_eval, $php_middle_eval, $php_bottom_eval); // You need to write checkDaoshuiPHP

        if ($is_daoshui) {
            $response_data['success'] = true; // Or false, depending on how you want to handle daoshui score
            $response_data['message'] = '服务器判定: 倒水!';
            $response_data['daoshui'] = true;
            $response_data['score'] = -10; // Example penalty for daoshui
        } else {
            // TODO: Compare with opponent (if any) and calculate score
            $calculated_score = 5; // Placeholder score

            $response_data['success'] = true;
            $response_data['message'] = '牌型已成功提交并处理!';
            $response_data['daoshui'] = false;
            $response_data['score'] = $calculated_score;
            // You might want to send back evaluated hand types too
            // $response_data['evaluations'] = [
            //    'top' => $php_top_eval['message'],
            //    'middle' => $php_middle_eval['message'],
            //    'bottom' => $php_bottom_eval['message'],
            // ];
        }

    } else {
        $response_data['message'] = '服务器错误: 无效的输入数据.';
    }
} else {
    $response_data['message'] = '服务器错误: 仅支持 POST 请求.';
}

echo json_encode($response_data);
exit;

// --- PHP Helper functions (YOU NEED TO IMPLEMENT THESE BASED ON game.js) ---
function getRankValuePHP($card, $aceAsOne = false) { /* ... translate from JS ... */ return 0; }
function sortCardsPHP($cards, $aceAsOneContext = false, $ascending = false) { /* ... translate from JS ... */ return []; }
function evaluateHandPHP($cards) {
    // Complex logic to be translated from game.js's evaluateHand
    // This is a major task.
    // For now, a very basic placeholder:
    if (empty($cards)) return ['type' => 0, 'message' => '空牌', 'ranks'=>[]];
    return ['type' => 0, 'message' => '乌龙 (PHP评价)', 'ranks' => array_map(function($c){ return getRankValuePHP($c);}, $cards)];
}
function compareHandInfosPHP($info1, $info2) { /* ... translate from JS ... */ return 0; }
function checkDaoshuiPHP($top, $middle, $bottom) {
    // Translate from game.js's checkDaoshui
    if (compareHandInfosPHP($top, $middle) > 0) return true;
    if (compareHandInfosPHP($middle, $bottom) > 0) return true;
    return false;
}
?>
