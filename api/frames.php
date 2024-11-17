<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Установка заголовка для ответа в формате JSON
header('Content-Type: application/json');

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
    die(json_encode(["error" => "Ошибка при подключении к базе данных: " . $e->getMessage()]));
}

// Запрос данных из таблицы frames
try {
    $stmt = $pdo->query("SELECT * FROM frames");
    $frames = $stmt->fetchAll();

    // Возвращаем JSON-ответ с данными о фреймах
    echo json_encode($frames);
} catch (PDOException $e) {
    die(json_encode(["error" => "Ошибка при выполнении SQL-запроса: " . $e->getMessage()]));
}
?>