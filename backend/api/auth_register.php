<?php
// backend/api/auth_register.php
require_once __DIR__ . '/../includes/config.php'; // session_manager 已被 config.php 包含
require_once __DIR__ . '/../includes/auth_functions.php';

handleCors(); // 处理CORS

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 POST 请求。'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($input['username']) || !isset($input['password'])) {
    sendJsonResponse(['success' => false, 'message' => '无效的请求数据，需要 username 和 password。'], 400);
}

$username = trim($input['username']);
$password = $input['password'];

$result = registerUser($username, $password);

if ($result['success']) {
    sendJsonResponse($result, 201); // 201 Created
} else {
    sendJsonResponse($result, 400); // Bad Request or 409 Conflict for existing user
}
?>
