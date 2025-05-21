<?php
// backend/api/auth_check.php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth_functions.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(['success' => false, 'message' => '仅支持 GET 请求。'], 405);
}

$authStatus = checkUserLoggedIn();
sendJsonResponse(['success' => true, 'data' => $authStatus], 200);
?>
