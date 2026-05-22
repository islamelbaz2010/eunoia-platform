<?php
header('Content-Type: text/plain; charset=utf-8');

$API_KEY = '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';

$payload = [
    'model'      => 'claude-sonnet-4-5',
    'max_tokens' => 50,
    'messages'   => [['role' => 'user', 'content' => 'say: OK']]
];

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $API_KEY,
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "cURL Error: " . ($curlError ?: 'None') . "\n";
echo "Response: " . $response . "\n";
