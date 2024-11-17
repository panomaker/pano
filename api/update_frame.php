<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключение к базе данных
$servername = "127.0.0.1";
$username = "kirik14029";
$password = "dFBe7T8Pv81&3UBf"; // Ваш пароль
$dbname = "kirik14029";
$port = 3308;
$socket = '/var/run/mysql8-container/mysqld.sock';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;port=$port;unix_socket=$socket", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Ошибка при подключении к базе данных: " . $e->getMessage());
}

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["error" => "Method not allowed. Use POST method."]);
    exit;
}

// Получение данных из POST-запроса
$inputData = json_decode(file_get_contents('php://input'), true);

if (!$inputData || !isset($inputData['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Invalid input. 'id' is required."]);
    exit;
}

// Извлечение данных из запроса
$id = $inputData['id'];
$file = isset($inputData['file']) ? $inputData['file'] : null;
$lat = isset($inputData['lat']) ? $inputData['lat'] : null;
$lon = isset($inputData['lon']) ? $inputData['lon'] : null;
$timestamp = isset($inputData['timestamp']) ? $inputData['timestamp'] : null;

try {
    // Формируем SQL-запрос для обновления данных
    $updateFields = [];
    $params = [':id' => $id];

    if ($file !== null) {
        $updateFields[] = "file = :file";
        $params[':file'] = $file;
    }
    if ($lat !== null) {
        $updateFields[] = "lat = :lat";
        $params[':lat'] = $lat;
    }
    if ($lon !== null) {
        $updateFields[] = "lon = :lon";
        $params[':lon'] = $lon;
    }
    if ($timestamp !== null) {
        $updateFields[] = "timestamp = :timestamp";
        $params[':timestamp'] = $timestamp;
    }

    if (empty($updateFields)) {
        throw new Exception("No data to update.");
    }

    $sql = "UPDATE frames SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["message" => "Frame updated successfully."]);
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "An error occurred: " . $e->getMessage()]);
}
?>