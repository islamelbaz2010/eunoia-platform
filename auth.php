<?php
session_start();

// ── PERMISSIONS ───────────────────────────────────────────────────
$PERMISSIONS = [
    'admin'  => ['reports','proposal','pricing','history','admin_panel','web_search','all_report_types'],
    'sales'  => ['reports','proposal','pricing','history','web_search','all_report_types'],
    'viewer' => ['reports','history'],
];

// ── LOAD USERS from JSON ──────────────────────────────────────────
$USERS_FILE = __DIR__ . '/users.json';

function loadUsers() {
    global $USERS_FILE;
    $raw = file_exists($USERS_FILE) ? json_decode(file_get_contents($USERS_FILE), true) : null;

    // First run OR invalid file — create defaults
    if (!$raw || isset($raw['__setup'])) {
        $defaults = [
            'islam.admin' => [
                'password_hash' => password_hash('EunoiaAdmin@2025!', PASSWORD_DEFAULT),
                'name'          => 'Islam Elbaz',
                'role'          => 'admin',
                'active'        => true,
                'created'       => date('Y-m-d'),
            ],
            'eunoia.sales' => [
                'password_hash' => password_hash('Sales@2025!', PASSWORD_DEFAULT),
                'name'          => 'Sales Team',
                'role'          => 'sales',
                'active'        => true,
                'created'       => date('Y-m-d'),
            ],
            'eunoia.viewer' => [
                'password_hash' => password_hash('Viewer@2025!', PASSWORD_DEFAULT),
                'name'          => 'Viewer',
                'role'          => 'viewer',
                'active'        => true,
                'created'       => date('Y-m-d'),
            ],
        ];
        file_put_contents($USERS_FILE, json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return $defaults;
    }
    return $raw ?: [];
}

function saveUsers($users) {
    global $USERS_FILE;
    return file_put_contents($USERS_FILE, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function requireAdmin() {
    if (!isset($_SESSION['ez_role']) || $_SESSION['ez_role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'غير مصرح — Admin فقط']);
        exit;
    }
}

// ── RESPONSE HELPER ───────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// ══════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════
if ($action === 'login') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$username || !$password) {
        echo json_encode(['success' => false, 'error' => 'بيانات ناقصة']);
        exit;
    }

    $users = loadUsers();

    if (!isset($users[$username])) {
        password_verify($password, '$2y$10$fakehashtopreventtiming');
        echo json_encode(['success' => false, 'error' => 'اسم المستخدم أو كلمة المرور غلط']);
        exit;
    }

    $user = $users[$username];

    if (empty($user['active'])) {
        echo json_encode(['success' => false, 'error' => 'الحساب موقوف — تواصل مع الأدمن']);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'error' => 'اسم المستخدم أو كلمة المرور غلط']);
        exit;
    }

    $_SESSION['ez_user']  = $username;
    $_SESSION['ez_name']  = $user['name'];
    $_SESSION['ez_role']  = $user['role'];
    $_SESSION['ez_login'] = time();

    global $PERMISSIONS;
    echo json_encode([
        'success'     => true,
        'name'        => $user['name'],
        'role'        => $user['role'],
        'permissions' => $PERMISSIONS[$user['role']] ?? [],
    ]);
    exit;
}

