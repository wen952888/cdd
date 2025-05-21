<?php
// backend/api/room_join.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';
require_once __DIR__ . '/../includes/room_functions.php';

handleCors();
$currentUser = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 POST 请求。'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($input['roomId'])) {
    sendJsonResponse(['success' => false, 'message' => '无效的请求数据，需要 roomId。'], 400);
}

$roomId = trim($input['roomId']);
$passwordAttempt = isset($input['password']) ? $input['password'] : null;

$result = joinRoom($roomId, $currentUser['userId'], $currentUser['username'], $passwordAttempt);

sendJsonResponse($result, $result['success'] ? 200 : 400); // 或 403 Forbidden, 404 Not Found
?>
