<?php
// backend/includes/session_manager.php

if (session_status() == PHP_SESSION_NONE) {
    // --- 安全的 Session 配置 ---
    // ini_set('session.cookie_lifetime', 0); // 浏览器关闭时过期
    // ini_set('session.use_only_cookies', 1); // 仅使用 cookie 传递 session ID
    // ini_set('session.cookie_httponly', 1); // JS无法访问 cookie
    // ini_set('session.cookie_secure', isset($_SERVER['HTTPS'])); // 仅在 HTTPS 下传输 cookie
    // ini_set('session.gc_probability', 1);
    // ini_set('session.gc_divisor', 100);
    // ini_set('session.gc_maxlifetime', 1440); // session 过期时间 (秒)

    // 更推荐使用 session_set_cookie_params
    $cookieParams = session_get_cookie_params();
    session_set_cookie_params([
        'lifetime' => $cookieParams['lifetime'], // 或自定义，例如 3600*24 (一天)
        'path' => $cookieParams['path'],         // 通常是 '/'
        'domain' => $cookieParams['domain'],     // '' 表示当前域名
        'secure' => isset($_SERVER['HTTPS']),    // 生产环境应为 true
        'httponly' => true,
        'samesite' => 'Lax'                      // 'Lax' 或 'Strict'
    ]);

    session_start();
}

// 可选：定期重新生成 Session ID 以增加安全性
// if (!isset($_SESSION['session_created_time'])) {
//     $_SESSION['session_created_time'] = time();
// } else if (time() - $_SESSION['session_created_time'] > 1800) { // 每30分钟重新生成一次
//     session_regenerate_id(true);
//     $_SESSION['session_created_time'] = time();
// }
?>
