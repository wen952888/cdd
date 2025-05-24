<?php
// backend/login_user.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

$users_db_file = __DIR__ . '/users.json';

function loadData($filePath, $assoc = true) { /* ... (same as in register_user.php) ... */ }
// Copy loadData from register_user.php
function loadData($filePath, $assoc = true) { if (!file_exists($filePath)) return $assoc ? [] : ""; return json_decode(file_get_contents($filePath), $assoc) ?: ($assoc ? [] : ""); }


$response = ['success' => false, 'message' => '登录失败。'];
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['username']) && isset($input['password'])) { // 'username' is the phone number
    $phone = trim($input['username']);
    $password_attempt = $input['password'];
    $users = loadData($users_db_file);

    if (isset($users[$phone]) && isset($users[$phone]['password']) && password_verify($password_attempt, $users[$phone]['password'])) {
        $response['success'] = true;
        $response['message'] = '登录成功！';
        $response['username'] = $phone; // For frontend to store/use
        $response['score'] = isset($users[$phone]['score']) ? $users[$phone]['score'] : 0;
        // In a real app, generate and return a session token or JWT
    } else {
        $response['message'] = '手机号或密码错误。';
    }
} else {
    $response['message'] = '需要手机号和密码。';
}
echo json_encode($response);
?>
