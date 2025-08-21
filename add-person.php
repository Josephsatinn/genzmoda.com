<?php
// OOP uyumlu sınıf: Kişi bilgilerini tutmak için
class Person {
    public $id;
    public $name;
    public $surname;
    public $title;
    public $profession;
    public $birthDeath;
    public $locationLink;
    public $profileImage;
    public $coverImage;
    public $additionalLocations = [];

    public function __construct($id = null, $name = '', $surname = '', $title = '', $profession = '', $birthDeath = '', $locationLink = '', $profileImage = '', $coverImage = '', $additionalLocations = []) {
        $this->id = $id;
        $this->name = $name;
        $this->surname = $surname;
        $this->title = $title;
        $this->profession = $profession;
        $this->birthDeath = $birthDeath;
        $this->locationLink = $locationLink;
        $this->profileImage = $profileImage;
        $this->coverImage = $coverImage;
        $this->additionalLocations = $additionalLocations;
    }

    public function save() {
        // Veritabanına kaydetme simülasyonu (gerçekte PDO ile yapılabilir)
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'surname' => $this->surname,
            'title' => $this->title,
            'profession' => $this->profession,
            'birthDeath' => $this->birthDeath,
            'locationLink' => $this->locationLink,
            'profileImage' => $this->profileImage,
            'coverImage' => $this->coverImage,
            'additionalLocations' => $this->additionalLocations
        ];
        // Şimdilik ekrana bas, gerçekte veritabanına kaydedebilirsin
        echo "<pre>" . print_r($data, true) . "</pre>";
        // Kaydetme sonrası yönlendirme
        header("Location: index.php");
        exit();
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $additionalLocations = [];
    $locationCount = isset($_POST['location_count']) ? intval($_POST['location_count']) : 0;
    for ($i = 0; $i < $locationCount; $i++) {
        if (!empty($_POST["location_name_$i"])) {
            $gallery = [];
            if (isset($_FILES["gallery_$i"]) && !empty($_FILES["gallery_$i"]["name"][0])) {
                foreach ($_FILES["gallery_$i"]["name"] as $key => $name) {
                    $tmp_name = $_FILES["gallery_$i"]["tmp_name"][$key];
                    $target_file = "images/" . basename($name);
                    move_uploaded_file($tmp_name, $target_file);
                    $gallery[] = $target_file;
                }
            }
            $additionalLocations[$_POST["location_name_$i"]] = [
                $_POST["location_link_$i"],
                $_POST["location_year_$i"],
                $_POST["location_detail_$i"],
                $gallery
            ];
        }
    }

    $person = new Person(
        null,
        $_POST['name'],
        $_POST['surname'],
        $_POST['title'],
        $_POST['profession'],
        $_POST['birthDeath'],
        $_POST['locationLink'],
        $_POST['profileImage'] ? "images/" . basename($_FILES["profileImage"]["name"]) : '',
        $_POST['coverImage'] ? "images/" . basename($_FILES["coverImage"]["name"]) : '',
        $additionalLocations
    );

    // Dosya yüklemeleri
    if (!empty($_FILES["profileImage"]["name"])) {
        $target_file = "images/" . basename($_FILES["profileImage"]["name"]);
        move_uploaded_file($_FILES["profileImage"]["tmp_name"], $target_file);
        $person->profileImage = $target_file;
    }
    if (!empty($_FILES["coverImage"]["name"])) {
        $target_file = "images/" . basename($_FILES["coverImage"]["name"]);
        move_uploaded_file($_FILES["coverImage"]["tmp_name"], $target_file);
        $person->coverImage = $target_file;
    }

