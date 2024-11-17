<?php
// Включение отображения ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключение к базе данных
$servername = "127.0.0.1";
$username = "kirik14029";
$password = "dFBe7T8Pv81&3UBf";
$dbname = "kirik14029";
$port = 3308;
$socket = '/var/run/mysql8-container/mysqld.sock';

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;port=$port;unix_socket=$socket", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Успешное подключение к базе данных!<br>";
} catch (PDOException $e) {
    die("Ошибка подключения: " . $e->getMessage());
}

// Функция для записи треков в базу данных
function saveTrack($pdo, $user_email, $recording_date, $placemark_name, $coordinates) {
    $stmt = $pdo->prepare("
        INSERT INTO tracks (user_email, recording_date, placemark_name, coordinates) 
        VALUES (:user_email, :recording_date, :placemark_name, :coordinates)
    ");
    $stmt->execute([
        'user_email' => $user_email,
        'recording_date' => $recording_date,
        'placemark_name' => $placemark_name,
        'coordinates' => $coordinates
    ]);
}

// Функция для извлечения данных из имени файла
function extractDataFromFilename($filename) {
    // Извлекаем email и дату из имени файла
    $filename = basename($filename, '.kml');
    $parts = explode('_', $filename);
    return [
        'email' => $parts[0],
        'recording_date' => DateTime::createFromFormat('d-m-Y', $parts[1])->format('Y-m-d')
    ];
}

// Путь к KML-файлу (обнови путь для тестов)
$kml_file = '../uploads/tracks/k.t.coolboy.1999@gmail.com_04-07-2024_04-07-2024.kml';

// Извлекаем данные из имени файла
$file_data = extractDataFromFilename($kml_file);
$user_email = $file_data['email'];
$recording_date = $file_data['recording_date'];

// Чтение содержимого KML-файла
$kml_content = file_get_contents($kml_file);
$xml = simplexml_load_string($kml_content, 'SimpleXMLElement', LIBXML_NOCDATA);

// Пространство имен KML
$namespaces = $xml->getNamespaces(true);
$xml->registerXPathNamespace('kml', $namespaces['']);

// Поиск всех Placemark с линиями
$placemarks = $xml->xpath('//kml:Placemark');

// Извлечение координат из каждого Placemark и запись в базу данных
foreach ($placemarks as $placemark) {
    $placemark_name = (string) $placemark->name;
    $coordinates = [];

    // Извлечение координат из LineString
    foreach ($placemark->xpath('.//kml:LineString/kml:coordinates') as $line) {
        $coordinates[] = trim((string) $line);
    }

    // Объединяем координаты в строку
    $coordinates_string = implode(' ', $coordinates);

    // Запись трека в базу данных
    saveTrack($pdo, $user_email, $recording_date, $placemark_name, $coordinates_string);

    echo "Трек '$placemark_name' успешно добавлен с координатами: $coordinates_string<br>";
}

echo "Все треки из KML-файла успешно записаны в базу данных!";
?>