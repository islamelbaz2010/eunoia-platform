<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
session_start();

$usersFile = __DIR__ . '/users.json';
if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Auth system not configured']);
    exit;
}

$users = json_decode(file_get_contents($usersFile), true) ?: [];

$rolePerms = [
    'admin'  => ['all_report_types', 'web_search', 'admin_panel'],
    'agency' => ['all_report_types', 'web_search'],
    'sales'  => ['all_report_types'],
    'client' => [],
    'viewer' => [],
];

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$username || !$password) {
        echo json_encode(['success' => false, 'message' => 'من فضلك أدخل اسم المستخدم وكلمة المرور']);
        exit;
    }

    if (isset($users[$username]) && ($users[$username]['active'] ?? true)) {
        $hash = $users[$username]['password_hash'] ?? '';
        if ($hash && password_verify($password, $hash)) {
            $role = $users[$username]['role'] ?? 'viewer';
            $_SESSION['ez_user'] = $username;
            echo json_encode([
                'success'     => true,
                'name'        => $users[$username]['name'] ?? $username,
                'role'        => $role,
                'permissions' => $rolePerms[$role] ?? [],
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'كلمة المرور غير صحيحة']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'اسم المستخدم غير موجود']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
