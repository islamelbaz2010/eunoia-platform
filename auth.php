<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// User credentials
$users = [
    'islam.admin' => [
        'password' => 'EunoiaAdmin2025!',
        'role'     => 'admin',
        'name'     => 'Islam Elbaz'
    ],
    'agency.user' => [
        'password' => 'Agency2025!',
        'role'     => 'agency',
        'name'     => 'Agency User'
    ],
    // Legacy credentials (keep for compatibility)
    'admin' => [
        'password' => 'eunoia2024',
        'role'     => 'admin',
        'name'     => 'Admin'
    ],
];

$action = $_POST['action'] ?? '';

if ($action === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (isset($users[$username]) && $users[$username]['password'] === $password) {
        echo json_encode([
            'success' => true,
            'name'    => $users[$username]['name'],
            'role'    => $users[$username]['role'],
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'كلمة المرور غير صحيحة'
        ]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