// ══════════════════════════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════════════════════════
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// ══════════════════════════════════════════════════════════════════
// CHECK SESSION
// ══════════════════════════════════════════════════════════════════
if ($action === 'check') {
    if (isset($_SESSION['ez_user'])) {
        global $PERMISSIONS;
        echo json_encode([
            'logged_in'   => true,
            'name'        => $_SESSION['ez_name'],
            'role'        => $_SESSION['ez_role'],
            'username'    => $_SESSION['ez_user'],
            'permissions' => $PERMISSIONS[$_SESSION['ez_role']] ?? [],
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════════
// ADMIN: GET USERS LIST
// ══════════════════════════════════════════════════════════════════
if ($action === 'admin_users') {
    requireAdmin();
    $users = loadUsers();
    $safe = [];
    foreach ($users as $uname => $data) {
        $safe[] = [
            'username' => $uname,
            'name'     => $data['name'],
            'role'     => $data['role'],
            'active'   => $data['active'] ?? true,
            'created'  => $data['created'] ?? '',
        ];
    }
    echo json_encode(['users' => $safe]);
    exit;
}

// ══════════════════════════════════════════════════════════════════
// ADMIN: ADD USER
// ══════════════════════════════════════════════════════════════════
if ($action === 'add_user') {
    requireAdmin();

    $username = trim($_POST['username'] ?? '');
    $name     = trim($_POST['name'] ?? '');
    $password = $_POST['password'] ?? '';
    $role     = $_POST['role'] ?? 'viewer';

    // Validate
    if (!$username || !$name || !$password) {
        echo json_encode(['success' => false, 'error' => 'جميع الحقول مطلوبة']);
        exit;
    }
    if (!preg_match('/^[a-zA-Z0-9._-]+$/', $username)) {
        echo json_encode(['success' => false, 'error' => 'اسم المستخدم: أحرف إنجليزية وأرقام ونقاط فقط']);
        exit;
    }
    if (strlen($password) < 8) {
        echo json_encode(['success' => false, 'error' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل']);
        exit;
    }
    if (!in_array($role, ['admin', 'sales', 'viewer'])) {
        echo json_encode(['success' => false, 'error' => 'دور غير صالح']);
        exit;
    }

    $users = loadUsers();

    if (isset($users[$username])) {
        echo json_encode(['success' => false, 'error' => 'اسم المستخدم موجود بالفعل']);
        exit;
    }

    $users[$username] = [
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'name'     => $name,
        'role'     => $role,
        'active'   => true,
        'created'  => date('Y-m-d'),
    ];

    if (saveUsers($users)) {
        echo json_encode(['success' => true, 'message' => 'تم إضافة المستخدم ' . $name . ' بنجاح']);
    } else {
        echo json_encode(['success' => false, 'error' => 'خطأ في حفظ البيانات — تحقق من صلاحيات الملف']);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════════
// ADMIN: TOGGLE USER (activate/deactivate)
// ══════════════════════════════════════════════════════════════════
if ($action === 'toggle_user') {
    requireAdmin();

    $username = trim($_POST['username'] ?? '');
    if (!$username) { echo json_encode(['success'=>false,'error'=>'username مطلوب']); exit; }

    // Prevent self-deactivation
    if ($username === $_SESSION['ez_user']) {
        echo json_encode(['success' => false, 'error' => 'لا يمكنك إيقاف حسابك الخاص']);
        exit;
    }

    $users = loadUsers();
    if (!isset($users[$username])) {
        echo json_encode(['success' => false, 'error' => 'المستخدم غير موجود']);
        exit;
    }

    $users[$username]['active'] = !($users[$username]['active'] ?? true);
    $status = $users[$username]['active'] ? 'مفعّل' : 'موقوف';

    if (saveUsers($users)) {
        echo json_encode(['success' => true, 'message' => 'تم تغيير حالة ' . $username . ' إلى: ' . $status, 'active' => $users[$username]['active']]);
    } else {
        echo json_encode(['success' => false, 'error' => 'خطأ في الحفظ']);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════════
// ADMIN: DELETE USER
// ══════════════════════════════════════════════════════════════════
if ($action === 'delete_user') {
    requireAdmin();

    $username = trim($_POST['username'] ?? '');
    if (!$username) { echo json_encode(['success'=>false,'error'=>'username مطلوب']); exit; }

    if ($username === $_SESSION['ez_user']) {
        echo json_encode(['success' => false, 'error' => 'لا يمكنك حذف حسابك الخاص']);
        exit;
    }

    $users = loadUsers();
    if (!isset($users[$username])) {
        echo json_encode(['success' => false, 'error' => 'المستخدم غير موجود']);
        exit;
    }

    unset($users[$username]);

    if (saveUsers($users)) {
        echo json_encode(['success' => true, 'message' => 'تم حذف المستخدم بنجاح']);
    } else {
        echo json_encode(['success' => false, 'error' => 'خطأ في الحفظ']);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════════
// ADMIN: CHANGE PASSWORD
// ══════════════════════════════════════════════════════════════════
if ($action === 'change_password') {
    requireAdmin();

    $username    = trim($_POST['username'] ?? '');
    $new_password = $_POST['new_password'] ?? '';

    if (!$username || !$new_password) {
        echo json_encode(['success' => false, 'error' => 'البيانات ناقصة']);
        exit;
    }
    if (strlen($new_password) < 8) {
        echo json_encode(['success' => false, 'error' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل']);
        exit;
    }

    $users = loadUsers();
    if (!isset($users[$username])) {
        echo json_encode(['success' => false, 'error' => 'المستخدم غير موجود']);
        exit;
    }

    $users[$username]['password_hash'] = password_hash($new_password, PASSWORD_DEFAULT);

    if (saveUsers($users)) {
        echo json_encode(['success' => true, 'message' => 'تم تغيير كلمة المرور بنجاح']);
    } else {
        echo json_encode(['success' => false, 'error' => 'خطأ في الحفظ']);
    }
    exit;
}

// ══════════════════════════════════════════════════════════════════
// ADMIN: CHANGE ROLE
// ══════════════════════════════════════════════════════════════════
if ($action === 'change_role') {
    requireAdmin();

    $username = trim($_POST['username'] ?? '');
    $new_role  = $_POST['new_role'] ?? '';

    if (!$username || !in_array($new_role, ['admin','sales','viewer'])) {
        echo json_encode(['success' => false, 'error' => 'بيانات غير صحيحة']);
        exit;
    }
    if ($username === $_SESSION['ez_user']) {
        echo json_encode(['success' => false, 'error' => 'لا يمكنك تغيير دورك الخاص']);
        exit;
    }

    $users = loadUsers();
    if (!isset($users[$username])) {
        echo json_encode(['success' => false, 'error' => 'المستخدم غير موجود']);
        exit;
    }

    $users[$username]['role'] = $new_role;

    if (saveUsers($users)) {
        echo json_encode(['success' => true, 'message' => 'تم تغيير دور ' . $username . ' إلى ' . $new_role]);
    } else {
        echo json_encode(['success' => false, 'error' => 'خطأ في الحفظ']);
    }
    exit;
}

echo json_encode(['error' => 'action غير معروف: ' . $action]);
