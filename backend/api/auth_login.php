<?php
// backend/api/auth_login.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 POST 请求。'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($input['username']) || !isset($input['password'])) {
    sendJsonResponse(['success' => false, 'message' => '无效的请求数据，需要 username 和 password。'], 400);
}

$username = trim($input['username']);
$password = $input['password'];

$result = loginUser($username, $password);

sendJsonResponse($result, $result['success'] ? 200 : 401); // 200 OK or 401 Unauthorized
?>
