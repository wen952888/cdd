<?php
// backend/telegram_poller.php
// This script is intended to be run by a cron job.

require_once __DIR__ . '/db_config.php'; // Database configuration

// --- Configuration ---
$BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';       // Replace with your Bot Token
$ADMIN_TELEGRAM_USER_ID = 123456789;        // Replace with your Telegram User ID
$offset_file = __DIR__ . '/telegram_offset.txt'; // Stores the last processed update_id

// --- Helper Function: Send Message to Telegram ---
function sendMessage($bot_token, $chat_id, $text) {
    $url = "https://api.telegram.org/bot{$bot_token}/sendMessage";
    $data = ['chat_id' => $chat_id, 'text' => $text, 'parse_mode' => 'Markdown'];
    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
            'timeout' => 10 // 10 second timeout for the request
        ]
    ];
    $context  = stream_context_create($options);
    $result = @file_get_contents($url, false, $context); // Use @ to suppress warnings if timeout
    if ($result === FALSE) {
        error_log("Telegram API sendMessage failed for chat_id {$chat_id}. Error: " . print_r(error_get_last(), true));
    }
    return $result;
}

// --- Main Polling Logic ---
$pdo = getDBConnection(); // Establish database connection

$offset = 0;
if (file_exists($offset_file)) {
    $offset = (int)file_get_contents($offset_file);
}

$get_updates_url = "https://api.telegram.org/bot{$BOT_TOKEN}/getUpdates?offset=" . ($offset + 1) . "&timeout=20"; // 20-second long poll

$updates_json = @file_get_contents($get_updates_url);

if ($updates_json === FALSE) {
    // Log error, but don't necessarily stop the script if it's a timeout, cron will run again.
    // error_log("Failed to get updates from Telegram API. Error: " . print_r(error_get_last(), true));
    // echo "Failed to get updates from Telegram.\n"; // For cron log
    exit;
}

$updates = json_decode($updates_json, true);

if (!$updates || !isset($updates['ok']) || $updates['ok'] == false || !isset($updates['result'])) {
    // error_log("Invalid or empty response from Telegram API: " . $updates_json);
    // echo "No new updates or invalid response.\n"; // For cron log
    exit;
}

if (empty($updates['result'])) {
    // echo "No new messages.\n"; // For cron log
    exit;
}

$last_processed_update_id = $offset;

