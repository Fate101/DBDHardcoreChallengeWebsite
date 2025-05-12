<?php
header('Content-Type: application/json');

// Get the POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data === null) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Save the data to a file
$result = file_put_contents('challenge_state.json', $json);

if ($result === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to save data']);
} else {
    echo json_encode(['success' => true]);
} 