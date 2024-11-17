---

# GeoView360

## Описание проекта

GeoView360 — это веб-приложение для отображения KML-треков на интерактивной карте с возможностью просмотра соответствующих панорамных видео. Приложение позволяет пользователям загружать и отображать треки из структуры каталогов, а также связывать их с видеоматериалами для удобного просмотра.

## Стек технологий

### HTML/CSS

- HTML: Используется для создания структуры веб-страниц, таких как index.html, example.html, и track_view.php.
  - Пример использования: Разметка карты и таблицы содержимого (Table of Contents).
  
- CSS: Используется для стилизации веб-страниц, включая шапку, таблицу содержимого и карту.
  - Пример использования: Файлы styles_example.css и styles_index.css содержат стили для страниц example.html и index.html.

### JavaScript

- Leaflet.js:  библиотека для создания интерактивных карт.
  - Пример использования: Отображение карты и треков на страницах index.html и track_view.php.

- Leaflet-Omnivore: Плагин для Leaflet.js, который позволяет загружать и отображать KML-файлы.
  - Пример использования: Загрузка треков на карту.

- Panolens.js: Библиотека для отображения панорамных изображений и видео.
  - Пример использования: Воспроизведение панорамного видео на страницах example.html и track_view.php.

- Fetch API: Используется для выполнения асинхронных запросов к серверу и получения данных.
  - Пример использования: Получение списка KML-файлов из get_kml_files.php.

### PHP

- PHP: Используется для серверной логики и взаимодействия с базой данных.
  - Пример использования:
    - MySQL: Выполнение SQL-запросов для работы с базой данных.
    - RecursiveDirectoryIterator: Рекурсивный обход директорий для поиска KML-файлов.
    - JSON encoding: Преобразование данных в формат JSON для передачи на клиентскую сторону.

### MySQL

- MySQL: Система управления базами данных, используемая для хранения информации о треках и видео.
  - Пример использования:
    - Создание таблиц: Таблицы tracks и videos.
    - SQL-запросы: Получение данных о треках и связанных с ними видео.

## Структура проекта
kirik14029/
├── public_html/
│   ├── css/
│   │   ├── styles_example.css    # стилизация страницы example.html
│   │   ├── styles_index.css      # стилизация страницы index.html
│   ├── js/
│   │   ├── example.js            # логика страницы example.html
│   │   ├── index.js              # логика страницы index.html
│   ├── php/
│   │   ├── get_kml_files.php     # все KML-файлов из папки uploads/tracks
│   ├── uploads/
│   │   ├── videos/               # Папка для панорамных видео
│   │   │   ├── panoramic_video.mp4  # Пример загруженного файла панорамного видео
│   │   ├── tracks/               # Папка для всех KML-файлов (включая подкаталоги)
│   │   │   ├── 2024/
│   │   │   │   ├── 08/
│   │   │   │   │   ├── 20/
│   │   │   │   │   │   ├── 11db8cf3-6bd3-49fe-a062-8629086db568.kml  # Пример KML-файла
│   ├── example.html              # Страница пример (с панорамным видео и картой)
│   ├── index.html                #  (отображает все KML-треки из uploads/tracks)
│   ├── track_view.php            # заготовка для связки трека и видео


### Описание файлов и папок:

- public_html: Основная директория проекта, доступная через веб-сервер.
- css: Папка, содержащая файлы стилей для страниц проекта.
- js: Папка с JavaScript-файлами, управляющими логикой и интерактивностью страниц.
- php: Папка с PHP-скриптами для обработки серверной логики.
- uploads: Папка, содержащая загруженные треки и видео. Может включать подкаталоги для организации файлов.
- example.html: Пример страницы, включающей панорамное видео и карту.
- index.html: Главная страница, отображающая все треки на карте.
- track_view.php: Шаблон для отображения трека и связанного с ним видео.

## Структура базы данных

### Таблица `videos`

Хранит информацию обо всех панорамных видео.
| Поле       | Тип данных         | Описание                                       |
|------------|--------------------|------------------------------------------------|
| id       | INT(11) AUTO_INCREMENT PRIMARY KEY | Уникальный идентификатор видео.  |
| name     | VARCHAR(255)        | Название видео.                                |
| description | TEXT             | Описание видео (опционально).                  |
| file_path | VARCHAR(255)       | Путь к видеофайлу.                             |

### Таблица `tracks`

Хранит информацию о всех треках (KML-файлах).

| Поле       | Тип данных         | Описание                                       |
|------------|--------------------|------------------------------------------------|
| id       | INT(11) AUTO_INCREMENT PRIMARY KEY | Уникальный идентификатор трека.  |
| name     | VARCHAR(255)        | Название трека, обычно совпадает с именем файла (без расширения). |
| description | TEXT             | Описание трека (опционально).                  |
| kml_path | VARCHAR(255)        | Путь к KML-файлу.                              |
| video_id | INT(11)             | Внешний ключ, ссылающийся на id в таблице videos. Позволяет связать трек с видео. |

## Установка и настройка

### Шаги для установки:

1. Клонирование репозитория:
   - Склонируйте репозиторий на ваш сервер или локальную машину.

2. Настройка базы данных:
   - Создайте базу данных MySQL и выполните SQL-запросы для создания таблиц tracks и videos.
   - Заполните таблицы необходимыми данными.

3. Настройка файлов проекта:
   - Обновите файлы php/get_kml_files.php и track_view.php, указав правильные данные для подключения к базе данных.

4. Загрузка файлов:
   - Загрузите KML-файлы в папку uploads/tracks.
   - Загрузите видеофайлы в папку uploads/videos.

5. Запуск проекта:
   - Откройте главную страницу проекта (`index.html`) в браузере и убедитесь, что все треки отображаются на карте.

## Использование

### Главная страница (`index.html`)

- Отображает все KML-треки, найденные в папке uploads/tracks.
- Позволяет пользователю кликать на треки в таблице содержимого (Table of Contents) для открытия соответствующей страницы с видео.

### Страница трека (`track_view.php`)

- Отображает выбранный трек на карте и связанное с ним видео.

## Заключение

Этот проект предоставляет удобный интерфейс для отображения KML-треков и связанных с ними видео. Используя современные технологии и библиотеки, он обеспечивает интерактивный и масштабируемый способ работы с географическими данными.

Если у вас есть вопросы или предложения по улучшению проекта, свяжитесь со мной в телеграм @kirik1402

---


## Acknowledgements

 - [Awesome Readme Templates](https://awesomeopensource.com/project/elangosundar/awesome-README-templates)
 - [Awesome README](https://github.com/matiassingers/awesome-readme)
 - [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)