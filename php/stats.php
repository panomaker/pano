<?php
header('Content-Type: application/json');

// Подключение к базе данных
$servername = "127.0.0.1";
$username = "kirik14029";
$password = "dFBe7T8Pv81&3UBf"; // Замените на ваш пароль
$dbname = "kirik14029";
$port = 3308;
$socket = '/var/run/mysql8-container/mysqld.sock';

// Создание подключения
$conn = new mysqli($servername, $username, $password, $dbname, $port, $socket);

// Проверка подключения
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Путь к основной папке с KML-файлами
$directory = '../uploads/tracks/';

// Функция для рекурсивного сканирования директорий и поиска KML-файлов
function getKMLFiles($dir, $conn) {
    $files = array();
    $iterator = new RecursiveDirectoryIterator($dir);
    foreach (new RecursiveIteratorIterator($iterator) as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'kml') {
            $relativePath = str_replace('../', '', $file); // Убираем '../' из пути для корректного использования на клиенте
            $fileName = pathinfo($file, PATHINFO_FILENAME);
            
            // Попытка получить ID трека из базы данных на основе имени файла
            $stmt = $conn->prepare("SELECT id FROM tracks WHERE name = ?");
            $stmt->bind_param("s", $fileName);
            $stmt->execute();
            $stmt->bind_result($trackId);
            $stmt->fetch();
            $stmt->close();

            $files[] = array(
                'id' => $trackId ?: null, // Если ID не найден, оставляем его как null
                'name' => $fileName,
                'kml_path' => $relativePath,
                'folder' => dirname($relativePath)
            );
        }
    }
    return $files;
}

// Получаем все KML-файлы
$tracks = getKMLFiles($directory, $conn);

// Закрываем соединение с базой данных
$conn->close();

// Возвращаем JSON-ответ
echo json_encode($tracks);
?>