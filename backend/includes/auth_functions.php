<?php
// backend/includes/auth_functions.php
require_once __DIR__ . '/db_helper.php';

function registerUser($username, $password) {
    // 验证输入 (基本)
    if (empty($username) || strlen($username) < 3 || strlen($username) > 50) {
        return ['success' => false, 'message' => '用户名长度必须在 3 到 50 个字符之间。'];
    }
    if (empty($password) || strlen($password) < 6) { // 密码长度要求
        return ['success' => false, 'message' => '密码长度至少为 6 个字符。'];
    }
    // 更多验证：例如用户名是否包含非法字符等

    // 检查用户名是否已存在
    $existingUser = fetchOne("SELECT id FROM users WHERE username = ?", [$username]);
    if ($existingUser) {
        return ['success' => false, 'message' => '用户名已被注册。'];
    }

    // 哈希密码
    $passwordHash = password_hash($password, PASSWORD_HASH_ALGO, PASSWORD_HASH_OPTIONS);
    if ($passwordHash === false) {
        error_log("Password hashing failed for user: " . $username);
        return ['success' => false, 'message' => '注册过程中发生内部错误。'];
    }

    // 插入用户数据
    try {
        $userId = executeStatement("INSERT INTO users (username, password_hash) VALUES (?, ?)", [$username, $passwordHash], true);
        if ($userId) {
            return ['success' => true, 'message' => '注册成功！', 'userId' => $userId];
        } else {
            return ['success' => false, 'message' => '注册失败，请稍后再试。'];
        }
    } catch (PDOException $e) {
        // 如果 db_helper.php 中的 executeStatement 抛出了特定的唯一约束异常
        if (strpos($e->getMessage(), "数据已存在") !== false) {
             return ['success' => false, 'message' => '用户名已被注册 (db error)。'];
        }
        error_log("User registration DB error: " . $e->getMessage());
        return ['success' => false, 'message' => '注册数据库操作失败。'];
    }
}

function loginUser($username, $password) {
    if (empty($username) || empty($password)) {
        return ['success' => false, 'message' => '用户名和密码不能为空。'];
    }

    $user = fetchOne("SELECT id, username, password_hash FROM users WHERE username = ?", [$username]);

    if ($user && password_verify($password, $user['password_hash'])) {
        // 密码匹配，登录成功
        // 重新哈希密码（如果旧的哈希算法需要更新）
        if (password_needs_rehash($user['password_hash'], PASSWORD_HASH_ALGO, PASSWORD_HASH_OPTIONS)) {
            $newHash = password_hash($password, PASSWORD_HASH_ALGO, PASSWORD_HASH_OPTIONS);
            executeStatement("UPDATE users SET password_hash = ? WHERE id = ?", [$newHash, $user['id']]);
        }

        // 设置 session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        // 可选: regenerate session id after login for security
        session_regenerate_id(true);

        return ['success' => true, 'message' => '登录成功！', 'userId' => $user['id'], 'username' => $user['username']];
    } else {
        // 用户名或密码错误
        return ['success' => false, 'message' => '用户名或密码错误。'];
    }
}

function logoutUser() {
    // 清除所有 session 变量
    $_SESSION = array();

    // 如果使用 cookie 来传递 session ID，则删除 session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    return ['success' => true, 'message' => '已成功退出登录。'];
}

function checkUserLoggedIn() {
    if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
        return ['loggedIn' => true, 'userId' => $_SESSION['user_id'], 'username' => $_SESSION['username']];
    }
    return ['loggedIn' => false];
}

// 保护API的辅助函数
function requireLogin() {
    $authStatus = checkUserLoggedIn();
    if (!$authStatus['loggedIn']) {
        sendJsonResponse(['success' => false, 'message' => '需要登录才能执行此操作。', 'action' => 'loginRequired'], 401);
    }
    return $authStatus; // 返回用户信息，方便API使用
}
?>
