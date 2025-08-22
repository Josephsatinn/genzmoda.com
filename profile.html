<?php
// OOP uyumlu sınıf: Kişi bilgilerini tutmak için
class Person {
    public $id;
    public $name;
    public $surname;
    public $title;
    public $profession;
    public $birthDeath;
    public $locationLink; // Mezar konumu linki (örneğin Google Maps linki, koordinatlara çevrilecek)
    public $profileImage; // Profil resmi dosya yolu
    public $coverImage;   // Kapak fotoğrafı dosya yolu
    public $additionalLocations; // Ek lokasyonlar (dizi: [isim => [link, yapimYili, detay, resimler]])

    public function __construct($id, $name, $surname, $title, $profession, $birthDeath, $locationLink, $profileImage, $coverImage, $additionalLocations = []) {
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

    // Koordinatları linkten çıkarma (basit parse, gerçekte API kullanın)
    public function getCoordinates() {
        preg_match('/q=([\d\.]+),([\d\.]+)/', $this->locationLink, $matches);
        return [$matches[1] ?? 41.0082, $matches[2] ?? 28.9784]; // Varsayılan İstanbul
    }

    // Ek lokasyonların koordinatlarını alma
    public function getAdditionalCoordinates($locationLink) {
        preg_match('/q=([\d\.]+),([\d\.]+)/', $locationLink, $matches);
        return [$matches[1] ?? 41.0082, $matches[2] ?? 28.9784]; // Varsayılan İstanbul
    }
}

// Kişileri JSON dosyasından yükle
$personsData = [];
if (file_exists('persons.json')) {
    $personsData = json_decode(file_get_contents('persons.json'), true) ?: [];
}
$persons = [];
foreach ($personsData as $data) {
    $persons[$data['id']] = new Person(
        $data['id'],
        $data['name'],
        $data['surname'],
        $data['title'],
        $data['profession'],
        $data['birthDeath'],
        $data['locationLink'],
        $data['profileImage'],
        $data['coverImage'],
        $data['additionalLocations'] ?? []
    );
}

// Aile ilişkileri (örnek: kardeş)
$familyRelations = [
    0 => [2 => 'kardeş'], // Ahmet'in kardeşi Mehmet
    1 => [],
    2 => [0 => 'kardeş'], // Mehmet'in kardeşi Ahmet
];

// ID'ye göre kişi al
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$person = isset($persons[$id]) ? $persons[$id] : null;
if ($person === null) {
    die("Kişi bulunamadı.");
}

$coords = $person->getCoordinates();
?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $person->name . ' ' . $person->surname; ?> Profili</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        *,body{
            font-family: system-ui !important;
        }
        .cover {
            position: relative;
            height: 300px;
            background: url('<?php echo $person->coverImage; ?>') no-repeat center/cover;
            border-top-left-radius: 30px;
            border-top-right-radius: 30px;
        }
        .profile-img {
            position: absolute;
            bottom: -50px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 2px solid white;
            object-fit: cover;
        }
        #profile-map { height: 400px; width: 100%; margin-top: 60px; }
        .leaflet-div-icon { background: none !important; border: none !important; }
        .custom-marker {
            position: relative;
            width: 70px;
            height: 153px;
            background: url('pın.png') no-repeat center;
            background-size: contain;
            transition: transform 0.3s;
            cursor: pointer;
        }
        .custom-marker:hover { transform: scale(1.2); }
        .custom-marker img {
            position: absolute;
            top: 36%;
            left: 50%;
            transform: translateX(-50%);
            width: 29px;
            height: 29px;
            border-radius: 50%;
            object-fit: cover;
        }
        .additional-marker {
            background: url('pın.png') no-repeat center;
            background-size: contain;
        }
        .additional-marker span {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 12px;
            text-shadow: 1px 1px 2px black;
        }
        .details, .location-details {
            padding: 20px;
            border: 1px solid #ccc;
            margin-top: 20px;
        }
        .location-details {
            display: none; /* Başlangıçta gizli */
        }
        .btn-back {
            background-color: rgb(255, 255, 250);
            color: black;
            border: none;
            box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            border-radius: 5px; 
        } 
        .gallery {
            display: flex;
            flex-wrap: wrap;   
            gap: 5px;
        }
        .gallery img {
            max-width: 300px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="index.php" class="btn btn-back mb-3">Geri Dön</a>

        <div class="cover">
            <img src="<?php echo $person->profileImage; ?>" class="profile-img rounded-bottom" alt="Profil">
        </div>
        <div id="profile-map" class="rounded-5"></div>
        <div id="details" class="details">
            <h2><?php echo $person->name . ' ' . $person->surname; ?></h2>
            <p><b>Ünvan:</b> <?php echo $person->title; ?></p>
            <p><b>Meslek:</b> <?php echo $person->profession; ?></p>
            <p><b>Doğum-Ölüm:</b> <?php echo $person->birthDeath; ?></p>
        </div>
        <div id="location-details" class="location-details"></div>
        <div class="sketchfab-embed-wrapper"> 
            <iframe title="Colonial Graveyard Pack" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share width="1296" height="500" src="https://sketchfab.com/models/2d4db50601ac43859b5173a22acaa9cb/embed?autostart=1&transparent=1"> </iframe> 
            <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> 
                <a href="https://sketchfab.com/3d-models/colonial-graveyard-pack-2d4db50601ac43859b5173a22acaa9cb?utm_medium=embed&utm_campaign=share-popup&utm_content=2d4db50601ac43859b5173a22acaa9cb" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Colonial Graveyard Pack </a> 
                by <a href="https://sketchfab.com/roger3D?utm_medium=embed&utm_campaign=share-popup&utm_content=2d4db50601ac43859b5173a22acaa9cb" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> roger3D </a> 
                on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=2d4db50601ac43859b5173a22acaa9cb" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a>
            </p>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const map = L.map('profile-map').setView([<?php echo $coords[0]; ?>, <?php echo $coords[1]; ?>], 12);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Kendi marker'ı
        const personMarkerHtml = `<div class="custom-marker"><img src="<?php echo $person->profileImage; ?>" alt="<?php echo $person->name; ?>"></div>`;
        const personIcon = L.divIcon({
            html: personMarkerHtml,
            iconSize: [70, 153],
            iconAnchor: [35, 100]
        });
        const personMarker = L.marker([<?php echo $coords[0]; ?>, <?php echo $coords[1]; ?>], { icon: personIcon }).addTo(map)
            .bindTooltip('Mezar Konumu: <?php echo $person->name; ?>', { direction: 'top', sticky: true });

        // Aile ilişkilerini kontrol et ve kardeşi haritaya ekle
        <?php
        $family = $familyRelations[$id] ?? [];
        foreach ($family as $familyId => $relation) {
            if (isset($persons[$familyId])) {
                $familyPerson = $persons[$familyId];
                $familyCoords = $familyPerson->getCoordinates();
                echo "const familyMarkerHtml$familyId = `<div class='custom-marker'><img src='{$familyPerson->profileImage}' alt='{$familyPerson->name}'></div>`;";
                echo "const familyIcon$familyId = L.divIcon({ html: familyMarkerHtml$familyId, iconSize: [70, 100], iconAnchor: [35, 100] });";
                echo "const familyMarker$familyId = L.marker([{$familyCoords[0]}, {$familyCoords[1]}], { icon: familyIcon$familyId }).addTo(map)
                    .bindTooltip('{$relation}: {$familyPerson->name}', { direction: 'top', sticky: true });";
                echo "L.polyline([[{$coords[0]}, {$coords[1]}], [{$familyCoords[0]}, {$familyCoords[1]}]], { color: 'red' }).addTo(map);";
                echo "familyMarker$familyId.on('click', () => { window.location.href = 'profile.php?id={$familyId}'; });";
            }
        }
        ?>

        // Ek lokasyonları haritaya ekle
        <?php
        foreach ($person->additionalLocations as $locationName => $locationData) {
            list($locationLink, $yapimYili, $detay, $resimler) = $locationData;
            $additionalCoords = $person->getAdditionalCoordinates($locationLink);
            echo "const additionalMarkerHtml = `<div class='custom-marker additional-marker'><span style='position: absolute; top: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 12px;'>{$locationName}</span></div>`;";
            echo "const additionalIcon = L.divIcon({ html: additionalMarkerHtml, iconSize: [70, 100], iconAnchor: [35, 100] });";
            echo "const additionalMarker = L.marker([{$additionalCoords[0]}, {$additionalCoords[1]}], { icon: additionalIcon }).addTo(map)
                .bindTooltip('{$locationName}', { direction: 'top', sticky: true });";
            echo "L.polyline([[{$coords[0]}, {$coords[1]}], [{$additionalCoords[0]}, {$additionalCoords[1]}]], { color: 'blue' }).addTo(map);";
            echo "additionalMarker.on('click', () => {
                document.getElementById('details').style.display = 'none';
                let locationHtml = `
                    <h2>{$locationName}</h2>
                    <div class='gallery'>
                `;";
            foreach ($resimler as $resim) {
                echo "locationHtml += `<img src='{$resim}' alt='{$locationName}' style='max-width: 300px; margin: 10px;'>`;";
            }
            echo "locationHtml += `</div>
                    <p><b>Yapım Yılı:</b> {$yapimYili}</p>
                    <p><b>Detay:</b> {$detay}</p>
                `;
                document.getElementById('location-details').innerHTML = locationHtml;
                document.getElementById('location-details').style.display = 'block';
            });";
        }
        ?>

        // Kişi marker'ına tıklama ile geri dönme
        personMarker.on('click', () => {
            document.getElementById('location-details').style.display = 'none';
            document.getElementById('details').style.display = 'block';
        });
    </script>
</body>
</html>