foreach ($updates['result'] as $update) {
    $last_processed_update_id = $update['update_id']; // Always update to the latest received update_id

    if (!isset($update['message']) || !isset($update['message']['from']['id']) || !isset($update['message']['chat']['id'])) {
        continue; // Skip non-message updates or messages without necessary info
    }

    $message = $update['message'];
    $user_id = $message['from']['id'];
    $chat_id = $message['chat']['id'];
    $text = isset($message['text']) ? trim($message['text']) : '';

    // Admin Authentication
    if ($user_id != $ADMIN_TELEGRAM_USER_ID) {
        sendMessage($BOT_TOKEN, $chat_id, "抱歉，您没有权限执行此操作。");
        continue;
    }

    $reply_message = "无法识别的命令。发送 /help 获取帮助。";

    try {
        if (strpos($text, '/start') === 0 || strpos($text, '/help') === 0) {
            $reply_message = "管理命令:\n`/authorize <手机号>` - 授权手机号\n`/unauthorize <手机号>` - 取消授权\n`/addscore <手机号> <积分数>` - 增加积分\n`/setscore <手机号> <总积分>` - 设置总积分\n`/getscore <手机号>` - 查询积分\n`/checkauth <手机号>` - 检查授权状态";
        }
        // --- /authorize <手机号> ---
        elseif (preg_match('/^\/authorize\s+(\d{7,15})$/', $text, $matches)) {
            $phone = $matches[1];
            $stmt = $pdo->prepare("SELECT is_telegram_authorized, is_registered FROM users WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            $user = $stmt->fetch();

            if ($user) {
                if ($user['is_telegram_authorized']) {
                    $reply_message = "手机号 {$phone} 已被授权。";
                } else {
                    $stmt_update = $pdo->prepare("UPDATE users SET is_telegram_authorized = TRUE, updated_at = NOW() WHERE phone = :phone");
                    $stmt_update->execute([':phone' => $phone]);
                    $reply_message = "手机号 {$phone} 已成功更新授权状态！";
                }
            } else {
                $stmt_insert = $pdo->prepare("INSERT INTO users (phone, is_telegram_authorized, score, is_registered) VALUES (:phone, TRUE, 0, FALSE)");
                $stmt_insert->execute([':phone' => $phone]);
                $reply_message = "手机号 {$phone} 已成功授权并创建记录！用户现在可以去前端注册设置密码。";
            }
        }
        // --- /unauthorize <手机号> ---
        elseif (preg_match('/^\/unauthorize\s+(\d{7,15})$/', $text, $matches)) {
            $phone = $matches[1];
            $stmt = $pdo->prepare("UPDATE users SET is_telegram_authorized = FALSE, updated_at = NOW() WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            if ($stmt->rowCount() > 0) {
                $reply_message = "手机号 {$phone} 的注册授权已取消。";
            } else {
                $reply_message = "手机号 {$phone} 未找到或无需取消授权。";
            }
        }
        // --- /checkauth <手机号> ---
        elseif (preg_match('/^\/checkauth\s+(\d{7,15})$/', $text, $matches)) {
            $phone = $matches[1];
            $stmt = $pdo->prepare("SELECT is_telegram_authorized, is_registered FROM users WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            $user = $stmt->fetch();
            if ($user) {
                $auth_status = $user['is_telegram_authorized'] ? "已授权" : "未授权";
                $reg_status = $user['is_registered'] ? "已注册" : "未注册";
                $reply_message = "手机号 {$phone}: 授权状态 - {$auth_status}, 注册状态 - {$reg_status}.";
            } else {
                $reply_message = "未找到手机号 {$phone} 的记录。";
            }
        }
        // --- /addscore <手机号> <积分> ---
        elseif (preg_match('/^\/addscore\s+(\d{7,15})\s+(-?\d+)$/', $text, $matches)) {
            $phone = $matches[1];
            $score_to_add = (int)$matches[2];
            $stmt = $pdo->prepare("UPDATE users SET score = score + :score_add, updated_at = NOW() WHERE phone = :phone AND is_registered = TRUE");
            $stmt->bindParam(':score_add', $score_to_add, PDO::PARAM_INT);
            $stmt->bindParam(':phone', $phone);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $stmt_get = $pdo->prepare("SELECT score FROM users WHERE phone = :phone");
                $stmt_get->execute([':phone' => $phone]);
                $updated_user = $stmt_get->fetch();
                $reply_message = "成功为注册用户 {$phone} 增加 {$score_to_add} 积分. 新总积分: " . $updated_user['score'];
            } else {
                $reply_message = "用户 {$phone} 未找到或尚未注册，无法添加积分。";
            }
        }
        // --- /setscore <手机号> <总积分> ---
        elseif (preg_match('/^\/setscore\s+(\d{7,15})\s+(-?\d+)$/', $text, $matches)) {
            $phone = $matches[1];
            $new_total_score = (int)$matches[2];
            $stmt = $pdo->prepare("UPDATE users SET score = :score, updated_at = NOW() WHERE phone = :phone AND is_registered = TRUE");
            $stmt->bindParam(':score', $new_total_score, PDO::PARAM_INT);
            $stmt->bindParam(':phone', $phone);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $reply_message = "成功将注册用户 {$phone} 的积分设置为 {$new_total_score}.";
            } else {
                $reply_message = "用户 {$phone} 未找到或尚未注册，无法设置积分。";
            }
        }
        // --- /getscore <手机号> ---
        elseif (preg_match('/^\/getscore\s+(\d{7,15})$/', $text, $matches)) {
            $phone = $matches[1];
            $stmt = $pdo->prepare("SELECT score FROM users WHERE phone = :phone AND is_registered = TRUE");
            $stmt->execute([':phone' => $phone]);
            $user = $stmt->fetch();
            if ($user) {
                $reply_message = "注册用户 {$phone} 当前积分为: " . $user['score'];
            } else {
                $reply_message = "未找到注册用户 {$phone} 或其积分信息。";
            }
        }
    } catch (PDOException $e) {
        $reply_message = "数据库操作时发生错误。请检查日志。";
        error_log("Telegram Poller DB Error: " . $e->getMessage() . " for command: " . $text);
    }

    sendMessage($BOT_TOKEN, $chat_id, $reply_message);
}

// Save the last processed update_id to the offset file
if ($last_processed_update_id > $offset) {
    file_put_contents($offset_file, $last_processed_update_id);
    // echo "Processed updates up to ID: " . $last_processed_update_id . "\n"; // For cron log
} else {
    // echo "No new updates to process beyond offset: " . $offset . "\n"; // For cron log
}
?>
