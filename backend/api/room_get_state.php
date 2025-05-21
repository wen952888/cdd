<?php
// backend/api/room_get_state.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';
require_once __DIR__ . '/../includes/room_functions.php';

handleCors();
$currentUser = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 GET 请求。'], 405);
}

if (!isset($_GET['roomId'])) {
    sendJsonResponse(['success' => false, 'message' => '缺少 roomId 参数。'], 400);
}
$roomId = trim($_GET['roomId']);

// 验证用户是否在该房间内 (可选，但推荐)
// $playerInRoom = fetchOne("SELECT id FROM room_players WHERE room_id = ? AND user_id = ?", [$roomId, $currentUser['userId']]);
// if (!$playerInRoom) {
//     sendJsonResponse(['success' => false, 'message' => '您不在此房间中或房间不存在。'], 403);
// }

$result = getRoomStateForUser($roomId, $currentUser['userId']);

sendJsonResponse($result, $result['success'] ? 200 : 404);
?>
