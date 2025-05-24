<?php
// backend/login_user.php
require_once __DIR__ . '/db_config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

$response = ['success' => false, 'message' => '登录失败。'];
$input = json_decode(file_get_contents('php://input'), true);
$pdo = getDBConnection();

if (isset($input['username']) && isset($input['password'])) {
    $phone = trim($input['username']); // Frontend sends phone as username
    $password_attempt = $input['password'];

    try {
        $stmt = $pdo->prepare("SELECT password_hash, score, is_registered FROM users WHERE phone = :phone");
        $stmt->bindParam(':phone', $phone);
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user && $user['is_registered'] && $user['password_hash'] !== null && password_verify($password_attempt, $user['password_hash'])) {
            $response['success'] = true;
            $response['message'] = '登录成功！';
            $response['username'] = $phone;
            $response['score'] = (int)$user['score'];
        } else if ($user && !$user['is_registered']) {
            $response['message'] = '账户尚未完成注册（未设置密码或未被授权）。';
        }
         else {
            $response['message'] = '手机号或密码错误。';
        }
    } catch (PDOException $e) {
        error_log("Login User DB Error: " . $e->getMessage());
        $response['message'] = '登录服务暂时遇到问题，请稍后重试。';
    }
} else {
    $response['message'] = '需要手机号和密码。';
}
echo json_encode($response);
?>
