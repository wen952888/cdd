<?php
// backend/api/room_create.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';
require_once __DIR__ . '/../includes/room_functions.php';

handleCors();
$currentUser = requireLogin(); // 确保用户已登录

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 POST 请求。'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($input['roomName'])) {
    sendJsonResponse(['success' => false, 'message' => '无效的请求数据，需要 roomName。'], 400);
}

$roomName = trim($input['roomName']);
$password = isset($input['password']) ? trim($input['password']) : null; // 密码是可选的

$result = createRoom($roomName, $password, $currentUser['userId'], $currentUser['username']);

sendJsonResponse($result, $result['success'] ? 201 : 400); // 201 Created or 400 Bad Request
?>
