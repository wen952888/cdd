<?php
// backend/includes/room_functions.php
require_once __DIR__ . '/db_helper.php';

define('MAX_ROOM_PLAYERS', 4); // 房间最大玩家数

function generateRoomId($prefix = 'room_') {
    // 生成一个相对唯一的ID
    return $prefix . substr(md5(uniqid(rand(), true)), 0, 10);
}

function createRoom($roomName, $password, $creatorUserId, $creatorUsername) {
    if (empty($roomName) || strlen($roomName) > 100) {
        return ['success' => false, 'message' => '房间名称无效 (1-100字符)。'];
    }
    // 更多房间名验证...

    $passwordHash = null;
    if (!empty($password)) {
        if (strlen($password) < 4 || strlen($password) > 20) { // 密码长度示例
            return ['success' => false, 'message' => '房间密码长度应为4-20字符。'];
        }
        $passwordHash = password_hash($password, PASSWORD_HASH_ALGO, PASSWORD_HASH_OPTIONS);
    }

    $roomId = generateRoomId();
    // 理论上需要检查roomId是否已存在，但概率极低，为简化暂时忽略
    // 或者可以在executeStatement中捕获主键冲突异常 (如果ID不是自增的)

    try {
        $pdo = getPDO();
        $pdo->beginTransaction();

        // 1. 创建房间
        $sqlRoom = "INSERT INTO rooms (id, name, password_hash, creator_user_id, status, max_players, current_players)
                    VALUES (?, ?, ?, ?, 'waiting', ?, 1)";
        executeStatement($sqlRoom, [$roomId, $roomName, $passwordHash, $creatorUserId, MAX_ROOM_PLAYERS]);

        // 2. 创建者自动加入房间 (分配到0号槽位)
        $sqlPlayer = "INSERT INTO room_players (room_id, user_id, username, slot, is_ready) VALUES (?, ?, ?, 0, FALSE)";
        executeStatement($sqlPlayer, [$roomId, $creatorUserId, $creatorUsername]);

        $pdo->commit();
        return ['success' => true, 'message' => '房间创建成功！', 'roomId' => $roomId];

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Create Room DB Error: " . $e->getMessage());
        // 更具体的错误判断，例如是否是 rooms.id 主键冲突
        if ($e->getCode() == 23000 && strpos($e->getMessage(), "for key 'PRIMARY'") !== false) {
            // 极小概率的房间ID冲突，可以提示用户重试
            return ['success' => false, 'message' => '创建房间时发生唯一ID冲突，请重试。'];
        }
        return ['success' => false, 'message' => '创建房间数据库操作失败。'];
    }
}

function getPublicRoomList() {
    // 只获取等待中的房间，并显示当前玩家数
    // 在真实应用中，这里可能需要分页
    $sql = "SELECT r.id, r.name, r.creator_user_id, u.username as creator_username,
                   r.status, r.max_players, r.current_players, (r.password_hash IS NOT NULL) as has_password
            FROM rooms r
            JOIN users u ON r.creator_user_id = u.id
            WHERE r.status = 'waiting'
            ORDER BY r.created_at DESC LIMIT 50"; // 简单限制返回数量
    try {
        $rooms = fetchAll($sql);
        return ['success' => true, 'rooms' => $rooms];
    } catch (PDOException $e) {
        error_log("Get Room List DB Error: " . $e->getMessage());
        return ['success' => false, 'message' => '获取房间列表失败。', 'rooms' => []];
    }
}

