<?php

// Функция для извлечения данных EXIF, включая GPS координаты
function getGps($exifCoord, $hemi) {
    $degrees = count($exifCoord) > 0 ? gpsToNumber($exifCoord[0]) : 0;
    $minutes = count($exifCoord) > 1 ? gpsToNumber($exifCoord[1]) : 0;
    $seconds = count($exifCoord) > 2 ? gpsToNumber($exifCoord[2]) : 0;

    $flip = ($hemi == 'W' || $hemi == 'S') ? -1 : 1;

    return $flip * ($degrees + ($minutes / 60.0) + ($seconds / 3600.0));
}

function gpsToNumber($coordPart) {
    $parts = explode('/', $coordPart);

    if (count($parts) <= 0)
        return 0;

    if (count($parts) == 1)
        return $parts[0];

    return floatval($parts[0]) / floatval($parts[1]);
}

// Путь к папке с фреймами
$framesDir = 'uploads/frames/';

// Массив для хранения данных
$data = [];

// Открываем папку и проходимся по файлам
if (is_dir($framesDir)) {
    if ($dh = opendir($framesDir)) {
        while (($file = readdir($dh)) !== false) {
            if (pathinfo($file, PATHINFO_EXTENSION) == 'jpg' || pathinfo($file, PATHINFO_EXTENSION) == 'jpeg') {
                // Получаем полный путь к файлу
                $filePath = $framesDir . $file;

                // Получаем EXIF данные (включая GPS)
                $exif = @exif_read_data($filePath);

                if ($exif === false) {
                    echo "Не удалось прочитать EXIF данные для файла: $file\n";
                    continue;
                }

                // Выводим сырые EXIF-данные для анализа
                echo "EXIF данные для файла $file:\n";
                print_r($exif);
                echo "\n==============================\n";

                // Ищем GPS данные
                if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude'])) {
                    // Извлекаем и округляем GPS данные
                    $lat = round(getGps($exif['GPSLatitude'], $exif['GPSLatitudeRef']), 6);
                    $lon = round(getGps($exif['GPSLongitude'], $exif['GPSLongitudeRef']), 6);

                    // Извлекаем время съемки из EXIF данных
                    if (isset($exif['DateTimeOriginal'])) {
                        $timestamp = $exif['DateTimeOriginal']; // Время съемки
                    } elseif (isset($exif['GPSDateStamp']) && isset($exif['GPSTimeStamp'])) {
                        // Если 'DateTimeOriginal' недоступен, пробуем использовать GPS время
                        $date = $exif['GPSDateStamp'];
                        $time = implode(':', array_map('gpsToNumber', $exif['GPSTimeStamp']));
                        $timestamp = $date . ' ' . $time;
                    } else {
                        // Время изменения файла как резервный вариант
                        $timestamp = date("Y-m-d H:i:s", filemtime($filePath));
                    }

                    // Сохраняем данные в массив
                    $data[] = [
                        'file' => $file,
                        'lat' => (string)$lat,
                        'lon' => (string)$lon,
                        'timestamp' => $timestamp
                    ];
                } else {
                    echo "GPS данные не найдены для файла: $file\n";
                }
            }
        }

        closedir($dh);
    }
}

// Генерируем JSON и сохраняем его в файл
$jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents('cache/frames_list.json', $jsonData) === false) {
    echo "Ошибка при записи данных в frames_data.json\n";
} else {
    echo "Данные успешно сохранены в frames_data.json\n";
}