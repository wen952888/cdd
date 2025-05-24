<?php
// backend/submit_hand.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

$users_db_file = __DIR__ . '/users.json';

function loadData($filePath, $assoc = true) { /* ... */ }
function saveData($filePath, $data) { /* ... */ }
// Copy loadData and saveData from register_user.php
function loadData($filePath, $assoc = true) { if (!file_exists($filePath)) return $assoc ? [] : ""; return json_decode(file_get_contents($filePath), $assoc) ?: ($assoc ? [] : ""); }
function saveData($filePath, $data) { file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); }


// Placeholder for your actual game logic functions (evaluateHand, compareHandInfos, checkDaoshui)
// These would be much more complex in a real game.
// For now, this script will just simulate a score change.
define('HAND_TYPES_HIGH_CARD', 0); // Example
function evaluateHandPHP($cards_array) { return ['type' => HAND_TYPES_HIGH_CARD, 'message' => '乌龙 (后端占位)', 'isSpecial' => false]; }
function compareHandInfosPHP($h1, $h2) { return 0; } // 0 for tie, 1 if h1 wins, -1 if h2 wins
function checkDaoshuiPHP($top, $middle, $bottom) { return false; } // Assume not daoshui for simplicity

$response = ['success' => false, 'message' => '比牌处理失败。', 'score_change' => 0, 'new_total_score' => 0, 'daoshui' => false];
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['currentUserPhone'], $input['top'], $input['middle'], $input['bottom'])) {
    $currentUserPhone = trim($input['currentUserPhone']);
    $topCards = $input['top'];
    $middleCards = $input['middle'];
    $bottomCards = $input['bottom'];

    // --- Basic Validation (should be more thorough) ---
    if (count($topCards) !== 3 || count($middleCards) !== 5 || count($bottomCards) !== 5) {
        $response['message'] = '提交的牌墩数量不正确。';
        echo json_encode($response);
        exit;
    }

    // --- Simulate Game Logic ---
    // In a real game, you'd evaluate each hand, compare, check daoshui, calculate score.
    $topInfo = evaluateHandPHP($topCards);
    $middleInfo = evaluateHandPHP($middleCards);
    $bottomInfo = evaluateHandPHP($bottomCards);
    $isDaoshui = checkDaoshuiPHP($topInfo, $middleInfo, $bottomInfo);

    $game_score_change = 0; // Points won or lost in this round

    if ($isDaoshui) {
        $response['message'] = '倒水！本局判负。';
        $response['daoshui'] = true;
        $game_score_change = -10; // Example penalty for daoshui
    } else {
        // SIMPLIFIED: Assume player always wins a random amount or ties for this example
        // In a real game, you'd compare player's hand segments against an opponent or rules.
        $rand_outcome = rand(0, 2); // 0: lose, 1: tie, 2: win
        if ($rand_outcome === 2) {
            $game_score_change = rand(1, 5); // Win 1 to 5 points
            $response['message'] = '恭喜，您赢了！';
        } elseif ($rand_outcome === 0) {
            $game_score_change = -rand(1, 3); // Lose 1 to 3 points
            $response['message'] = '很遗憾，您输了。';
        } else {
            $game_score_change = 0; // Tie
            $response['message'] = '本局平手。';
        }
    }

    // --- Update User Score ---
    $users = loadData($users_db_file);
    if (isset($users[$currentUserPhone])) {
        $current_score = isset($users[$currentUserPhone]['score']) ? $users[$currentUserPhone]['score'] : 0;
        $users[$currentUserPhone]['score'] = $current_score + $game_score_change;
        saveData($users_db_file, $users);

        $response['success'] = true;
        $response['score_change'] = $game_score_change;
        $response['new_total_score'] = $users[$currentUserPhone]['score'];
    } else {
        $response['message'] = '错误：未找到用户信息以更新积分。';
        $response['success'] = false; // Ensure success is false if user not found
    }

} else {
    $response['message'] = '无效的请求数据。';
}
echo json_encode($response);
?>
