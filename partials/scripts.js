var viewer;
var map; // Глобальная переменная для карты
var currentArrowMarker = null;
var coordinatesText = "";
var lat, lon;

var currentYaw = 30;  // Начальный угол обзора
var currentPitch = 0;  // Начальный вертикальный угол
var currentHfov = 80;  // Начальный HFOV
var markersLayer;      // Лейер для маркеров
var lazyZoomThreshold = 12; // Порог зума, при котором включается ленивый рендеринг

var frames = []; // Инициализация пустого массива для данных
var firstFrame = ""; // Инициализация переменной для первого фрейма

// Функция для загрузки панорамы из URL
function loadPanoramaFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileName = urlParams.get('file');
    const yaw = parseFloat(urlParams.get('yaw')) || 30;  // Получаем yaw из URL
    const pitch = parseFloat(urlParams.get('pitch')) || 0;  // Получаем pitch из URL
    const hfov = parseFloat(urlParams.get('hfov')) || currentHfov;  // Получаем hfov из URL

    console.log("Загружаем панораму с параметрами из URL:", {yaw, pitch, hfov});

    const frame = frames.find(f => f.file === fileName);

    if (frame) {
        currentYaw = yaw;
        currentPitch = pitch;
        currentHfov = hfov;
        loadPanorama('uploads/frames/' + frame.file, false);
    } else {
        loadPanorama(firstFrame);
    }
}

// Функция для загрузки данных с сервера
function loadFrames() {
    return fetch('api/frames.php') // Указываем путь к вашему API
        .then(response => response.json())
        .then(data => {
            frames = data;
            firstFrame = 'uploads/frames/' + frames[0].file;
            loadPanoramaFromURL(); // Загружаем панораму после получения данных
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
        });
}

function loadPanorama(imageUrl, updateUrl = true) {
    viewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": imageUrl,
        "autoLoad": true,
        "hfov": currentHfov,
        "yaw": currentYaw,
        "pitch": currentPitch,
        "maxHfov": 120,
        "minHfov": 30,
        "autoRotate": false,
        "disableKeyboardCtrl": false,
        "orientationOnByDefault": false,
        "friction": 0.0  // Убираем эффект сглаживания при движении мышью
    });

    // Обновляем метку времени съёмки
    var frame = frames.find(f => f.file === imageUrl.split('/').pop());
    if (frame && frame.timestamp) {
        // Здесь мы меняем форматирование, чтобы отображалась только дата
        var dateOnly = frame.timestamp.split(' ')[0]; // Берём только дату, отрезая время
        document.getElementById('timestamp').textContent = `Дата съёмки: ${dateOnly}`;
    }

    // Таймер для проверки изменения yaw и pitch
    setInterval(function() {
        var newYaw = viewer.getYaw();
        var newPitch = viewer.getPitch();
        if (newYaw !== currentYaw || newPitch !== currentPitch) {
            currentYaw = newYaw;
            currentPitch = newPitch;
            console.log("Yaw или Pitch изменены:", { currentYaw, currentPitch });
            updateUrlParams(); // Обновляем URL параметры
            updateArrowRotation();  // Обновляем поворот стрелки
        }
    }, 100); // Проверяем каждые 100 миллисекунд

    // Обработка изменения HFOV при прокрутке колеса мыши
    document.getElementById('panorama').addEventListener('wheel', function(event) {
        event.preventDefault(); // Предотвращаем дефолтное поведение
        console.log("DeltaY:", event.deltaY); // Логирование прокрутки

        if (event.deltaY < 0) {
            // Уменьшение HFOV (приближение)
            currentHfov -= 5;
        } else if (event.deltaY > 0) {
            // Увеличение HFOV (отдаление)
            currentHfov += 5;
        }

        // Ограничиваем HFOV в пределах 30-120
        currentHfov = Math.max(30, Math.min(120, currentHfov));

        viewer.setHfov(currentHfov, 0);  // Устанавливаем HFOV без анимации
        console.log("HFOV изменен:", currentHfov);
        updateUrlParams(); // Обновляем URL параметры
    });

    initializeMapWithExif(imageUrl);
}

// Функция для обновления URL параметров при изменении yaw, pitch или hfov
function updateUrlParams() {
    var frameName = viewer.getConfig().panorama.split('/').pop();
    var newYaw = normalizeYaw(currentYaw).toFixed(6);
    var newPitch = currentPitch.toFixed(6);
    var newHfov = currentHfov.toFixed(6);
    var newUrl = `?file=${encodeURIComponent(frameName)}&yaw=${newYaw}&pitch=${newPitch}&hfov=${newHfov}`;
    console.log("Обновляем URL:", newUrl);
    history.replaceState({ file: frameName, yaw: newYaw, pitch: newPitch, hfov: newHfov }, '', newUrl);
}

// Функция для нормализации yaw в диапазон 0-360 градусов
function normalizeYaw(yaw) {
    let normalizedYaw = yaw % 360;
    if (normalizedYaw < 0) {
        normalizedYaw += 360;
    }
    return normalizedYaw;
}

