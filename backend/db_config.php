<?php
// backend/db_config.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'youruser_thirteen_water'); // 您的数据库名
define('DB_USER', 'youruser_gameadmin');    // 您的数据库用户名
define('DB_PASS', 'your_database_password'); // 您的数据库密码

function getDBConnection() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        // Log error instead of echoing in production
        error_log("Database Connection Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => '数据库连接失败，请稍后重试或联系管理员。']);
        exit;
    }
}
?>
