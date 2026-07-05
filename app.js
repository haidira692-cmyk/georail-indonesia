// app.js

// ==========================================
// 1. PENGATURAN AWAL PETA & BATAS ZOOM
// ==========================================
const batasIndonesia = [
    [-15.0, 94.0], 
    [10.0, 142.0]  
];

const map = L.map('map', {
    zoomControl: false, 
    minZoom: 5,                  
    maxBounds: batasIndonesia,   
    maxBoundsViscosity: 1.0      
}).setView([-2.5, 118.0], 5);

L.control.zoom({ position: 'bottomleft' }).addTo(map);

// ==========================================
// 2. DAFTAR PILIHAN PETA DASAR (BASEMAPS)
// ==========================================
const petaTerang = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors © CARTO'
});

const petaGelap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors © CARTO'
});

const petaSatelit = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Maps'
});

const petaStandar = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

petaTerang.addTo(map);

const pilihanPeta = {
    "Mode Terang": petaTerang,
    "Mode Gelap": petaGelap,
    "Mode Satelit (Label)": petaSatelit, 
    "Mode Standar": petaStandar
};

L.control.layers(pilihanPeta, null, { position: 'topright' }).addTo(map);

// ==========================================
// 3. MENAMPILKAN DATASET JALUR & STASIUN
// ==========================================
panggilSemuaDataset().then(datasets => {
    if (!datasets) return;

    // A. Jalur Aktif (Biru)
    L.geoJSON(datasets.aktif, {
        style: function () {
            return { color: '#3b82f6', weight: 3, opacity: 0.9, lineJoin: 'round' };
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.name) {
                layer.bindPopup(`<strong style="color:#2563eb;">Jalur Aktif</strong><br>${feature.properties.name}`);
            }
        }
    }).addTo(map);

    // B. Jalur Nonaktif (Merah, Putus-putus)
    L.geoJSON(datasets.nonaktif, {
        style: function () {
            return { color: '#ef4444', weight: 2.5, opacity: 0.8, dashArray: '5, 8', lineJoin: 'round' };
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.name) {
                layer.bindPopup(`<strong style="color:#ef4444;">Jalur Nonaktif</strong><br>${feature.properties.name}`);
            }
        }
    }).addTo(map);

    // ==========================================
    // MEMBUAT IKON KUSTOM UNTUK STASIUN
    // ==========================================
    const ikonStasiun = L.icon({
        iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlM1SZ4hmoXYBIlQfW54QWl1OegIdpQJNdwQXOnmHmJw&s', // Mengambil ikon dari internet
        iconSize: [20, 20],      // Ukuran ikon [lebar, tinggi] dalam pixel
        iconAnchor: [10, 10],    // Titik tumpu ikon agar pas di tengah koordinat
        popupAnchor: [0, -10]    // Titik munculnya popup (sedikit di atas ikon)
    });

    // ==========================================
    // C. STASIUN DENGAN FITUR CLUSTERING
    // ==========================================
    // Membuat grup wadah untuk menampung cluster stasiun
    const clusterStasiun = L.markerClusterGroup({
        chunkedLoading: true,        // Memuat data secara bertahap agar tidak lag
        showCoverageOnHover: false,  // Menghilangkan area batas saat kursor diarahkan
        zoomToBoundsOnClick: true    // Otomatis zoom ke area stasiun saat gelembung diklik
    });

    const layerStasiun = L.geoJSON(datasets.stasiun, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: ikonStasiun
            });
        },
        onEachFeature: function (feature, layer) {
            const namaStasiun = feature.properties.name || "Stasiun Tidak Diketahui";
            const popupContent = `
                <div style="text-align: center; min-width: 120px; padding: 5px;">
                    <strong style="font-size: 14px; color: #1f2937;">${namaStasiun}</strong>
                    <br><span style="font-size: 11px; color: #6b7280;">Stasiun Kereta Api</span>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    });

    // Memasukkan layer stasiun ke dalam grup cluster, lalu menampilkannya ke peta
    clusterStasiun.addLayer(layerStasiun);
    map.addLayer(clusterStasiun);

    // ==========================================
    // MENAMBAHKAN KONTROL PENCARIAN (SEARCH BAR)
    // ==========================================
    const searchControl = new L.Control.Search({
        layer: clusterStasiun,       // Target pencarian diubah menjadi clusterStasiun
        propertyName: 'name',
        marker: false,
        moveToLocation: function(latlng, title, map) {
            map.flyTo(latlng, 15);
        }
    });

    searchControl.on('search:locationfound', function(e) {
        e.layer.openPopup();
    });

    map.addControl(searchControl);

    // KODE BARU: Menghilangkan layar loading setelah selesai
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0'; // Animasi memudar
        setTimeout(() => {
            loadingOverlay.style.display = 'none'; // Hilang sepenuhnya
        }, 500); // Tunggu setengah detik sesuai animasi CSS
    }
});

// ==========================================
// 4. LOGIKA PERPINDAHAN HALAMAN (MENU NAVIGASI)
// ==========================================
const semuaLinks = document.querySelectorAll('.menu-link');
const semuaHalaman = document.querySelectorAll('.page-section');

semuaLinks.forEach(link => {
    link.addEventListener('click', function() {
        const targetHalamanId = this.getAttribute('data-target');

        // Hapus kelas aktif dari semua link menu
        semuaLinks.forEach(l => l.classList.remove('active'));
        // Tambahkan kelas aktif ke menu yang sedang diklik
        this.classList.add('active');

        // Sembunyikan semua halaman konten
        semuaHalaman.forEach(halaman => halaman.classList.remove('active'));
        // Tampilkan halaman konten yang dituju
        const halamanTujuan = document.getElementById(targetHalamanId);
        halamanTujuan.classList.add('active');

        // Trik Khusus Leaflet: Jika membuka halaman peta, gambar ulang ukuran peta
        if (targetHalamanId === 'maps-section') {
            setTimeout(() => {
                map.invalidateSize();
            }, 100); 
        }
    });
});