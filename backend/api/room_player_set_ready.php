<?php
// backend/api/room_player_set_ready.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';
require_once __DIR__ . '/../includes/room_functions.php'; // room_functions.php 里需要实现 setPlayerReadyStatus

handleCors();
$currentUser = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 POST 请求。'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($input['roomId']) || !isset($input['isReady'])) {
    sendJsonResponse(['success' => false, 'message' => '无效的请求数据，需要 roomId 和 isReady。'], 400);
}

$roomId = trim($input['roomId']);
$isReady = boolval($input['isReady']); //确保是布尔值

// --- 在 room_functions.php 中实现 setPlayerReadyStatus 函数 ---
/*
function setPlayerReadyStatus($roomId, $userId, $isReady) {
    try {
        $pdo = getPDO();
        $pdo->beginTransaction();

        // 1. 验证玩家是否在房间内，房间是否是waiting状态
        $playerInRoom = fetchOne("SELECT rp.id, r.status as room_status
                                FROM room_players rp
                                JOIN rooms r ON rp.room_id = r.id
                                WHERE rp.room_id = ? AND rp.user_id = ? FOR UPDATE", [$roomId, $userId]);

        if (!$playerInRoom) {
            $pdo->rollBack();
            return ['success' => false, 'message' => '您不在此房间或房间不存在。'];
        }
        if ($playerInRoom['room_status'] !== 'waiting') {
            $pdo->rollBack();
            return ['success' => false, 'message' => '游戏已开始或结束，无法更改准备状态。'];
        }

        // 2. 更新玩家准备状态
        executeStatement("UPDATE room_players SET is_ready = ? WHERE room_id = ? AND user_id = ?",
                         [$isReady, $roomId, $userId]);

        // 3. 检查是否所有人都已准备好，并且人数达到最小开始要求 (例如2人)
        $readyPlayersCount = fetchOne("SELECT COUNT(*) as count FROM room_players WHERE room_id = ? AND is_ready = TRUE", [$roomId])['count'];
        $totalPlayersCount = fetchOne("SELECT current_players as count FROM rooms WHERE id = ?", [$roomId])['count']; // 使用 rooms 表的 current_players
        $minPlayersToStart = 2; // 或者从 rooms 表读取（如果设计了该字段）

        // 此处暂时不自动开始游戏，只更新准备状态。开始游戏的逻辑将在一个专门的API或由房主触发。
        // 阶段三会完善自动开始逻辑

        $pdo->commit();
        return ['success' => true, 'message' => '准备状态已更新。'];

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Set Player Ready DB Error: " . $e->getMessage());
        return ['success' => false, 'message' => '更新准备状态数据库操作失败。'];
    }
}
*/
// 你需要在 room_functions.php 中添加上面的 setPlayerReadyStatus 函数
$result = setPlayerReadyStatus($roomId, $currentUser['userId'], $isReady); // 假设函数已存在

sendJsonResponse($result);
?>
