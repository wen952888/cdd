<?php
// backend/api/auth_logout.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';

handleCors();

// Logout 通常可以是 POST 或 GET (如果只是清除session)
// 为简单起见，这里允许 POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
     // 如果允许 GET，则不需要此检查或添加 'GET'
    // sendJsonResponse(['success' => false, 'message' => '仅支持 POST 请求。'], 405);
}

$result = logoutUser();
sendJsonResponse($result, 200);
?>
