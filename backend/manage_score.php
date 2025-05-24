<?php
// backend/manage_score.php
header("Access-Control-Allow-Origin: *"); header("Access-Control-Allow-Methods: POST, OPTIONS"); header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Secret"); header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }
$users_db_file = __DIR__ . '/users.json';
$ADMIN_SECRET_KEY = 'YOUR_VERY_VERY_SECRET_KEY_HERE_CHANGE_ME'; // !!! CHANGE THIS !!!
function loadData($filePath, $assoc = true) { if (!file_exists($filePath)) return $assoc ? [] : ""; return json_decode(file_get_contents($filePath), $assoc) ?: ($assoc ? [] : ""); }
function saveData($filePath, $data) { file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); }
$provided_secret = isset($_SERVER['HTTP_X_ADMIN_SECRET']) ? $_SERVER['HTTP_X_ADMIN_SECRET'] : (isset($_GET['secret']) ? $_GET['secret'] : ''); // Allow secret via GET for easier TG bot testing initially
if ($provided_secret !== $ADMIN_SECRET_KEY) { http_response_code(403); echo json_encode(['success' => false, 'message' => '认证失败 (Admin Secret Invalid).']); exit; }
$response = ['success' => false, 'message' => '未知错误。'];
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['action'], $input['phone'], $input['score_change'])) {
        $action = strtolower($input['action']); $phone = trim($input['phone']);
        $score_val = $input['score_change']; // Keep as string for filter_var
        $score_change = filter_var($score_val, FILTER_VALIDATE_INT, ['options' => ['min_range' => -999999, 'max_range' => 999999]]);

        if ($score_change === false && !($action === 'set' && $score_val === '0')) { // Allow setting score to 0
            $response['message'] = '无效的积分数值: ' . htmlspecialchars($score_val);
        } else {
            $users = loadData($users_db_file);
            if (!isset($users[$phone])) { $response['message'] = "用户 {$phone} 未找到。"; }
            else {
                $current_score = isset($users[$phone]['score']) ? (int)$users[$phone]['score'] : 0;
                if ($action === 'add') {
                    $users[$phone]['score'] = $current_score + $score_change;
                    $response['message'] = "成功为 {$phone} 增加 {$score_change} 积分. 新积分: " . $users[$phone]['score'];
                } elseif ($action === 'set') {
                    $users[$phone]['score'] = $score_change;
                    $response['message'] = "成功将 {$phone} 的积分设置为 {$score_change}.";
                } else { $response['message'] = "无效操作: {$action}. 使用 'add' 或 'set'."; }
                if ($response['message'] !== "无效操作: {$action}. 使用 'add' 或 'set'.") {
                    saveData($users_db_file, $users); $response['success'] = true; $response['new_score'] = $users[$phone]['score'];
                }
            }
        }
    } else { $response['message'] = '无效输入. 需要: action, phone, score_change.'; }
} else { $response['message'] = '仅支持POST请求.'; }
echo json_encode($response);
?>
