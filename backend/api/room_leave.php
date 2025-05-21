<?php
// backend/api/room_leave.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';
require_once __DIR__ . '/../includes/room_functions.php'; // room_functions.php 里需要实现 leaveRoomForUser

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

// --- 在 room_functions.php 中实现 leaveRoomForUser 函数 ---
/*
function leaveRoomForUser($roomId, $userId) {
    try {
        $pdo = getPDO();
        $pdo->beginTransaction();

        // 1. 检查玩家是否在房间
        $player = fetchOne("SELECT id, slot FROM room_players WHERE room_id = ? AND user_id = ?", [$roomId, $userId]);
        if (!$player) {
            // 玩家可能已经离开或房间不存在，也算成功让前端继续
            $pdo->rollBack();
            return ['success' => true, 'message' => '您已不在该房间中。'];
        }

        // 2. 从 room_players 删除玩家
        executeStatement("DELETE FROM room_players WHERE id = ?", [$player['id']]);

        // 3. 更新 rooms 表的 current_players
        // 还需要检查房间是否因此变空，如果变空是否要删除房间 (复杂逻辑，暂时简化)
        $updatedPlayerCount = executeStatement("UPDATE rooms SET current_players = current_players - 1 WHERE id = ? AND current_players > 0", [$roomId]);

        if ($updatedPlayerCount === 0) { // 如果更新后影响行数为0，说明可能 current_players 已经是0了
            $currentRoomState = fetchOne("SELECT current_players, status FROM rooms WHERE id = ?", [$roomId]);
            if ($currentRoomState && $currentRoomState['current_players'] == 0 && $currentRoomState['status'] == 'waiting') {
                 // 如果房间是等待状态且人数为0，可以考虑删除房间
                 // executeStatement("DELETE FROM rooms WHERE id = ?", [$roomId]);
                 // error_log("Room {$roomId} deleted because it became empty.");
            }
        }
        // TODO: 如果游戏正在进行中，玩家离开需要更复杂的处理 (标记断线，判断游戏是否能继续等)
        // 阶段三处理游戏中的离开

        $pdo->commit();
        return ['success' => true, 'message' => '已成功离开房间。'];
    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Leave Room DB Error: " . $e->getMessage());
        return ['success' => false, 'message' => '离开房间数据库操作失败。'];
    }
}
*/
// 你需要在 room_functions.php 中添加上面的 leaveRoomForUser 函数
$result = leaveRoomForUser($roomId, $currentUser['userId']); // 假设函数已存在

sendJsonResponse($result);
?>
