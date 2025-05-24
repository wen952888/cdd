<?php
// backend/register_user.php
require_once __DIR__ . '/db_config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

$response = ['success' => false, 'message' => '注册失败，发生未知错误。'];
$input = json_decode(file_get_contents('php://input'), true);
$pdo = getDBConnection();

if (isset($input['phone']) && isset($input['password'])) {
    $phone = trim($input['phone']);
    $password = $input['password'];

    if (empty($phone)) { $response['message'] = '手机号不能为空。'; }
    elseif (empty($password)) { $response['message'] = '密码不能为空。'; }
    elseif (strlen($password) < 6) { $response['message'] = '密码长度至少为6位。'; }
    // Basic phone regex, adjust if needed or remove if any string is okay for phone
    // elseif (!preg_match('/^\+?\d{7,15}$/', $phone)) { $response['message'] = '请输入有效的手机号格式。'; }
    else {
        try {
            $stmt = $pdo->prepare("SELECT password_hash, is_telegram_authorized, is_registered FROM users WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            $user = $stmt->fetch();

            if ($user) { // Record for this phone exists
                if ($user['is_registered']) {
                    $response['message'] = '此手机号已被注册。';
                } elseif (!$user['is_telegram_authorized']) {
                    $response['message'] = '此手机号未被管理员授权注册。请联系管理员。';
                } else { // Authorized but not yet registered (password not set)
                    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                    $update_stmt = $pdo->prepare("UPDATE users SET password_hash = :password_hash, is_registered = TRUE, updated_at = NOW() WHERE phone = :phone AND is_telegram_authorized = TRUE AND is_registered = FALSE");
                    $update_stmt->bindParam(':password_hash', $hashed_password);
                    $update_stmt->bindParam(':phone', $phone);
                    $update_stmt->execute();

                    if ($update_stmt->rowCount() > 0) {
                        $response['success'] = true;
                        $response['message'] = '注册成功！您现在可以登录了。';
                    } else {
                        // This case might happen if somehow is_registered became true concurrently, or auth was revoked
                        $response['message'] = '注册失败，请重试或联系管理员。可能授权状态已改变。';
                    }
                }
            } else { // No record for this phone exists at all
                $response['message'] = '此手机号未被管理员授权。请先由管理员通过Telegram Bot授权。';
            }
        } catch (PDOException $e) {
            error_log("Register User DB Error: " . $e->getMessage());
            $response['message'] = '注册服务暂时遇到问题，请稍后重试。';
        }
    }
} else {
    $response['message'] = '无效的输入数据，需要手机号和密码。';
}
echo json_encode($response);
?>