// Функция для обновления поворота стрелки на карте
function updateArrowRotation() {
    if (currentArrowMarker) {
        var iconElement = currentArrowMarker.getElement().querySelector('.arrow-icon');
        if (iconElement) {
            var rotation = normalizeYaw(currentYaw); // Преобразуем yaw в диапазон 0-360
            iconElement.style.transform = `rotate(${rotation}deg)`;
            console.log("Поворот стрелки на карте обновлен:", rotation);
        }
    }
}

// Функция для инициализации карты с данными EXIF
function initializeMapWithExif(imageUrl) {
    var frame = frames.find(f => f.file === imageUrl.split('/').pop());
    if (frame) {
        lat = parseFloat(frame.lat);
        lon = parseFloat(frame.lon);
        console.log(`Loaded frame coordinates: ${lat}, ${lon}`);

        coordinatesText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        
        var depthButton = document.getElementById('depth-button');
        depthButton.textContent = `Координаты: ${coordinatesText}`;

        if (!map) {
            // Если карта еще не инициализирована, инициализируем её
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1').addTo(map);

            map.on('zoomend', function() {
                renderVisibleMarkers(); // Пересчитываем маркеры при изменении зума
            });

            map.on('moveend', renderVisibleMarkers); // Рендерим только видимые маркеры при завершении перемещения карты
        } else {
            // Если карта уже инициализирована, обновляем её положение
            var currentZoom = map.getZoom();
            map.setView([lat, lon], currentZoom);
        }

        renderVisibleMarkers(); // Первоначальный рендеринг видимых маркеров

        var combinedIconHtml = `
            <div class="combined-icon">
                <div class="blue-circle-icon"></div>
                <svg class="arrow-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="50,0 100,100 50,75 0,100" fill="red" />
                </svg>
            </div>`;

        arrowIcon = L.divIcon({
            className: 'leaflet-div-icon',
            html: combinedIconHtml,
            iconSize: [30, 30]
        });

        if (currentArrowMarker) {
            map.removeLayer(currentArrowMarker);
        }

        currentArrowMarker = L.marker([lat, lon], {
            icon: arrowIcon
        }).addTo(map);

        updateArrowRotation();  // Устанавливаем начальный поворот стрелки
    } else {
        console.error(`Frame ${imageUrl} not found in cache.`);
    }
}

function renderVisibleMarkers() {
    var bounds = map.getBounds(); // Получаем видимые границы карты
    var zoomLevel = map.getZoom(); // Получаем текущий уровень зума

    if (markersLayer) {
        markersLayer.clearLayers(); // Очищаем все маркеры перед рендерингом новых
    }

    // Если зум меньше порога `lazyZoomThreshold`, используем кластеризацию
    if (zoomLevel < lazyZoomThreshold) {
        markersLayer = L.markerClusterGroup(); // Создаем кластерную группу
    } else {
        markersLayer = L.layerGroup(); // Создаем обычную группу для маркеров
    }

    frames.forEach(function(frame) {
        var lat = parseFloat(frame.lat);
        var lon = parseFloat(frame.lon);

        // Ленивая загрузка только при зуме выше определенного порога
        if ((zoomLevel >= lazyZoomThreshold && bounds.contains([lat, lon])) || zoomLevel < lazyZoomThreshold) {
            var markerIcon = L.divIcon({
                className: 'leaflet-div-icon',
                html: `<svg class="arrow-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="25" fill="blue" />
                      </svg>`,
                iconSize: [30, 30]
            });

            var marker = L.marker([lat, lon], {
                icon: markerIcon
            });

            marker.on('click', function() {
                loadPanorama('uploads/frames/' + frame.file);
            });

            markersLayer.addLayer(marker); // Добавляем маркер в группу
        }
    });

    map.addLayer(markersLayer); // Добавляем видимые маркеры на карту
    console.log("Rendered markers count: ", markersLayer.getLayers().length); // Логируем количество видимых точек
}

var depthButton = document.getElementById('depth-button');
depthButton.addEventListener('click', function() {
    if (coordinatesText) {
        navigator.clipboard.writeText(coordinatesText).then(function() {
            alert('Координаты скопированы в буфер обмена: ' + coordinatesText);
        }, function() {
            alert('Не удалось скопировать координаты.');
        });
    } else {
        alert('Координаты еще не загружены.');
    }
});

var fijiButton = document.getElementById('fiji-button');
fijiButton.addEventListener('click', function() {
    if (lat && lon) {
        var fijiUrl = `fiji://view/lon=${lon.toFixed(6)}&lat=${lat.toFixed(6)}`;
        window.location.href = fijiUrl;
    } else {
        alert('Координаты еще не загружены.');
    }
});

var statsButton = document.getElementById('stats-button');
statsButton.addEventListener('click', function() {
    window.location.href = 'stats.html';
});

// Загружаем данные и инициализируем панораму после загрузки данных
loadFrames();