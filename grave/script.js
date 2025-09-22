// Harita nesnelerini global olarak tanımla
let mapInstance = null;
let gravesMapInstance = null;

function getCoordinates(locationLink) {
    if (!locationLink || typeof locationLink !== 'string') {
        console.warn('Location link eksik veya geçersiz:', locationLink);
        return [41.0082, 28.9784];
    }
    const match = locationLink.match(/q=([-]?[\d.]+),([-]?[\d.]+)/);
    if (!match || match.length < 3) {
        console.warn(`Geçersiz locationLink formatı: ${locationLink}`);
        return [41.0082, 28.9784];
    }
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Geçersiz koordinatlar: ${locationLink}, lat: ${lat}, lon: ${lon}`);
        return [41.0082, 28.9784];
    }
    return [lat, lon];
}

function createUrlSlug(name, surname) {
    const turkishToLatin = str => str
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/Ç/g, 'C').replace(/Ğ/g, 'G').replace(/İ/g, 'I')
        .replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/Ü/g, 'U');
    return `${turkishToLatin((name || '').toLowerCase())}${turkishToLatin((surname || '').toLowerCase())}`;
}

function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/%2b/g, ' ').replace(/\+/g, ' ');
}

function searchPersons(query, persons, workers) {
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
    const personMatches = persons.filter(person =>
        normalizeString(`${person.name} ${person.surname}`).includes(normalizedQuery)
    );
    const workerMatches = workers.filter(worker =>
        normalizeString(`${worker.name} ${worker.surname}`).includes(normalizedQuery)
    );
    console.log('Eşleşen kişiler:', personMatches.length, 'Eşleşen çalışanlar:', workerMatches.length);
    if (personMatches.length === 0 && workerMatches.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">Sonuç bulunamadı</div>';
    } else {
        personMatches.forEach(person => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <img src="${person.profileImage}" alt="${person.name}">
                <div>
                    <strong><a href="/grave/profile.html?${person.urlSlug}">${person.name} ${person.surname}</a></strong><br>
                    <small>${person.title || 'Bilinmiyor'} (${person.profession || 'Bilinmiyor'})</small>
                </div>
            `;
            div.addEventListener('click', () => {
                window.location.href = `/grave/profile.html?${person.urlSlug}`;
            });
            searchResults.appendChild(div);
        });
        workerMatches.forEach(worker => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <img src="${worker.profileImage}" alt="${worker.name}">
                <div>
                    <strong><a href="/grave/worker-profile.html?${worker.urlSlug}">${worker.name} ${worker.surname}</a></strong><br>
                    <small>${worker.category || 'Bilinmiyor'}</small>
                </div>
            `;
            div.addEventListener('click', () => {
                window.location.href = `/grave/worker-profile.html?${worker.urlSlug}`;
            });
            searchResults.appendChild(div);
        });
    }
    searchResults.classList.add('show');
    console.log('search-results gösteriliyor, öğe sayısı:', searchResults.children.length);
}

function activateNav(btn) {
    console.log("Aktif edilen buton:", btn.textContent, "Hedef row:", btn.dataset.target);
    const currentActiveBtn = document.querySelector(".nav-btn.active");
    if (currentActiveBtn) {
        currentActiveBtn.classList.remove("active");
    }
    btn.classList.add("active");

    const indicator = document.querySelector(".nav-indicator");
    if (indicator) {
        indicator.style.width = btn.offsetWidth + "px";
        indicator.style.left = btn.offsetLeft + "px";
    } else {
        console.warn("Hata: .nav-indicator bulunamadı");
    }

    const toggleRows = document.querySelectorAll(".persons-row, .sell-grave-row, .workers-row");
    toggleRows.forEach(row => {
        row.style.display = "none";
        console.log("Gizlenen row:", row.className);
    });

    const targetRow = document.querySelector("." + btn.dataset.target);
    if (targetRow) {
        targetRow.style.display = "flex";
        console.log("Gösterilen row:", btn.dataset.target);
        setTimeout(() => {
            if (mapInstance && typeof mapInstance.invalidateSize === 'function') {
                mapInstance.invalidateSize();
                console.log("mapInstance yenilendi");
            }
            if (gravesMapInstance && typeof gravesMapInstance.invalidateSize === 'function') {
                gravesMapInstance.invalidateSize();
                console.log("gravesMapInstance yenilendi");
            }
        }, 100);
    } else {
        console.error("Hata: Hedef row bulunamadı:", btn.dataset.target);
    }

    const details = document.getElementById('details');
    if (details) {
        details.innerHTML = '';
        details.style.display = 'none';
        console.log("Detay div'i temizlendi ve gizlendi");
    }
}

async function loadDataAndHeader() {
    try {
        // Header'ı yükle
        const headerResponse = await fetch('/grave/header.html');
        if (!headerResponse.ok) throw new Error('Header yüklenemedi: ' + headerResponse.status);
        const headerData = await headerResponse.text();
        document.getElementById('header-container').innerHTML = headerData;
        console.log('Header yüklendi 154 satır ');

        // Header olaylarını bağla
        const searchInput = document.querySelector('.header-search');
        let persons = [];
        let workers = [];
        if (searchInput) {
            console.log('Arama kutusu bulundu');
            searchInput.addEventListener('input', (e) => {
                console.log('Arama input olayı tetiklendi:', e.target.value);
                searchPersons(e.target.value, persons, workers);
            });
            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    const searchResults = document.getElementById('search-results');
                    if (searchResults) searchResults.classList.remove('show');
                }, 200);
            });
        } else {
            console.error('Hata: .header-search bulunamadı');
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

        // Navbar olaylarını bağla
        const navBtns = document.querySelectorAll(".nav-btn");
        navBtns.forEach(btn => {
            if (!btn.dataset.target) {
                console.warn("Hata: Butonun data-target özniteliği eksik:", btn.textContent);
            }
            btn.addEventListener("click", e => {
                e.preventDefault();
                activateNav(btn);
            });
        });
        const activeBtn = document.querySelector(".nav-btn.active");
        if (activeBtn) {
            console.log("Sayfa yüklendi, varsayılan aktif buton:", activeBtn.textContent);
            activateNav(activeBtn);
        } else {
            console.warn("Hata: Varsayılan aktif .nav-btn bulunamadı, ilk buton aktif ediliyor");
            if (navBtns.length > 0) {
                navBtns[0].classList.add("active");
                activateNav(navBtns[0]);
            }
        }

        // Kişiler için JSON dosyasını ve localStorage'ı yükle
        let response;
        try {
            response = await fetch('/grave/persons.json');
            if (!response.ok) throw new Error('persons.json bulunamadı: ' + response.status);
        } catch (error) {
            console.warn('persons.json yüklenemedi, varsayılan veri kullanılıyor:', error);
            response = {
                json: async () => [
                    {
                        id: 1,
                        name: "Osman",
                        surname: "Gazi",
                        title: "Osmanlı'nın Kurucusu",
                        profession: "Padişah",
                        birthDeath: "1258-1326",
                        locationLink: "https://maps.google.com/?q=40.123456,29.123456",
                        profileImage: "images/osman-gazi.jpg",
                        coverImage: "images/osmangazi.png"
                    },
                    {
                        id: 2,
                        name: "Yavuz Sultan",
                        surname: "Selim",
                        title: "Selîmî",
                        profession: "Padişah",
                        birthDeath: "1470-1520",
                        locationLink: "https://www.google.com/maps?q=41.0082,28.9784",
                        profileImage: "images/ahmet.jpg",
                        coverImage: "images/kapakresim.webp"
                    },
                    {
                        id: 3,
                        name: "Fatih Sultan",
                        surname: "Mehmet",
                        title: "İstanbul'un Fatihi",
                        profession: "Padişah",
                        birthDeath: "1432-1481",
                        locationLink: "https://maps.google.com/?q=41.016793682313924,28.94845962524414",
                        profileImage: "images/mehmet.png",
                        coverImage: "images/topkapi-sarayi.webp"
                    }
                ]
            };
        }
        const staticPersons = await response.json();
        const dynamicPersons = JSON.parse(localStorage.getItem('dynamicPersons') || '[]');
        persons = [...staticPersons, ...dynamicPersons].map(person => {
            const [lat, lng] = getCoordinates(person.locationLink);
            return {
                ...person,
                lat,
                lng,
                urlSlug: person.urlSlug || createUrlSlug(person.name, person.surname),
                profileImage: person.profileImage || 'https://via.placeholder.com/30'
            };
        });
        console.log('Yüklenen kişiler:', persons.map(p => ({
            id: p.id,
            name: p.name,
            surname: p.surname,
            urlSlug: p.urlSlug,
            lat: p.lat,
            lng: p.lng,
            locationLink: p.locationLink
        })));

        // Çalışanlar için JSON dosyasını yükle
        let workerResponse;
        try {
            workerResponse = await fetch('/grave/workers.json');
            if (!workerResponse.ok) throw new Error('workers.json bulunamadı: ' + workerResponse.status);
        } catch (error) {
            console.warn('workers.json yüklenemedi, varsayılan veri kullanılıyor:', error);
            workerResponse = {
                json: async () => [
                    {
                        id: 1,
                        name: "Hasan",
                        surname: "Kaya",
                        category: "Çiçekç & Çelenk",
                        bio: "Satıcı Detay Kısmı Bu Alanda Olacak İlgili Kısa Bir Açıklama İle Kendini Tanıtacak",
                        bannerImage: "https://aydinlatma.org/wp-content/uploads/2018/04/Cicekci-Aydinlatma-1024x576.jpg",
                        profileImage: "https://images.freeimages.com/images/premium/previews/2910/29105846-male-florist-working-in-garden-center.jpg"
                    },
                    {
                        id: 2,
                        name: "Mehmet",
                        surname: "Demir",
                        category: "Hoca",
                        bio: "Hoca hakkında kısa açıklama.",
                        bannerImage: "https://img.freepik.com/free-photo/mosque-interior_181624-15495.jpg",
                        profileImage: "https://randomuser.me/api/portraits/men/32.jpg"
                    },
                    {
                        id: 3,
                        name: "Ali",
                        surname: "Çelik",
                        category: "Mezar 3D Modellemeci",
                        bio: "Modelleme yapan kişi hakkında bilgi.",
                        bannerImage: "https://img.freepik.com/free-photo/3d-rendering-modern-architecture_23-2149054493.jpg",
                        profileImage: "https://randomuser.me/api/portraits/men/45.jpg"
                    }
                ]
            };
        }
        const staticWorkers = await workerResponse.json();
        const dynamicWorkers = JSON.parse(localStorage.getItem('dynamicWorkers') || '[]');
        workers = [...staticWorkers, ...dynamicWorkers].map(worker => {
            return {
                ...worker,
                urlSlug: worker.urlSlug || createUrlSlug(worker.name, worker.surname),
                profileImage: worker.profileImage || 'https://via.placeholder.com/30',
                bannerImage: worker.bannerImage || 'https://via.placeholder.com/800x600'
            };
        });
        console.log('Yüklenen çalışanlar:', workers.map(w => ({
            id: w.id,
            name: w.name,
            surname: w.surname,
            urlSlug: w.urlSlug,
            category: w.category
        })));



        // Harita başlat (Kişiler)
        if (document.getElementById('map') && !mapInstance) {
            mapInstance = L.map('map').setView([39, 35], 6);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapInstance);
            setTimeout(() => mapInstance.invalidateSize(), 100);
        }

        if (mapInstance) {
            persons.forEach(person => {
                if (isNaN(person.lat) || isNaN(person.lng)) {
                    console.warn(`Geçersiz koordinatlar kişi için: ${person.name} ${person.surname}, locationLink: ${person.locationLink}`);
                    return;
                }
                const markerHtml = `<div class="custom-marker"><img src="${person.profileImage}" alt="${person.name}"></div>`;
                const customIcon = L.divIcon({
                    html: markerHtml,
                    iconSize: [50, 70],
                    iconAnchor: [25, 70]
                });

                const marker = L.marker([person.lat, person.lng], {
                    icon: customIcon
                }).addTo(mapInstance);

                marker.bindTooltip(`
                    <b>${person.name} ${person.surname}</b><br>
                    ${person.title || 'Bilinmiyor'} - ${person.profession || 'Bilinmiyor'}<br>
                    ${person.birthDeath || 'Bilinmiyor'}
                `, {
                    direction: 'top',
                    sticky: true
                });

                marker.on('click', () => {
                    mapInstance.flyTo([person.lat, person.lng], 18, {
                        animate: true,
                        duration: 2
                    });
                    const details = document.getElementById('details');
                    if (details) {
                        details.innerHTML = `
                            <h2>${person.name} ${person.surname}<a href="/grave/profile.html?${person.urlSlug}" class="btn btn-primary">Profile Git</a></h2>
                            <img src="${person.profileImage}" alt="Profil" style="width:200px;">
                            <p><b>Ünvan:</b> ${person.title || 'Bilinmiyor'}</p>
                            <p><b>Meslek:</b> ${person.profession || 'Bilinmiyor'}</p>
                            <p><b>Doğum-Ölüm:</b> ${person.birthDeath || 'Bilinmiyor'}</p>
                        `;
                        details.style.display = 'block';
                        console.log("Detay div'i kişi için dolduruldu ve gösterildi");
                    }
                });
            });

            const personList = document.getElementById('person-list');
            if (personList) {
                personList.innerHTML = '';
                console.log('Kişi listesi oluşturuluyor, kişi sayısı:', persons.length);
                persons.forEach(person => {
                    const div = document.createElement('div');
                    div.className = 'person-item';
                    div.setAttribute('data-id', person.id);
                    div.innerHTML = `
                        <img src="${person.profileImage}" class="person-image" alt="${person.name}">
                        <div>
                            <strong><a href="/grave/profile.html?${person.urlSlug}">${person.name} ${person.surname}</a></strong><br>
                            <small>${person.title || 'Bilinmiyor'} (${person.profession || 'Bilinmiyor'}) ${person.birthDeath || 'Bilinmiyor'}</small>
                        </div>
                        <button class="delete-btn" onclick="deletePerson(${person.id})">Sil</button>
                    `;
                    div.addEventListener('click', (e) => {
                        if (e.target.classList.contains('delete-btn')) return;
                        mapInstance.flyTo([person.lat, person.lng], 18, {
                            animate: true,
                            duration: 2
                        });
                        const details = document.getElementById('details');
                        if (details) {
                            details.innerHTML = `
                                <h2>${person.name} ${person.surname}<a href="/grave/profile.html?${person.urlSlug}" class="btn btn-primary">Profile Git</a></h2>
                                <img src="${person.profileImage}" alt="Profil" style="width:200px;">
                                <p><b>Ünvan:</b> ${person.title || 'Bilinmiyor'}</p>
                                <p><b>Meslek:</b> ${person.profession || 'Bilinmiyor'}</p>
                                <p><b>Doğum-Ölüm:</b> ${person.birthDeath || 'Bilinmiyor'}</p>
                            `;
                            details.style.display = 'block';
                            console.log("Detay div'i kişi için dolduruldu ve gösterildi");
                        }
                    });
                    personList.appendChild(div);
                });
                console.log('Kişi listesi oluşturuldu, DOM\'da kişi sayısı:', personList.querySelectorAll('.person-item').length);
            }
        }

        // Satılık mezarları yükle
        let graves = [];
        try {
            const graveResponse = await fetch('/genzmoda.com-main-backup/grave/graves.json');
            if (!graveResponse.ok) {
                console.error(`graves.json yüklenemedi, HTTP durumu: ${graveResponse.status} (${graveResponse.statusText})`);
                throw new Error('graves.json bulunamadı');
            }
            const staticGraves = await graveResponse.json();
            const dynamicGraves = JSON.parse(localStorage.getItem('dynamicGraves') || '[]');
            graves = [...staticGraves, ...dynamicGraves].map(grave => {
                const [lat, lng] = getCoordinates(grave.locationLink);
                let graveImages = Array.isArray(grave.graveImages) && grave.graveImages.length > 0 
                    ? grave.graveImages 
                    : ['https://placehold.co/200x200?text=Mezar'];
                return {
                    ...grave,
                    lat,
                    lng,
                    urlSlug: grave.urlSlug || createUrlSlug(grave.sellerName, grave.sellerSurname),
                    profileImage: grave.profileImage || 'https://placehold.co/30x30?text=Profil',
                    graveImages: graveImages
                };
            });
            console.log('Yüklenen satılık mezarlar:', graves.map(g => ({
                id: g.id,
                sellerName: g.sellerName,
                sellerSurname: g.sellerSurname,
                urlSlug: g.urlSlug,
                lat: g.lat,
                lng: g.lng,
                locationLink: g.locationLink,
                profileImage: g.profileImage,
                graveImages: g.graveImages,
                graveImageCount: g.graveImages.length
            })));
        } catch (error) {
            console.warn('Satılık mezar verileri yüklenemedi, gömülü JSON kullanılıyor:', error.message);
            const embeddedGraves = [
                {
                    id: 1,
                    sellerName: "Ali",
                    sellerSurname: "Yılmaz",
                    locationLink: "https://maps.google.com/?q=41.0135812,29.0202148,18.75",
                    price: "50,000 TL",
                    details: "Şehir merkezine yakın, bakımlı mezarlık alanı",
                    profileImage: "images/ali-yilmaz.jpg",
                    graveImages: [
                        "images/mezar2.jpg",
                        "images/mezar3.jpg",
                        "images/mezar4.jpg",
                        "images/mezar5.jpg"
                    ]
                },
                {
                    id: 2,
                    sellerName: "Ayşe",
                    sellerSurname: "Demir",
                    locationLink: "https://maps.google.com/?q=41.0515771,28.9339225,16.75",
                    price: "40,000 TL",
                    details: "Sessiz ve huzurlu bir konum",
                    profileImage: "images/ayse-demir.jpg",
                    graveImages: [
                        "images/mezar6.jpg",
                        "images/mezar7.jpg",
                        "images/mezar8.jpg",
                        "images/mezar9.jpg"
                    ]
                }
            ];
            graves = embeddedGraves.map(grave => {
                const [lat, lng] = getCoordinates(grave.locationLink);
                let graveImages = Array.isArray(grave.graveImages) && grave.graveImages.length > 0 
                    ? grave.graveImages 
                    : ['https://placehold.co/200x200?text=Mezar'];
                return {
                    ...grave,
                    lat,
                    lng,
                    urlSlug: grave.urlSlug || createUrlSlug(grave.sellerName, grave.sellerSurname),
                    profileImage: grave.profileImage || 'https://placehold.co/30x30?text=Profil',
                    graveImages: graveImages
                };
            });
            console.log('Gömülü satılık mezarlar:', graves.map(g => ({
                id: g.id,
                sellerName: g.sellerName,
                sellerSurname: g.sellerSurname,
                urlSlug: g.urlSlug,
                lat: g.lat,
                lng: g.lng,
                locationLink: g.locationLink,
                profileImage: g.profileImage,
                graveImages: g.graveImages,
                graveImageCount: g.graveImages.length
            })));
        }

        if (document.getElementById('graves-map') && !gravesMapInstance) {
            gravesMapInstance = L.map('graves-map').setView([39, 35], 6);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(gravesMapInstance);
            setTimeout(() => gravesMapInstance.invalidateSize(), 100);
        }

        if (gravesMapInstance) {
            graves.forEach(grave => {
                if (isNaN(grave.lat) || isNaN(grave.lng)) {
                    console.warn(`Geçersiz koordinatlar mezar için: ${grave.sellerName} ${grave.sellerSurname}, locationLink: ${grave.locationLink}`);
                    return;
                }
                const markerImage = grave.profileImage || 'https://placehold.co/50x50?text=Profil';
                const markerHtml = `<div class="custom-marker"><img src="${markerImage}" alt="${grave.sellerName}" onerror="this.src='https://placehold.co/50x50?text=Profil'"></div>`;
                const customIcon = L.divIcon({
                    html: markerHtml,
                    iconSize: [50, 70],
                    iconAnchor: [25, 70]
                });

                const marker = L.marker([grave.lat, grave.lng], {
                    icon: customIcon
                }).addTo(gravesMapInstance);

                const tooltipImage = grave.profileImage || 'https://placehold.co/100x100?text=Profil';
                const morePhotosText = grave.graveImages.length > 0 ? `<br><small>(${grave.graveImages.length} mezar fotoğrafı - Detayda görüntüle)</small>` : '';
                marker.bindTooltip(`
                    <b>${grave.sellerName} ${grave.sellerSurname}</b><br>
                    Fiyat: ${grave.price || 'Bilinmiyor'}<br>
                    Detay: ${grave.details || 'Bilinmiyor'}<br>
                    <img src="${tooltipImage}" alt="Profil" style="width:100px;" onerror="this.src='https://placehold.co/100x100?text=Profil'">${morePhotosText}
                `, {
                    direction: 'top',
                    sticky: true
                });

                marker.on('click', () => {
                    gravesMapInstance.flyTo([grave.lat, grave.lng], 18, {
                        animate: true,
                        duration: 2
                    });
                    const details = document.getElementById('details');
                    if (details) {
                        const profileImg = `<img src="${grave.profileImage}" alt="Profil" style="width:200px;" onerror="this.src='https://placehold.co/200x200?text=Profil'">`;
                        const graveGallery = grave.graveImages.length > 0 ? 
                            grave.graveImages.map((img, index) => 
                                `<img src="${img}" alt="Mezar Fotoğrafı ${index + 1}" style="width:150px; margin:5px; display:inline-block;" onerror="this.src='https://placehold.co/150x150?text=Mezar'">`
                            ).join('') : 
                            '<p>Mezar fotoğrafı bulunamadı.</p>';
                        details.innerHTML = `
                            <h2>${grave.sellerName} ${grave.sellerSurname}</h2>
                            ${profileImg}
                            <h3>Mezar Fotoğrafları:</h3>
                            <div class="grave-gallery">${graveGallery}</div>
                            <p><b>Fiyat:</b> ${grave.price || 'Bilinmiyor'}</p>
                            <p><b>Detay:</b> ${grave.details || 'Bilinmiyor'}</p>
                        `;
                        details.style.display = 'block';
                        console.log(`Detay div'i mezar için dolduruldu (${grave.graveImages.length} fotoğraf):`, grave.graveImages);
                    }
                });
            });

            const gravesList = document.getElementById('graves-list');
            if (gravesList) {
                gravesList.innerHTML = '';
                console.log('Satılık mezar listesi oluşturuluyor, mezar sayısı:', graves.length);
                graves.forEach(grave => {
                    const firstGraveImage = grave.graveImages[0] || 'https://placehold.co/50x50?text=Mezar';
                    const photoCount = grave.graveImages.length > 1 ? ` <small>(+${grave.graveImages.length - 1} foto)</small>` : '';
                    const div = document.createElement('div');
                    div.className = 'grave-item';
                    div.setAttribute('data-id', grave.id);
                    div.innerHTML = `
                        <img src="${grave.profileImage}" class="grave-image" alt="${grave.sellerName}" title="${grave.graveImages.length} fotoğraf" onerror="this.src='https://placehold.co/50x50?text=Mezar'">
                        <div>
                            <strong>${grave.sellerName} ${grave.sellerSurname}${photoCount}</strong><br>
                            <small>Fiyat: ${grave.price || 'Bilinmiyor'} - ${grave.details || 'Bilinmiyor'}</small>
                        </div>
                        <button class="delete-btn" onclick="deleteGrave(${grave.id})">Sil</button>
                    `;
                    div.addEventListener('click', (e) => {
                        if (e.target.classList.contains('delete-btn')) return;
                        gravesMapInstance.flyTo([grave.lat, grave.lng], 18, {
                            animate: true,
                            duration: 2
                        });
                        const details = document.getElementById('details');
                        if (details) {
                            const profileImg = `<img src="${grave.profileImage}" alt="Profil" style="border: 1px solid black; border-radius: 50%; width: 100px; height: 100px; object-fit: cover;" onerror="this.src='https://placehold.co/200x200?text=Profil'">`;
                            const graveGallery = grave.graveImages.length > 0 ? 
                                grave.graveImages.map((img, index) => 
                                    `<img src="${img}" alt="Mezar Fotoğrafı ${index + 1}" style="width: 150px; height: 150px; object-fit: cover; align-self: anchor-center; margin: 5px; display: inline-block; border: 3px solid #8080803b; border-radius: 10px;" onerror="this.src='https://placehold.co/150x150?text=Mezar'">`).join('') : 
                                '<p>Mezar fotoğrafı bulunamadı.</p>';
                            details.innerHTML = `
                                ${profileImg}
                                <br></br>
                                <h2 style="float: left;">${grave.sellerName} ${grave.sellerSurname}</h2>
                                <br></br>
                                <div class="grave-gallery">${graveGallery}</div>
                                <p><b>Fiyat:</b> ${grave.price || 'Bilinmiyor'}</p>
                                <p><b>Detay:</b> ${grave.details || 'Bilinmiyor'}</p>
                            `;
                            details.style.display = 'block';
                            console.log(`Detay div'i mezar için dolduruldu (${grave.graveImages.length} fotoğraf):`, grave.graveImages);
                        }
                    });
                    gravesList.appendChild(div);
                });
                console.log('Satılık mezar listesi oluşturuldu, DOM\'da mezar sayısı:', gravesList.querySelectorAll('.grave-item').length);
            }
        }

        // Çalışanlar için filtre listesini ve kartları doldur
        const filterList = document.getElementById('filterList');
        const workerGrid = document.getElementById('workerGrid');
        if (filterList && workerGrid) {
            filterList.innerHTML = '';
            workerGrid.innerHTML = '';
            console.log('Çalışanlar listesi oluşturuluyor, çalışan sayısı:', workers.length);

            // Benzersiz kategorileri al
            const categories = [...new Set(workers.map(worker => worker.category))];
            categories.forEach(category => {
                const div = document.createElement('div');
                div.className = 'filter-item';
                div.setAttribute('data-value', category);
                div.innerText = category;
                filterList.appendChild(div);
            });

            // Çalışan kartlarını oluştur
            workers.forEach(worker => {
                const div = document.createElement('div');
                div.className = 'worker-wrapper';
                div.setAttribute('data-category', worker.category);
                div.innerHTML = `
                    <div class="worker-banner">
                        <canvas style="background-image:url('${worker.bannerImage}');"></canvas>
                    </div>
                    <div class="worker-details">
                        <div class="worker-dp">
                            <canvas style="background-image:url('${worker.profileImage}');"></canvas>
                        </div>
                        <div class="worker-name">
                            <h2>${worker.name} ${worker.surname}<span>${worker.category}</span></h2>
                        </div>
                        <div class="worker-button"><a href="/grave/worker-profile.html?${worker.urlSlug}">İletişime Geç</a></div>
                        <div class="worker-bio"><p>${worker.bio || 'Bilinmiyor'}</p></div>
                    </div>
                `;
                workerGrid.appendChild(div);
            });

            // Filtreleme ve arama olaylarını bağla
            const filterItems = document.querySelectorAll(".filter-item");
            const workerWrappers = document.querySelectorAll(".worker-wrapper");
            const sidebarSearch = document.getElementById("sidebarSearch");
            const contentSearch = document.getElementById("contentSearch");

            sidebarSearch.addEventListener("input", () => {
                const term = sidebarSearch.value.toLowerCase();
                filterItems.forEach(item => {
                    const text = item.innerText.toLowerCase();
                    item.style.display = text.includes(term) ? "block" : "none";
                });
            });

            function applyFilters() {
                const activeFilters = Array.from(filterItems)
                    .filter(f => f.classList.contains("active"))
                    .map(f => f.dataset.value.toLowerCase());
                const searchText = contentSearch.value.toLowerCase();

                workerWrappers.forEach(worker => {
                    const category = worker.dataset.category.toLowerCase();
                    const text = worker.innerText.toLowerCase();
                    const matchesFilter = activeFilters.length === 0 || activeFilters.includes(category);
                    const matchesSearch = searchText.length === 0 || text.includes(searchText);

                    if (matchesFilter && matchesSearch) {
                        worker.classList.remove("fade-out");
                        worker.classList.add("fade-in");
                    } else {
                        worker.classList.remove("fade-in");
                        worker.classList.add("fade-out");
                    }
                });
            }

            filterItems.forEach(item => {
                item.addEventListener("click", () => {
                    item.classList.toggle("active");
                    applyFilters();
                });
            });

            contentSearch.addEventListener("input", applyFilters);
            console.log('Çalışanlar listesi ve filtreleme olayları bağlandı');
        }

        if (searchInput && searchInput.value) {
            console.log('Mevcut arama değeri:', searchInput.value);
            searchPersons(searchInput.value, persons, workers);
        }
    } catch (error) {
        console.error('Veri veya header yüklenirken hata:', error);
        if (document.getElementById('person-list')) {
            document.getElementById('person-list').innerHTML = '<p>Kişiler yüklenirken hata oluştu.</p>';
        }
        if (document.getElementById('graves-list')) {
            document.getElementById('graves-list').innerHTML = '<p>Satılık mezarlar yüklenirken hata oluştu.</p>';
        }
        if (document.getElementById('workerGrid')) {
            document.getElementById('workerGrid').innerHTML = '<p>Çalışanlar yüklenirken hata oluştu.</p>';
        }
    }
}

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

