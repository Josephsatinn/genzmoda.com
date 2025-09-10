
// Koordinatları linkten çıkarma fonksiyonu
    function getCoordinates(locationLink) {
        if (!locationLink) {
            console.warn('Location link eksik, varsayılan koordinatlar kullanılıyor.');
            return [41.0082, 28.9784]; // Varsayılan İstanbul
        }
        const match = locationLink.match(/q=([-]?[\d.]+),([-]?[\d.]+)/);
        if (!match) {
            console.warn(`Geçersiz locationLink formatı: ${locationLink}`);
            return [41.0082, 28.9784]; // Varsayılan İstanbul
        }
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (isNaN(lat) || isNaN(lon)) {
            console.warn(`Geçersiz koordinatlar: ${locationLink}`);
            return [41.0082, 28.9784]; // Varsayılan İstanbul
        }
        return [lat, lon];
    }

    // Türkçe karakterleri Latin harflerine çeviren ve adsoyad formatında urlSlug oluşturan fonksiyon
    function createUrlSlug(name, surname) {
        const turkishToLatin = str => str
            .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
            .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
            .replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/İ/g, 'I')
            .replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/Ü/g, 'U');
        return `${turkishToLatin(name.toLowerCase())}${turkishToLatin(surname.toLowerCase())}`;
    }

    // URL'den parametreyi al (ad= olmadan)
    const urlParams = new URLSearchParams(window.location.search);
    const urlSlug = Array.from(urlParams.keys())[0] || urlParams.get('ad'); // İlk parametreyi al, yoksa ad= dene
    const id = parseInt(urlParams.get('id'));

    console.log('URL Parametreleri:', { urlSlug, id }); // Hata ayıklama için

    // Verileri yükle
    fetch('persons.json')
        .then(response => {
            if (!response.ok) throw new Error('persons.json bulunamadı: ' + response.status);
            return response.json();
        })
        .then(staticPersons => {
            const dynamicPersons = JSON.parse(localStorage.getItem('dynamicPersons') || '[]');
            const persons = [...staticPersons, ...dynamicPersons].map(person => ({
                ...person,
                urlSlug: person.urlSlug || createUrlSlug(person.name, person.surname)
            }));
            console.log('Yüklenen kişiler:', persons.map(p => ({
                id: p.id,
                name: p.name,
                surname: p.surname,
                urlSlug: p.urlSlug
            }))); // Hata ayıklama için

            let person;
            if (urlSlug) {
                console.log('Aranan urlSlug:', urlSlug);
                person = persons.find(p => p.urlSlug === urlSlug);
                if (!person) {
                    console.warn('urlSlug ile kişi bulunamadı, son ekleneni deniyoruz');
                    person = persons.filter(p => p.urlSlug === urlSlug).pop();
                }
                if (!person) {
                    console.error(`urlSlug ${urlSlug} için kişi bulunamadı`);
                }
            } else if (id) {
                console.log('Aranan ID:', id);
                person = persons.find(p => p.id === id);
                if (!person) {
                    console.error(`ID ${id} için kişi bulunamadı`);
                }
            } else {
                console.error('Ne urlSlug ne de id sağlandı');
            }

            if (!person) {
                document.getElementById('details').innerHTML = '<p>Kişi bulunamadı.</p>';
                document.title = 'Kişi Bulunamadı';
                return;
            }

            console.log('Bulunan kişi:', person); // Hata ayıklama için

            // Başlık, kapak ve profil resmi
            document.title = `${person.name} ${person.surname} Profili`;
            document.getElementById('cover').style.backgroundImage = `url('${
                person.coverImage || 'images/default.jpg'}')`;
            document.getElementById('profile-img').src = person.profileImage || 'images/default.jpg';

            // Detayları göster
            document.getElementById('details').innerHTML = `
                <h2>${person.name} ${person.surname}</h2>
                <p><b>Ünvan:</b> ${person.title || 'Belirtilmemiş'}</p>
                <p><b>Meslek:</b> ${person.profession || 'Belirtilmemiş'}</p>
                <p><b>Doğum-Ölüm:</b> ${person.birthDeath || 'Belirtilmemiş'}</p>
            `;

            // Harita başlat
            const coords = getCoordinates(person.locationLink);
            console.log('Ana koordinatlar:', coords); // Hata ayıklama için
            const map = L.map('profile-map').setView(coords, 12);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
            setTimeout(() => map.invalidateSize(), 100);

            // Kendi marker'ı
            const personMarkerHtml = `<div class="custom-marker"><img src="${
                person.profileImage || 'images/default.jpg'}" alt="${person.name}"></div>`;
            const personIcon = L.divIcon({
                html: personMarkerHtml,
                iconSize: [70, 153],
                iconAnchor: [35, 100]
            });
            const personMarker = L.marker(coords, { icon: personIcon }).addTo(map)
                .bindTooltip(`Mezar Konumu: ${person.name}`, { direction: 'top', sticky: true });

            // Aile ilişkilerini haritaya ekle
            const familyRelations = JSON.parse(localStorage.getItem('familyRelations') || '{}');
            const family = familyRelations[person.id] || {};
            console.log('Aile ilişkileri:', family); // Hata ayıklama için
            persons.forEach(familyPerson => {
                if (family[familyPerson.id]) {
                    const familyCoords = getCoordinates(familyPerson.locationLink);
                    console.log(`Aile üyesi koordinatları (${familyPerson.name}):`, familyCoords);
                    const familyMarkerHtml = `<div class="custom-marker"><img src="${
                        familyPerson.profileImage || 'images/default.jpg'}" alt="${
                        familyPerson.name}"></div>`;
                    const familyIcon = L.divIcon({
                        html: familyMarkerHtml,
                        iconSize: [70, 153],
                        iconAnchor: [35, 100]
                    });
                    const relation = family[familyPerson.id].charAt(0).toUpperCase() +
                        family[familyPerson.id].slice(1);
                    const familyMarker = L.marker(familyCoords, { icon: familyIcon }).addTo(map)
                        .bindTooltip(`${relation}: ${familyPerson.name}`, {
                            direction: 'top',
                            sticky: true
                        });
                    L.polyline([coords, familyCoords], { color: 'red' }).addTo(map);
                    familyMarker.on('click', () => {
                        window.location.href = `profile.html?${
                            familyPerson.urlSlug ||
                            createUrlSlug(familyPerson.name, familyPerson.surname)}`;
                    });
                }
            });

            // Ek lokasyonları haritaya ekle
            const additionalLocations = person.additionalLocations || {};
            console.log('Ek lokasyonlar:', additionalLocations); // Hata ayıklama için
            Object.entries(additionalLocations).forEach(([locationName, locationData]) => {
                if (!Array.isArray(locationData) || locationData.length < 4) {
                    console.warn(`Geçersiz ek lokasyon verisi: ${locationName}`, locationData);
                    return;
                }
                const [locationLink, yapimYili, detay, resimler] = locationData;
                const additionalCoords = getCoordinates(locationLink);
                console.log(`Ek lokasyon koordinatları (${locationName}):`, additionalCoords);
                const additionalMarkerHtml = `<div class="custom-marker additional-marker"><span>${
                    locationName}</span></div>`;
                const additionalIcon = L.divIcon({
                    html: additionalMarkerHtml,
                    iconSize: [70, 153],
                    iconAnchor: [35, 100]
                });
                const additionalMarker = L.marker(additionalCoords, { icon: additionalIcon }).addTo(map)
                    .bindTooltip(locationName, { direction: 'top', sticky: true });
                L.polyline([coords, additionalCoords], { color: 'blue' }).addTo(map);
                additionalMarker.on('click', () => {
                    document.getElementById('details').style.display = 'none';
                    let locationHtml = `
                        <h2>${locationName}</h2>
                        <div class="gallery">
                    `;
                    (resimler || []).forEach(resim => {
                        locationHtml += `<img src="${resim}" alt="${locationName}" style="max-width: 300px; margin: 10px;">`;
                    });
                    locationHtml += `
                        </div>
                        <p><b>Yapım Yılı:</b> ${yapimYili || 'Belirtilmemiş'}</p>
                        <p><b>Detay:</b> ${detay || 'Belirtilmemiş'}</p>
                    `;
                    document.getElementById('location-details').innerHTML = locationHtml;
                    document.getElementById('location-details').style.display = 'block';
                });
            });

            // Kişi marker'ına tıklama ile geri dönme
            personMarker.on('click', () => {
                document.getElementById('location-details').style.display = 'none';
                document.getElementById('details').style.display = 'block';
            });
        })
        .catch(error => {
            console.error('JSON yüklenirken hata:', error);
            document.getElementById('details').innerHTML = '<p>Veri yüklenirken hata oluştu.</p>';
            document.title = 'Hata';
        });
        fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Header yüklenemedi: ' + response.status);
            return response.text();
        })
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
        })
        .catch(error => {
            console.error('Header yüklenirken hata:', error);
            document.getElementById('header-container').innerHTML = '<p>Header yüklenemedi.</p>';
        });
    
    
        // Türkçe karakterleri normalize etme
        function normalizeString(str) {
            return str
                .toLowerCase()
                .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
                .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
                .replace(/%2b/g, ' ').replace(/\+/g, ' ');
        }

        // Arama işlevselliği
        function searchPersons(query, persons) {
            console.log('Arama yapılıyor:', query);
            const searchResults = document.getElementById('search-results');
            if (!searchResults) {
                console.error('Hata: search-results bulunamadı');
                return;
            }
            searchResults.innerHTML = '';
            if (!query) {
                searchResults.classList.remove('show');
                return;
            }
            const normalizedQuery = normalizeString(query);
            const matches = persons.filter(person => 
                normalizeString(`${person.name} ${person.surname}`).includes(normalizedQuery)
            );
            console.log('Eşleşen kişiler:', matches.length);
            if (matches.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item">Sonuç bulunamadı</div>';
            } else {
                matches.forEach(person => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `
                        <img src="${person.profileImage}" alt="${person.name}">
                        <div>
                            <strong><a href="/grave/profile.html?${person.urlSlug}">${
                                person.name} ${person.surname}</a></strong><br>
                            <small>${person.title || 'Bilinmiyor'} (${person.profession || 'Bilinmiyor'})</small>
                        </div>
                    `;
                    div.addEventListener('click', () => {
                        window.location.href = `/grave/profile.html?${person.urlSlug}`;
                    });
                    searchResults.appendChild(div);
                });
            }
            searchResults.classList.add('show');
            console.log('search-results gösteriliyor, öğe sayısı:', searchResults.children.length);
        }

        // Türkçe karakterleri Latin harflerine çeviren ve urlSlug oluşturan fonksiyon
        function createUrlSlug(name, surname) {
            const turkishToLatin = str => str
                .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
                .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
                .replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/İ/g, 'I')
                .replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/Ü/g, 'U');
            return `${turkishToLatin(name.toLowerCase())}${turkishToLatin(surname.toLowerCase())}`;
        }

        // Header'ı yükle ve kişi listesini oluştur
        async function loadDataAndHeader() {
            try {
                // Header'ı yükle
                const headerResponse = await fetch('/grave/header.html');
                if (!headerResponse.ok) throw new Error('Header yüklenemedi: ' + headerResponse.status);
                const headerData = await headerResponse.text();
                document.getElementById('header-container').innerHTML = headerData;
                console.log('Header yüklendi');

                // Header olaylarını bağla
                const searchInput = document.querySelector('.header-search');
                let persons = []; // Arama için kişiler global olarak erişilebilir
                if (searchInput) {
                    console.log('Arama kutusu bulundu');
                    searchInput.addEventListener('input', (e) => {
                        console.log('Arama input olayı tetiklendi:', e.target.value);
                        searchPersons(e.target.value, persons);
                    });
                    searchInput.addEventListener('blur', () => {
                        setTimeout(() => {
                            const searchResults = document.getElementById('search-results');
                            if (searchResults) searchResults.classList.remove('show');
                        }, 200);
                    });
                } else {
                    console.error('Hata: .header-search bulunam不了');
                }

                const homeLink = document.querySelector('.header-home');
                if (homeLink) {
                    homeLink.addEventListener('click', () => {
                        window.location.href = '/grave/index.html';
                    });
                }

                const profileImg = document.querySelector('.header-profile img');
                if (profileImg) {
                    profileImg.addEventListener('click', () => {
                        console.log('Profil resmine tıklandı');
                    });
                }

                // JSON dosyasını ve localStorage'ı yükle
                const response = await fetch('/grave/persons.json');
                if (!response.ok) throw new Error('persons.json bulunamadı: ' + response.status);
                const staticPersons = await response.json();

                const dynamicPersons = JSON.parse(localStorage.getItem('dynamicPersons') || '[]');
                persons = [...staticPersons, ...dynamicPersons].map(person => ({
                    ...person,
                    lat: person.locationLink && person.locationLink.match(/q=([-]?[\d.]+),([-]?[\d.]+)/) ?
                        parseFloat(person.locationLink.match(/q=([-]?[\d.]+),([-]?[\d.]+)/)[1]) :
                        41.0082,
                    lng: person.locationLink && person.locationLink.match(/q=([-]?[\d.]+),([-]?[\d.]+)/) ?
                        parseFloat(person.locationLink.match(/q=([-]?[\d.]+),([-]?[\d.]+)/)[2]) :
                        28.9784,
                    urlSlug: person.urlSlug || createUrlSlug(person.name, person.surname),
                    profileImage: person.profileImage || 'https://via.placeholder.com/30'
                }));
                console.log('Yüklenen kişiler:', persons.map(p => ({
                    id: p.id,
                    name: p.name,
                    surname: p.surname,
                    urlSlug: p.urlSlug
                })));

                // Harita başlat
                const map = L.map('map').setView([39, 35], 6);
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                // Kişileri haritaya ekle
                persons.forEach(person => {
                    const markerHtml = `<div class="custom-marker"><img src="${
                        person.profileImage}" alt="${person.name}"></div>`;
                    const customIcon = L.divIcon({
                        html: markerHtml,
                        iconSize: [50, 70],
                        iconAnchor: [25, 70]
                    });

                    const marker = L.marker([person.lat, person.lng], {
                        icon: customIcon
                    }).addTo(map);

                    marker.bindTooltip(`
                        <b>${person.name} ${person.surname}</b><br>
                        ${person.title || 'Bilinmiyor'} - ${person.profession || 'Bilinmiyor'}<br>
                        ${person.birthDeath || 'Bilinmiyor'}
                    `, {
                        direction: 'top',
                        sticky: true
                    });

                    marker.on('click', () => {
                        map.flyTo([person.lat, person.lng], 18, {
                            animate: true,
                            duration: 2
                        });
                        document.getElementById('details').innerHTML = `
                            <h2>${person.name} ${person.surname}<a href="/grave/profile.html?${
                                person.urlSlug}" class="btn btn-primary">Profile Git</a></h2>
                            <img src="${person.profileImage}" alt="Profil" style="width:200px;">
                            <p><b>Ünvan:</b> ${person.title || 'Bilinmiyor'}</p>
                            <p><b>Meslek:</b> ${person.profession || 'Bilinmiyor'}</p>
                            <p><b>Doğum-Ölüm:</b> ${person.birthDeath || 'Bilinmiyor'}</p>
                        `;
                    });
                });

                // Kişi listesini oluştur
                const personList = document.getElementById('person-list');
                if (!personList) {
                    console.error('Hata: #person-list div bulunamadı');
                    return;
                }
                personList.innerHTML = '';
                console.log('Kişi listesi oluşturuluyor, kişi sayısı:', persons.length);
                persons.forEach(person => {
                    const div = document.createElement('div');
                    div.className = 'person-item';
                    div.setAttribute('data-id', person.id);
                    div.innerHTML = `
                        <img src="${person.profileImage}" class="person-image" alt="${person.name}">
                        <div>
                            <strong><a href="/grave/profile.html?${person.urlSlug}">${
                                person.name} ${person.surname}</a></strong><br>
                            <small>${person.title || 'Bilinmiyor'} (${person.profession || 'Bilinmiyor'}) ${
                                person.birthDeath || 'Bilinmiyor'}</small>
                        </div>
                        <button class="delete-btn" onclick="deletePerson(${person.id})">Sil</button>
                    `;
                    div.addEventListener('click', () => {
                        map.flyTo([person.lat, person.lng], 18, {
                            animate: true,
                            duration: 2
                        });
                        document.getElementById('details').innerHTML = `
                            <h2>${person.name} ${person.surname}<a href="/grave/profile.html?${
                                person.urlSlug}" class="btn btn-primary">Profile Git</a></h2>
                            <img src="${person.profileImage}" alt="Profil" style="width:200px;">
                            <p><b>Ünvan:</b> ${person.title || 'Bilinmiyor'}</p>
                            <p><b>Meslek:</b> ${person.profession || 'Bilinmiyor'}</p>
                            <p><b>Doğum-Ölüm:</b> ${person.birthDeath || 'Bilinmiyor'}</p>
                        `;
                    });
                    personList.appendChild(div);
                });
                console.log('Kişi listesi oluşturuldu, DOM\'da kişi sayısı:', personList.querySelectorAll('.person-item').length);

                // Arama kutusunun mevcut değerini kontrol et
                if (searchInput && searchInput.value) {
                    console.log('Mevcut arama değeri:', searchInput.value);
                    searchPersons(searchInput.value, persons);
                }
            } catch (error) {
                console.error('Veri veya header yüklenirken hata:', error);
                document.getElementById('person-list').innerHTML = '<p>Kişiler yüklenirken hata oluştu.</p>';
            }
        }

        // Dinamik kişiyi silme
        function deletePerson(id) {
            const dynamicPersons = JSON.parse(localStorage.getItem('dynamicPersons') || '[]');
            const updatedPersons = dynamicPersons.filter(person => person.id !== id);
            localStorage.setItem('dynamicPersons', JSON.stringify(updatedPersons));

            const familyRelations = JSON.parse(localStorage.getItem('familyRelations') || '{}');
            delete familyRelations[id];
            Object.keys(familyRelations).forEach(key => {
                if (familyRelations[key][id]) {
                    delete familyRelations[key][id];
                }
            });
            localStorage.setItem('familyRelations', JSON.stringify(familyRelations));

            alert(`Kişi (ID: ${id}) silindi. Sayfayı yenileyin.`);
            window.location.reload();
        }

        // Sayfayı yüklerken verileri ve header'ı yükle
        loadDataAndHeader();
    
    