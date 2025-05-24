<?php
// backend/submit_hand.php
require_once __DIR__ . '/db_config.php';

header("Access-Control-Allow-Origin: *"); /* ... (CORS) ... */
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

// --- Placeholder Game Logic Functions (YOU NEED YOUR REAL IMPLEMENTATIONS) ---
define('HAND_TYPES_HIGH_CARD', 0); function evaluateHandPHP($c){return ['type'=>HAND_TYPES_HIGH_CARD,'message'=>'乌龙(PHP)','isSpecial'=>false,'ranks'=>[]];} function compareHandInfosPHP($h1,$h2){return 0;} function checkDaoshuiPHP($t,$m,$b){return false;}
// --- End Placeholder ---

$response = ['success' => false, 'message' => '比牌处理失败。', 'score_change' => 0, 'new_total_score' => 0, 'daoshui' => false];
$input = json_decode(file_get_contents('php://input'), true);
$pdo = getDBConnection();

if (isset($input['currentUserPhone'], $input['top'], $input['middle'], $input['bottom'])) {
    $currentUserPhone = trim($input['currentUserPhone']);
    $topCards = $input['top']; $middleCards = $input['middle']; $bottomCards = $input['bottom'];

    if (count($topCards)!==3||count($middleCards)!==5||count($bottomCards)!==5) { $response['message'] = '牌墩数量不正确。'; }
    else {
        $topInfo = evaluateHandPHP($topCards); $middleInfo = evaluateHandPHP($middleCards); $bottomInfo = evaluateHandPHP($bottomCards);
        $isDaoshui = checkDaoshuiPHP($topInfo, $middleInfo, $bottomInfo);
        $game_score_change = 0;

        if ($isDaoshui) {
            $response['message'] = '倒水！本局判负。'; $response['daoshui'] = true; $game_score_change = -10; // Example penalty
        } else {
            // !!! REPLACE WITH YOUR ACTUAL SCORE CALCULATION LOGIC !!!
            // This involves comparing player's hands possibly with an AI or fixed rules.
            $rand_outcome = rand(0,1); // 0: lose some, 1: win some (Simplified)
            if ($rand_outcome === 1) { $game_score_change = rand(1, 5); $response['message'] = '恭喜，您赢了！ (模拟)'; }
            else { $game_score_change = -rand(1, 3); $response['message'] = '有点遗憾，您输了。(模拟)'; }
        }

        try {
            $stmt_check_user = $pdo->prepare("SELECT score FROM users WHERE phone = :phone AND is_registered = TRUE");
            $stmt_check_user->execute([':phone' => $currentUserPhone]);
            $user = $stmt_check_user->fetch();

            if ($user) {
                $new_score = (int)$user['score'] + $game_score_change;
                $stmt = $pdo->prepare("UPDATE users SET score = :new_score, updated_at = NOW() WHERE phone = :phone");
                $stmt->bindParam(':new_score', $new_score, PDO::PARAM_INT);
                $stmt->bindParam(':phone', $currentUserPhone);
                $stmt->execute();

                if ($stmt->rowCount() > 0) {
                    $response['success'] = true;
                    $response['score_change'] = $game_score_change;
                    $response['new_total_score'] = $new_score;
                } else { $response['message'] = '积分更新失败或用户未找到。'; $response['success'] = false; }
            } else {
                $response['message'] = '错误：未找到已注册的用户信息。'; $response['success'] = false;
            }
        } catch (PDOException $e) {
            error_log("Submit Hand DB Error: " . $e->getMessage());
            $response['message'] = '处理比牌时数据库出错。'; $response['success'] = false;
        }
    }
} else { $response['message'] = '无效的请求数据。'; }
echo json_encode($response);
?>
