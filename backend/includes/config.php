<?php
// backend/includes/config.php
require_once __DIR__ . '/session_manager.php'; // 确保 session 总是先启动

// --- 数据库连接信息 (请替换成你Serv00的实际信息) ---
define('DB_HOST', 'localhost'); // 通常是 localhost
define('DB_USER', 'your_serv00_db_username');
define('DB_PASS', 'your_serv00_db_password');
define('DB_NAME', 'your_serv00_db_name');

// --- CORS 设置 ---
// 在API文件中具体处理，这里只是一个参考，因为不同API可能需要不同设置
// const ALLOWED_ORIGIN_FRONTEND = 'https://cdd-3ae.pages.dev'; // 你的前端域名

// --- 错误报告 (开发时开启，生产时关闭或记录到文件) ---
error_reporting(E_ALL);
ini_set('display_errors', 1); // 开发时设为1，生产时设为0

// --- 全局 JSON 响应头 (如果所有API都返回JSON) ---
// header('Content-Type: application/json'); // 最好在每个API文件里根据需要设置

// --- API 基础 URL (前端会用到，后端本身不需要) ---
// define('API_BASE_URL_BACKEND', 'https://wenge.cloudns.ch/backend/api/');

// --- 密码哈希算法 ---
define('PASSWORD_HASH_ALGO', PASSWORD_ARGON2ID); // PHP 7.3+ 推荐 Argon2id
// 如果你的 PHP 版本较低，可以使用 PASSWORD_BCRYPT
// define('PASSWORD_HASH_ALGO', PASSWORD_BCRYPT);
define('PASSWORD_HASH_OPTIONS', [
    'memory_cost' => PASSWORD_ARGON2_DEFAULT_MEMORY_COST, // Argon2
    'time_cost'   => PASSWORD_ARGON2_DEFAULT_TIME_COST,   // Argon2
    'threads'     => PASSWORD_ARGON2_DEFAULT_THREADS,     // Argon2
    // 'cost' => 12 // BCRYPT cost factor
]);

// --- 辅助函数：发送 JSON 响应 ---
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8'); // 确保UTF-8
    echo json_encode($data);
    exit; // 发送响应后立即退出脚本
}

// --- 辅助函数：处理CORS预检和实际请求头部 ---
function handleCors($allowedOrigin = 'https://cdd-3ae.pages.dev') { // 默认你的前端域名
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // 严格匹配或允许通配符 (通配符不推荐用于生产的实际请求，除非是公共API)
        if ($_SERVER['HTTP_ORIGIN'] == $allowedOrigin || $allowedOrigin == '*') {
            header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
            header('Access-Control-Allow-Credentials: true'); // 如果使用session/cookie
        } else {
            // 如果来源不匹配，可以选择不发送CORS头，浏览器会阻止请求
            // 或者发送一个特定的错误，但这通常由浏览器的同源策略处理
        }
    } else {
        // 如果没有 Origin 头 (例如直接在浏览器访问API，或服务器间请求)，允许 '*'
        if ($allowedOrigin == '*') {
            header("Access-Control-Allow-Origin: *");
        }
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With'); // 根据需要添加更多头部

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        // 浏览器预检请求 (preflight request)
        http_response_code(204); // No Content
        exit;
    }
}
?>