function deleteGrave(id) {
    const dynamicGraves = JSON.parse(localStorage.getItem('dynamicGraves') || '[]');
    const updatedGraves = dynamicGraves.filter(grave => grave.id !== id);
    localStorage.setItem('dynamicGraves', JSON.stringify(updatedGraves));

    alert(`Mezar (ID: ${id}) silindi. Sayfayı yenileyin.`);
    window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    loadDataAndHeader();
});

async function loadProfileData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlSlug = Array.from(urlParams.keys())[0] || urlParams.get('ad');
        const id = parseInt(urlParams.get('id'));

        console.log('URL Parametreleri:', { urlSlug, id });

        const response = await fetch('/grave/persons.json');
        if (!response.ok) throw new Error('persons.json bulunamadı: ' + response.status);
        const staticPersons = await response.json();
        const dynamicPersons = JSON.parse(localStorage.getItem('dynamicPersons') || '[]');
        const persons = [...staticPersons, ...dynamicPersons].map(person => {
            const [lat, lng] = getCoordinates(person.locationLink);
            return {
                ...person,
                lat,
                lng,
                urlSlug: person.urlSlug || createUrlSlug(person.name, person.surname)
            };
        });

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

        console.log('Bulunan kişi:', person);

       

        document.title = `${person.name} ${person.surname} Profili`;
        if (document.getElementById('cover')) {
            document.getElementById('cover').style.backgroundImage = `url('${person.coverImage || 'images/default.jpg'}')`;
        }
        if (document.getElementById('profile-img')) {
            document.getElementById('profile-img').src = person.profileImage || 'images/default.jpg';
        }

        if (document.getElementById('details')) {
            document.getElementById('details').innerHTML = `
                <h2>${person.name} ${person.surname}</h2>
                <p><b>Ünvan:</b> ${person.title || 'Belirtilmemiş'}</p>
                <p><b>Meslek:</b> ${person.profession || 'Belirtilmemiş'}</p>
                <p><b>Doğum-Ölüm:</b> ${person.birthDeath || 'Belirtilmemiş'}</p>
                <p><b>Hakkında:</b> ${person.about || 'Belirtilmemiş'}</p>
            `;
        }

        if (document.getElementById('profile-map')) {
            if (isNaN(person.lat) || isNaN(person.lng)) {
                console.warn(`Geçersiz koordinatlar profil için: ${person.name} ${person.surname}, locationLink: ${person.locationLink}`);
                person.lat = 41.0082;
                person.lng = 28.9784;
            }
            const map = L.map('profile-map').setView([person.lat, person.lng], 12);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
            setTimeout(() => map.invalidateSize(), 100);

            const personMarkerHtml = `<div class="custom-marker"><img src="${person.profileImage || 'images/default.jpg'}" alt="${person.name}"></div>`;
            const personIcon = L.divIcon({
                html: personMarkerHtml,
                iconSize: [70, 100],
                iconAnchor: [35, 68]
            });
            const personMarker = L.marker([person.lat, person.lng], { icon: personIcon }).addTo(map)
                .bindTooltip(`Mezar Konumu: ${person.name}`, { direction: 'top', sticky: true });

            const familyRelations = JSON.parse(localStorage.getItem('familyRelations') || '{}');
            const family = familyRelations[person.id] || {};
            console.log('Aile ilişkileri:', family);
            persons.forEach(familyPerson => {
                if (family[familyPerson.id]) {
                    if (isNaN(familyPerson.lat) || isNaN(familyPerson.lng)) {
                        console.warn(`Geçersiz koordinatlar aile üyesi için: ${familyPerson.name} ${familyPerson.surname}`);
                        return;
                    }
                    const familyMarkerHtml = `<div class="custom-marker"><img src="${familyPerson.profileImage || 'images/default.jpg'}" alt="${familyPerson.name}"></div>`;
                    const familyIcon = L.divIcon({
                        html: familyMarkerHtml,
                        iconSize: [70, 100],
                        iconAnchor: [35, 68]
                    });
                    const relation = family[familyPerson.id].charAt(0).toUpperCase() +
                        family[familyPerson.id].slice(1);
                    const familyMarker = L.marker([familyPerson.lat, familyPerson.lng], { icon: familyIcon }).addTo(map)
                        .bindTooltip(`${relation}: ${familyPerson.name}`, {
                            direction: 'top',
                            sticky: true
                        });
                    L.polyline([[person.lat, person.lng], [familyPerson.lat, familyPerson.lng]], { color: 'red' }).addTo(map);
                    familyMarker.on('click', () => {
                        window.location.href = `profile.html?${familyPerson.urlSlug || createUrlSlug(familyPerson.name, familyPerson.surname)}`;
                    });
                }
            });

            const additionalLocations = person.additionalLocations || {};
            console.log('Ek lokasyonlar:', additionalLocations);
            Object.entries(additionalLocations).forEach(([locationName, locationData]) => {
                if (!Array.isArray(locationData) || locationData.length < 4) {
                    console.warn(`Geçersiz ek lokasyon verisi: ${locationName}`, locationData);
                    return;
                }
                const [locationLink, yapimYili, detay, resimler] = locationData;
                const [lat, lng] = getCoordinates(locationLink);
                if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`Geçersiz koordinatlar ek lokasyon için: ${locationName}, locationLink: ${locationLink}`);
                    return;
                }
                const additionalMarkerHtml = `<div class="custom-marker additional-marker"><span>${locationName}</span></div>`;
                const additionalIcon = L.divIcon({
                    html: additionalMarkerHtml,
                    iconSize: [70, 153],
                    iconAnchor: [35, 50]
                });
                const additionalMarker = L.marker([lat, lng], { icon: additionalIcon }).addTo(map)
                    .bindTooltip(locationName, { direction: 'top', sticky: true });
                const polyline = L.polyline([[person.lat, person.lng], [lat, lng]], { color: 'blue' }).addTo(map);
                additionalMarker.on('click', () => {
                    polyline.setStyle({ opacity: 0 });
                    map.flyTo([lat, lng], 18, { animate: true, duration: 2 });
                    map.once('moveend', () => {
                        polyline.setStyle({ opacity: 1 });
                    });
                    document.getElementById('details').style.display = 'none';
                    let locationHtml = `
                        <h2>${locationName}</h2>
                        <div class="gallery">
                    `;
                    (resimler || []).forEach(resim => {
                        locationHtml += `<img src="${resim}" alt="${locationName}" style="max-width: 20%; margin: 10px;">`;
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

            personMarker.on('click', () => {
                document.getElementById('location-details').style.display = 'none';
                document.getElementById('details').style.display = 'block';
            });
        }
    } catch (error) {
        console.error('JSON yüklenirken hata:', error);
        if (document.getElementById('details')) {
            document.getElementById('details').innerHTML = '<p>Veri yüklenirken hata oluştu.</p>';
        }
        document.title = 'Hata';
    }
}

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

function deleteGrave(id) {
    const dynamicGraves = JSON.parse(localStorage.getItem('dynamicGraves') || '[]');
    const updatedGraves = dynamicGraves.filter(grave => grave.id !== id);
    localStorage.setItem('dynamicGraves', JSON.stringify(updatedGraves));

    alert(`Mezar (ID: ${id}) silindi. Sayfayı yenileyin.`);
    window.location.reload();
}

if (window.location.pathname.includes('profile.html')) {
    loadProfileData();
} else {
    loadDataAndHeader();
}
