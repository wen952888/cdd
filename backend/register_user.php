<?php
// backend/register_user.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

$authorized_phones_file = __DIR__ . '/authorized_phones.txt';
$users_db_file = __DIR__ . '/users.json';

function loadData($filePath, $assoc = true) {
    if (!file_exists($filePath)) return $assoc ? [] : "";
    return json_decode(file_get_contents($filePath), $assoc) ?: ($assoc ? [] : "");
}

function saveData($filePath, $data) {
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function loadAuthorizedPhones($filePath) {
    if (!file_exists($filePath)) return [];
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    return $lines ? array_unique($lines) : [];
}

$response = ['success' => false, 'message' => '注册失败，发生未知错误。'];
$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['phone']) && isset($input['password'])) {
    $phone = trim($input['phone']);
    $password = $input['password'];

    if (empty($phone) || empty($password)) {
        $response['message'] = '手机号和密码不能为空。';
    } elseif (strlen($password) < 6) {
        $response['message'] = '密码长度至少为6位。';
    } elseif (!preg_match('/^\d{7,15}$/', $phone)) { // Basic phone number format check
        // $response['message'] = '请输入有效的手机号。'; // Allow any string if no validation as per prior request
    }
    if (empty($response['message']) || $response['message'] === '注册失败，发生未知错误。') { // Proceed if no prior validation errors
        $authorized_phones = loadAuthorizedPhones($authorized_phones_file);
        if (!in_array($phone, $authorized_phones)) {
            $response['message'] = '此手机号未被授权注册。请联系管理员通过Telegram Bot授权。';
        } else {
            $users = loadData($users_db_file);
            if (isset($users[$phone])) {
                $response['message'] = '此手机号已被注册。';
            } else {
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                $users[$phone] = ['password' => $hashed_password, 'score' => 0]; // Initialize score
                saveData($users_db_file, $users);

                // Optional: Remove phone from authorized list if one-time
                // $key = array_search($phone, $authorized_phones);
                // if ($key !== false) {
                //     unset($authorized_phones[$key]);
                //     file_put_contents($authorized_phones_file, implode(PHP_EOL, $authorized_phones));
                // }

                $response['success'] = true;
                $response['message'] = '注册成功！您现在可以登录了。';
            }
        }
    }
} else {
    $response['message'] = '无效的输入数据。';
}
echo json_encode($response);
?>
