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

// Загрузка данных из JSON-файла
$jsonData = file_get_contents('cache/frames_list.json');
if ($jsonData === false) {
    die('Ошибка при загрузке JSON-файла.');
}

$frames = json_decode($jsonData, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    die('Ошибка при парсинге JSON: ' . json_last_error_msg());
}

// Заполнение таблицы данными
foreach ($frames as $frame) {
    try {
        // Проверка, существует ли запись в базе данных
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM frames WHERE file = :file");
        $stmt->execute([':file' => $frame['file']]);
        $exists = $stmt->fetchColumn();

        if ($exists) {
            echo "Фрейм " . $frame['file'] . " уже существует в базе данных. Пропускаем.\n";
            continue; // Пропускаем существующие фреймы
        }

        // Вставка нового фрейма в таблицу
        $stmt = $pdo->prepare("INSERT INTO frames (file, lat, lon, timestamp) VALUES (:file, :lat, :lon, :timestamp)");
        $stmt->execute([
            ':file' => $frame['file'],
            ':lat' => $frame['lat'],
            ':lon' => $frame['lon'],
            ':timestamp' => $frame['timestamp']
        ]);

        echo "Фрейм " . $frame['file'] . " успешно добавлен в базу данных.\n";
    } catch (PDOException $e) {
        die('Ошибка при выполнении SQL-запроса: ' . $e->getMessage());
    }
}

echo "Обновление базы данных завершено.";
?>