<?php
// VERSION: 2026-04-12-v5-proxy
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['ez_user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'غير مسجل دخول']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Keep connection alive
set_time_limit(0);
ignore_user_abort(false);

$API_KEY = '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';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || !isset($input['prompt'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing prompt']);
    exit;
}

$payload = [
    'model'      => 'claude-sonnet-4-5',
    'max_tokens' => 8000,
    'system'     => 'You are an expert marketing strategist at Eunoia Zones Agency, Egypt. Always respond with ONLY valid JSON. Never use markdown code blocks. Never add any text before { or after }. Start directly with { and end with }.',
    'messages'   => [['role' => 'user', 'content' => $input['prompt']]]
];

// Use file_get_contents with stream context instead of curl
// This avoids curl timeout issues on shared hosting
$context = stream_context_create([
    'http' => [
        'method'        => 'POST',
        'header'        => implode("\r\n", [
            'Content-Type: application/json',
            'x-api-key: ' . $API_KEY,
            'anthropic-version: 2023-06-01',
        ]),
        'content'       => json_encode($payload),
        'timeout'       => 300,
        'ignore_errors' => true,
    ],
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
    ]
]);

$response = file_get_contents('https://api.anthropic.com/v1/messages', false, $context);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'فشل الاتصال بالـ API', 'content' => []]);
    exit;
}

// Get HTTP status from response headers
$httpCode = 200;
foreach ($http_response_header as $h) {
    if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $h, $m)) {
        $httpCode = (int)$m[1];
    }
}

if ($httpCode !== 200) {
    $decoded = json_decode($response, true);
    $errMsg  = $decoded['error']['message'] ?? $response;
    http_response_code(500);
    echo json_encode(['error' => $httpCode . ': ' . substr($errMsg, 0, 300), 'content' => []]);
    exit;
}

http_response_code(200);
echo $response;
