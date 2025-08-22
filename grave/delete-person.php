<?php
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['id'])) {
    $id = intval($_POST['id']);

    // Kişileri JSON dosyasından yükle
    $personsData = [];
    if (file_exists('persons.json')) {
        $personsData = json_decode(file_get_contents('persons.json'), true) ?: [];
    }

    // Belirli ID'ye sahip kişiyi kaldır
    $personsData = array_filter($personsData, function ($person) use ($id) {
        return $person['id'] != $id;
    });

    // Güncellenmiş veriyi JSON dosyasına yaz
    file_put_contents('persons.json', json_encode(array_values($personsData), JSON_PRETTY_PRINT));

    // Yönlendirme
    header("Location: index.php");
    exit();
} else {
    die("Geçersiz istek.");
}
?>