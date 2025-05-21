<?php
// backend/api/room_list.php
require_once __DIR__ . '/../includes/config.php';
// require_once __DIR__ . '/../includes/auth_functions.php'; // 获取房间列表通常不需要登录，但可以按需添加
require_once __DIR__ . '/../includes/room_functions.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 GET 请求。'], 405);
}

$result = getPublicRoomList();

sendJsonResponse($result, $result['success'] ? 200 : 500);
?>
