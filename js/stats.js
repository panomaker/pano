document.addEventListener('DOMContentLoaded', () => {
  const tocList = document.getElementById('tocList');
  const mapContainer = document.getElementById('mapContainer');
  const map = L.map('map').setView([55.751244, 37.618423], 10); // Координаты Москвы

  // Подключение слоя карты 2ГИС
  L.tileLayer('https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
    attribution: '&copy; 2ГИС'
  }).addTo(map);

  // Слой для отображения треков
  const tracksLayer = L.layerGroup().addTo(map);

  // Переменная для хранения общей длины всех треков
  let totalTrackLength = 0;

  // Массив для хранения связи между ссылками и треками
  const trackLinks = [];

  // Функция для создания или получения узла (папки) в списке
  function createOrGetFolderNode(folderPath) {
    const folders = folderPath.split('/');
    let currentFolder = tocList;

    folders.forEach(folder => {
      let folderNode = currentFolder.querySelector(`li[data-folder="${folder}"]`);
      if (!folderNode) {
        folderNode = document.createElement('li');
        folderNode.setAttribute('data-folder', folder);
        folderNode.innerText = folder;
        const subList = document.createElement('ul');
        folderNode.appendChild(subList);
        currentFolder.appendChild(folderNode);
        currentFolder = subList;
      } else {
        currentFolder = folderNode.querySelector('ul');
      }
    });

    return currentFolder;
  }

  // Функция для загрузки и отображения всех KML-файлов
  function loadKMLTracks() {
    fetch('php/stats.php')
      .then(response => response.json())
      .then(files => {
        files.forEach((file) => {
          if (file.kml_path && file.kml_path.endsWith('.kml')) {
            const folderNode = createOrGetFolderNode(file.folder);
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${file.name}`;
            link.textContent = file.name;
            listItem.appendChild(link);
            folderNode.appendChild(listItem);

            // Загрузить KML файл и добавить слой на карту
            loadKML(file.kml_path, listItem, link);
          } else {
            console.error(`Invalid KML path: ${file.kml_path}`);
          }
        });

        // После загрузки всех треков вывести общую длину
        const totalListItem = document.createElement('li');
        totalListItem.textContent = `Общая длина всех треков: ${totalTrackLength.toFixed(2)} км`;
        tocList.appendChild(totalListItem);
      })
      .catch(error => console.error('Error fetching tracks:', error));
  }

  // Функция для загрузки KML и подсчета длины трека
  function loadKML(kmlPath, listItem, link) {
    omnivore.kml(kmlPath, null, L.geoJson(null, {
      style: function() {
        return { color: "red" }; // Устанавливаем цвет линий на красный
      }
    })).on('ready', function(event) {
      const layer = event.target;
      tracksLayer.addLayer(layer); // Добавляем трек на карту

      // Рассчитываем длину трека
      const length = calculateTrackLength(layer);
      totalTrackLength += length; // Добавляем длину трека к общей длине
      listItem.querySelector('a').textContent += ` - Длина: ${length.toFixed(2)} км`;

      // Сохраняем связь между ссылкой и треком
      trackLinks.push({ link, layer });

      // Добавляем обработчик клика для перелета на трек
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Предотвращаем стандартное поведение ссылки
        map.fitBounds(layer.getBounds()); // Перемещаем карту к треку
      });
    }).on('error', function(e) {
      console.error(`Error loading ${kmlPath}:`, e);
    });
  }

  // Функция для подсчета длины трека
  function calculateTrackLength(layer) {
    let totalDistance = 0;
    layer.eachLayer(function(l) {
      if (l instanceof L.Polyline) {
        totalDistance += l.getLatLngs().reduce((acc, latlng, index, arr) => {
          if (index === 0) return acc;
          return acc + latlng.distanceTo(arr[index - 1]);
        }, 0);
      }
    });
    return totalDistance / 1000; // Переводим из метров в километры
  }

  // Загружаем KML треки при загрузке страницы
  loadKMLTracks();

  // Обновление размера карты при изменении размера окна
  window.addEventListener('resize', () => {
    map.invalidateSize();
  });
});