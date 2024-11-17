document.addEventListener('DOMContentLoaded', () => {
  const videoContainer = document.getElementById('videoContainer');
  const mapContainer = document.getElementById('mapContainer');

  let viewer;
  let videoPanorama;

  // Автоматическая загрузка панорамного видео при открытии страницы
  const videoURL = 'uploads/videos/panoramic_video.mp4'; // Указан правильный путь к видео

  if (viewer) {
    viewer.remove(videoPanorama);
  } else {
    viewer = new PANOLENS.Viewer({ 
      container: videoContainer,
      controlBar: true, // Включаем встроенную панель управления
      cameraFov: 75
    });
  }

  videoPanorama = new PANOLENS.VideoPanorama(videoURL, {
    autoplay: true, // Включаем автоплей
    muted: true, // Отключаем звук для автоплея на iOS
    loop: true,
    playsinline: true, // Для поддержки iOS
    crossOrigin: 'anonymous'
  });

  viewer.add(videoPanorama);

  const map = L.map('map').setView([55.751244, 37.618423], 10); // Координаты Москвы

  // Подключение слоя карты 2ГИС
  L.tileLayer('https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
    attribution: '&copy; 2ГИС'
  }).addTo(map);

  // Загрузка и отображение KML-файла
  omnivore.kml('uploads/tracks/2024/08/20/11db8cf3-6bd3-49fe-a062-8629086db568.kml').on('ready', function(event) {
    const layer = event.target;
    map.fitBounds(layer.getBounds()); // Автозумирование карты на трек KML
    console.log('KML file loaded successfully');
  }).on('error', function(e) {
    console.error('Error loading KML file:', e);
  }).addTo(map);

  // Обновление размера карты при изменении размера окна
  window.addEventListener('resize', () => {
    map.invalidateSize();
  });

  // Отладка: Проверка инициализации карты и контейнеров
  console.log('Map initialized:', map);
  console.log('Video container:', videoContainer);
  console.log('Map container:', mapContainer);
});