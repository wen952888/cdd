<?php
// backend/includes/db_helper.php

// --- 数据库连接 (PDO) ---
function getPDO() {
    static $pdo = null; // 静态变量，保持连接在单次请求中复用
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // 抛出异常而不是警告
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // 默认关联数组
            PDO::ATTR_EMULATE_PREPARES   => false,                  // 使用真正的预处理语句
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // 在生产环境中，这里应该记录错误日志，而不是直接输出错误信息
            error_log("Database Connection Error: " . $e->getMessage());
            // sendJsonResponse(['success' => false, 'message' => '数据库连接失败。'], 500); // 可以考虑直接结束并返回错误
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }
    }
    return $pdo;
}

// 示例：执行查询并获取单行 (通常用于SELECT)
function fetchOne($sql, $params = []) {
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("DB FetchOne Error: " . $e->getMessage() . " SQL: " . $sql);
        return false; // 或抛出异常
    }
}

// 示例：执行查询并获取所有行 (通常用于SELECT)
function fetchAll($sql, $params = []) {
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("DB FetchAll Error: " . $e->getMessage() . " SQL: " . $sql);
        return []; // 或抛出异常
    }
}

// 示例：执行非查询语句 (INSERT, UPDATE, DELETE)
// 返回受影响的行数或最后插入的ID (根据$returnLastInsertId)
function executeStatement($sql, $params = [], $returnLastInsertId = false) {
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ($returnLastInsertId) {
            return $pdo->lastInsertId();
        }
        return $stmt->rowCount();
    } catch (PDOException $e) {
        error_log("DB Execute Error: " . $e->getMessage() . " SQL: " . $sql);
        // 检查是否是唯一约束冲突 (错误码 23000, MySQL的1062)
        if ($e->getCode() == 23000) {
            // 可以根据 $e->errorInfo[1] 来判断具体的MySQL错误码
            if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1062) {
                 throw new PDOException("数据已存在 (唯一约束冲突)。", (int)$e->getCode(), $e);
            }
        }
        throw $e; // 重新抛出，让调用者处理
    }
}
?>