    $person->save();
}
?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kişi Ekle</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        *, body {
            font-family: system-ui;
        }
        .form-container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-label {
            font-weight: bold;
        }
        .btn-back, .btn-add-location, .btn-select-location {
            background-color: rgb(255, 255, 250);
            color: black;
            border: none;
            box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
            border-radius: 5px;
            padding: 8px 15px;
            margin-right: 10px;
        }
        .btn-back:hover, .btn-add-location:hover, .btn-select-location:hover {
            background-color: #e0e0e0;
            transform: scale(1.05);
        }
        .btn-submit {
            background-color: rgb(255, 255, 250);
            color: black;
            border: none;
            box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
            border-radius: 5px;
            padding: 10px 20px;
            width: 100%;
        }
        .btn-submit:hover {
            background-color: #e0e0e0;
            transform: scale(1.05);
        }
        #mini-map, .mini-map-location {
            height: 200px;
            margin-top: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        .location-group {
            margin-top: 20px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        @media (max-width: 768px) {
            .form-container {
                margin: 20px;
                padding: 15px;
            }
            .form-group input, .form-group textarea, .form-group select {
                font-size: 14px;
            }
            .btn-back, .btn-add-location, .btn-select-location {
                width: 100%;
                margin-bottom: 10px;
            }
        }
        #family-search {
            margin-bottom: 10px;
        }
        #family-results {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 5px;
        }
        #family-results div {
            cursor: pointer;
            padding: 5px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #family-results div:hover {
            background-color: #f8f9fa;
        }
        .family-item {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
        }
        .family-item img {
            width: 30px;
            height: 30px;
            border-radius: 50%;
        }
        .family-item span {
            flex-grow: 1;
        }
        .remove-family {
            cursor: pointer;
            color: red;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col-12">
                <a href="index.php" style="text-decoration: none;" class="btn-back mb-3">Geri Dön</a>
                <div class="form-container">
                    <h2 class="text-center mb-4">Yeni Kişi Ekle</h2>
                    <form method="POST" action="" enctype="multipart/form-data">
                        <div class="form-group">
                            <label for="name" class="form-label">Ad</label>
                            <input type="text" class="form-control" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="surname" class="form-label">Soyad</label>
                            <input type="text" class="form-control" id="surname" name="surname" required>
                        </div>
                        <div class="form-group">
                            <label for="title" class="form-label">Ünvan</label>
                            <input type="text" class="form-control" id="title" name="title" required>
                        </div>
                        <div class="form-group">
                            <label for="profession" class="form-label">Meslek</label>
                            <input type="text" class="form-control" id="profession" name="profession" required>
                        </div>
                        <div class="form-group">
                            <label for="birthDeath" class="form-label">Doğum-Ölüm</label>
                            <input type="text" class="form-control" id="birthDeath" name="birthDeath" placeholder="Örneğin: 1900-1980" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Konum Linki veya Koordinatlar</label>
                            <input type="text" class="form-control" id="locationLink" name="locationLink" placeholder="Örneğin: https://maps.google.com/?q=41.0082,28.9784">
                            <div id="mini-map"></div>
                            <button type="button" class="btn-select-location mt-2" onclick="selectLocation()">Seç</button>
                            <input type="hidden" id="selectedLat" name="selectedLat">
                            <input type="hidden" id="selectedLng" name="selectedLng">
                        </div>
                        <div class="form-group">
                            <label for="profileImage" class="form-label">Profil Resmi</label>
                            <input type="file" class="form-control" id="profileImage" name="profileImage" accept="image/*" required>
                        </div>
                        <div class="form-group">
                            <label for="coverImage" class="form-label">Kapak Fotoğrafı</label>
                            <input type="file" class="form-control" id="coverImage" name="coverImage" accept="image/*" required>
                        </div>

                        <!-- Aile Fertleri Alanı -->
                        <div class="form-group">
                            <h4>Aile Fertleri</h4>
                            <input type="text" class="form-control" id="family-search" placeholder="Aile ferdi ara...">
                            <div id="family-results"></div>
                            <div id="selected-family" class="mt-3"></div>
                            <input type="hidden" name="family" id="family-input">
                        </div>

                        <!-- Dinamik Ek Lokasyonlar -->
                        <div id="additional-locations">
                            <h4>Ek Lokasyonlar</h4>
                            <div class="location-group" id="location-0">
                                <div class="form-group">
                                    <label for="location_name_0" class="form-label">Ek Lokasyon Adı</label>
                                    <input type="text" class="form-control" id="location_name_0" name="location_name_0">
                                </div>
                                <div class="form-group">
                                    <label for="location_link_0" class="form-label">Ek Lokasyon Linki</label>
                                    <input type="text" class="form-control" id="location_link_0" name="location_link_0" placeholder="Örneğin: https://maps.google.com/?q=41.0050,28.9750">
                                    <div id="mini-map-location-0" class="mini-map-location"></div>
                                    <button type="button" class="btn-select-location mt-2" onclick="selectLocationForAdditional(0)">Seç</button>
                                    <input type="hidden" id="selectedLat-0" name="selectedLat-0">
                                    <input type="hidden" id="selectedLng-0" name="selectedLng-0">
                                </div>
                                <div class="form-group">
                                    <label for="location_year_0" class="form-label">Yapım Yılı</label>
                                    <input type="text" class="form-control" id="location_year_0" name="location_year_0">
                                </div>
                                <div class="form-group">
                                    <label for="location_detail_0" class="form-label">Detay</label>
                                    <textarea class="form-control" id="location_detail_0" name="location_detail_0"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="gallery_0" class="form-label">Galeri Resimleri</label>
                                    <input type="file" class="form-control" id="gallery_0" name="gallery_0[]" accept="image/*" multiple>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn-add-location mt-3" onclick="addLocation()">+</button>
                        <input type="hidden" name="location_count" id="location_count" value="1">

                        <button type="submit" class="btn-submit mt-4">Kişi Ekle</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script>
        // Mini Harita (Ana Konum)
        const miniMap = L.map('mini-map').setView([41.0082, 28.9784], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(miniMap);

        let marker = null;
        miniMap.on('click', (e) => {
            if (marker) miniMap.removeLayer(marker);
            marker = L.marker(e.latlng).addTo(miniMap);
        });

        function selectLocation() {
            if (marker) {
                const lat = marker.getLatLng().lat;
                const lng = marker.getLatLng().lng;
                document.getElementById('selectedLat').value = lat;
                document.getElementById('selectedLng').value = lng;
                document.getElementById('locationLink').value = `https://maps.google.com/?q=${lat},${lng}`;
            } else {
                alert('Lütfen haritadan bir konum seçin!');
            }
        }

        // Dinamik Ek Lokasyon Ekleme
        let locationCount = 1;
        function addLocation() {
            locationCount++;
            const locationDiv = document.createElement('div');
            locationDiv.className = 'location-group';
            locationDiv.id = `location-${locationCount}`;
            locationDiv.innerHTML = `
                <div class="form-group">
                    <label for="location_name_${locationCount}" class="form-label">Ek Lokasyon Adı</label>
                    <input type="text" class="form-control" id="location_name_${locationCount}" name="location_name_${locationCount}">
                </div>
                <div class="form-group">
                    <label for="location_link_${locationCount}" class="form-label">Ek Lokasyon Linki</label>
                    <input type="text" class="form-control" id="location_link_${locationCount}" name="location_link_${locationCount}" placeholder="Örneğin: https://maps.google.com/?q=41.0050,28.9750">
                    <div id="mini-map-location-${locationCount}" class="mini-map-location"></div>
                    <button type="button" class="btn-select-location mt-2" onclick="selectLocationForAdditional(${locationCount})">Seç</button>
                    <input type="hidden" id="selectedLat-${locationCount}" name="selectedLat-${locationCount}">
                    <input type="hidden" id="selectedLng-${locationCount}" name="selectedLng-${locationCount}">
                </div>
                <div class="form-group">
                    <label for="location_year_${locationCount}" class="form-label">Yapım Yılı</label>
                    <input type="text" class="form-control" id="location_year_${locationCount}" name="location_year_${locationCount}">
                </div>
                <div class="form-group">
                    <label for="location_detail_${locationCount}" class="form-label">Detay</label>
                    <textarea class="form-control" id="location_detail_${locationCount}" name="location_detail_${locationCount}"></textarea>
                </div>
                <div class="form-group">
                    <label for="gallery_${locationCount}" class="form-label">Galeri Resimleri</label>
                    <input type="file" class="form-control" id="gallery_${locationCount}" name="gallery_${locationCount}[]" accept="image/*" multiple>
                </div>
            `;
            document.getElementById('additional-locations').appendChild(locationDiv);
            document.getElementById('location_count').value = locationCount;

            // Yeni mini harita oluştur
            const additionalMap = L.map('mini-map-location-' + locationCount).setView([41.0082, 28.9784], 12);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(additionalMap);
            additionalMaps[locationCount] = additionalMap;

            // Yeni harita için tıklama eventi
            let additionalMarker = null;
            additionalMap.on('click', (e) => {
                if (additionalMarker) additionalMap.removeLayer(additionalMarker);
                additionalMarker = L.marker(e.latlng).addTo(additionalMap);
                additionalMarkers[locationCount] = additionalMarker;
            });
        }

        // Ek lokasyon için konum seçme
        let additionalMarkers = [];
        let additionalMaps = [];
        function selectLocationForAdditional(index) {
            const additionalMap = additionalMaps[index];
            const additionalMarker = additionalMarkers[index];
            if (additionalMarker) {
                const lat = additionalMarker.getLatLng().lat;
                const lng = additionalMarker.getLatLng().lng;
                document.getElementById('selectedLat-' + index).value = lat;
                document.getElementById('selectedLng-' + index).value = lng;
                document.getElementById('location_link_' + index).value = `https://maps.google.com/?q=${lat},${lng}`;
            } else {
                alert('Lütfen haritadan bir konum seçin!');
            }
        }

        // Aile fertleri arama (ad, soyad ve ünvan ile)
        let persons = <?php 
            $personsData = [];
            if (file_exists('persons.json')) {
                $personsData = json_decode(file_get_contents('persons.json'), true) ?: [];
            }
            echo json_encode(array_map(function($p) {
                return [
                    'name' => $p['name'],
                    'surname' => $p['surname'],
                    'title' => $p['title'],
                    'profileImage' => $p['profileImage'] ?? 'images/default.jpg'
                ];
            }, $personsData));
        ?>;
        document.getElementById('family-search').addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const results = document.getElementById('family-results');
            results.innerHTML = '';

            if (query) {
                const matches = persons.filter(person => 
                    (person.name.toLowerCase().includes(query) || 
                     person.surname.toLowerCase().includes(query) || 
                     person.title.toLowerCase().includes(query))
                );
                if (matches.length > 0) {
                    matches.forEach(person => {
                        const div = document.createElement('div');
                        div.innerHTML = `<img src="${person.profileImage}" alt="${person.name}" style="width: 30px; height: 30px; border-radius: 50%;"> <span>${person.name} ${person.surname} (${person.title})</span>`;
                        div.addEventListener('click', function() {
                            const selectedFamily = document.getElementById('selected-family');
                            const existing = selectedFamily.querySelectorAll('span');
                            let exists = false;
                            existing.forEach(item => {
                                if (item.textContent === `${person.name} ${person.surname} (${person.title})`) exists = true;
                            });
                            if (!exists) {
                                const familyItem = document.createElement('div');
                                familyItem.className = 'family-item';
                                familyItem.innerHTML = `<img src="${person.profileImage}" alt="Profil"> <span>${person.name} ${person.surname} (${person.title})</span> <span class="remove-family" onclick="this.parentElement.remove(); updateFamilyInput()">x</span>`;
                                selectedFamily.appendChild(familyItem);
                                updateFamilyInput();
                            }
                            results.innerHTML = '';
                            this.value = '';
                        });
                        results.appendChild(div);
                    });
                } else {
                    results.innerHTML = '<div>Aile ferdi henüz eklenmemiş.</div>';
                }
            }
        });

        function updateFamilyInput() {
            const selected = document.querySelectorAll('#selected-family .family-item span');
            const familyIds = Array.from(selected).map(span => span.textContent);
            document.getElementById('family-input').value = JSON.stringify(familyIds);
        }
    </script>
</body>
</html>