function joinRoom($roomId, $userId, $username, $passwordAttempt = null) {
    try {
        $pdo = getPDO();
        $pdo->beginTransaction();

        // 1. 获取房间信息并加行锁 (SELECT ... FOR UPDATE) 防止并发问题
        $room = fetchOne("SELECT * FROM rooms WHERE id = ? FOR UPDATE", [$roomId]);

        if (!$room) {
            $pdo->rollBack();
            return ['success' => false, 'message' => '房间不存在。'];
        }
        if ($room['status'] !== 'waiting') {
            $pdo->rollBack();
            return ['success' => false, 'message' => '此房间当前不可加入 (可能已开始或结束)。'];
        }
        if ($room['current_players'] >= $room['max_players']) {
            $pdo->rollBack();
            return ['success' => false, 'message' => '房间已满。'];
        }
        if ($room['password_hash'] && !password_verify($passwordAttempt ?? '', $room['password_hash'])) {
            $pdo->rollBack();
            return ['success' => false, 'message' => '房间密码错误。'];
        }

        // 检查用户是否已在该房间
        $existingPlayer = fetchOne("SELECT id FROM room_players WHERE room_id = ? AND user_id = ?", [$roomId, $userId]);
        if ($existingPlayer) {
            $pdo->rollBack(); // 或许应该允许重连，但这里先简单处理为已加入
            return ['success' => true, 'message' => '您已在该房间中。', 'roomId' => $roomId, 'alreadyInRoom' => true];
        }

        // 寻找一个空槽位 (0 到 max_players - 1)
        $playerSlots = fetchAll("SELECT slot FROM room_players WHERE room_id = ?", [$roomId]);
        $usedSlots = array_map(function($ps) { return $ps['slot']; }, $playerSlots);
        $assignedSlot = -1;
        for ($i = 0; $i < $room['max_players']; $i++) {
            if (!in_array($i, $usedSlots)) {
                $assignedSlot = $i;
                break;
            }
        }
        if ($assignedSlot === -1) { // 理论上 current_players < max_players 时总能找到
            $pdo->rollBack();
            error_log("Join Room Error: No available slot found in room {$roomId} despite current_players < max_players.");
            return ['success' => false, 'message' => '无法找到可用位置，请稍后再试。'];
        }

        // 2. 将玩家加入 room_players
        $sqlPlayer = "INSERT INTO room_players (room_id, user_id, username, slot, is_ready) VALUES (?, ?, ?, ?, FALSE)";
        executeStatement($sqlPlayer, [$roomId, $userId, $username, $assignedSlot]);

        // 3. 更新 rooms 表的 current_players
        executeStatement("UPDATE rooms SET current_players = current_players + 1 WHERE id = ?", [$roomId]);

        $pdo->commit();
        return ['success' => true, 'message' => '成功加入房间！', 'roomId' => $roomId, 'slot' => $assignedSlot];

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Join Room DB Error: " . $e->getMessage());
        if ($e->getCode() == 23000 && strpos($e->getMessage(), "uq_room_user") !== false) {
             return ['success' => true, 'message' => '您已在该房间中 (db error)。', 'roomId' => $roomId, 'alreadyInRoom' => true];
        }
        return ['success' => false, 'message' => '加入房间数据库操作失败。'];
    }
}


function getRoomStateForUser($roomId, $userId) {
    // 获取房间基本信息
    $room = fetchOne("SELECT r.*, u.username as creator_username FROM rooms r JOIN users u ON r.creator_user_id = u.id WHERE r.id = ?", [$roomId]);
    if (!$room) {
        return ['success' => false, 'message' => '房间不存在。'];
    }

    // 获取房间内所有玩家的信息
    $players = fetchAll("SELECT rp.user_id as userId, rp.username, rp.slot, rp.is_ready FROM room_players rp WHERE rp.room_id = ? ORDER BY rp.slot ASC", [$roomId]);

    // TODO: 在阶段三，这里还需要合并游戏状态 (手牌等)
    // $gameState = json_decode($room['game_state'], true);
    // $playerHand = [];
    // if ($gameState && isset($gameState['hands'][$userId])) {
    //    $playerHand = $gameState['hands'][$userId];
    // }

    // 整理玩家数据，对于请求者，未来可以包含手牌
    $clientPlayers = [];
    foreach ($players as $player) {
        $clientPlayers[] = [
            'userId' => $player['userId'],
            'username' => $player['username'],
            'slot' => intval($player['slot']),
            'isReady' => boolval($player['is_ready']),
            // 'hand' => ($player['userId'] == $userId) ? $playerHand : null, // 示例：手牌只给本人
            'handCount' => 0 // ($gameState && isset($gameState['hands'][$player['userId']])) ? count($gameState['hands'][$player['userId']]) : 0, // 示例
        ];
    }

    return [
        'success' => true,
        'roomId' => $room['id'],
        'roomName' => $room['name'],
        'creatorUserId' => $room['creator_user_id'],
        'creatorUsername' => $room['creator_username'],
        'status' => $room['status'],
        'maxPlayers' => intval($room['max_players']),
        'players' => $clientPlayers,
        // 'currentTurnUserId' => $gameState['currentTurnUserId'] ?? null, // 示例
        // 'centerPile' => $gameState['centerPile'] ?? [], // 示例
        // 'lastHandInfo' => $gameState['lastHandInfo'] ?? null // 示例
    ];
}

// 更多函数将在后续阶段添加，例如: leaveRoom, playerReady, startGame...
?>
