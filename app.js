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

    // ==========================================
    // 3. MENAMPILKAN DATASET JALUR & STASIUN
    // ==========================================
    panggilSemuaDataset().then(datasets => {
        if (!datasets) return;

        // 🌟 LOGIKA HITUNG OTOMATIS UNTUK DASHBOARD STATISTIK
        try {
            const totalStasiun = datasets.stasiun.features ? datasets.stasiun.features.length : 0;
            const totalAktif = datasets.aktif.features ? datasets.aktif.features.length : 0;
            const totalNonaktif = datasets.nonaktif.features ? datasets.nonaktif.features.length : 0;

            // Update teks ke widget dashboard di index.html jika elemennya ada
            if(document.getElementById("stat-stasiun")) document.getElementById("stat-stasiun").innerText = totalStasiun + " Titik";
            if(document.getElementById("stat-aktif")) document.getElementById("stat-aktif").innerText = totalAktif + " Segmen";
            if(document.getElementById("stat-nonaktif")) document.getElementById("stat-nonaktif").innerText = totalNonaktif + " Segmen";
        } catch (err) {
            console.error("Gagal memproses statistik dashboard:", err);
        }

        // A. Jalur Aktif (Biru) dengan Detail Tabel Mini
        const layerJalurAktif = L.geoJSON(datasets.aktif, {
            style: function () {
                return { color: '#3b82f6', weight: 4, opacity: 0.9, lineJoin: 'round' };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    const namaJalur = feature.properties.name || "Jalur Tanpa Nama";
                    const tipeJalur = feature.properties.railway || "rail";
                    
                    const kontenPopup = `
                        <div style="font-family: sans-serif; min-width: 180px;">
                            <h4 style="margin: 0 0 8px 0; color: #2563eb; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Track Aktif</h4>
                            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                                <tr><td style="padding: 3px 0; color: #6b7280;">Rute:</td><td style="font-weight: bold; text-align: right;">${namaJalur}</td></tr>
                                <tr><td style="padding: 3px 0; color: #6b7280;">Kategori:</td><td style="text-align: right; text-transform: capitalize;">${tipeJalur}</td></tr>
                                <tr><td style="padding: 3px 0; color: #6b7280;">Status:</td><td style="color: #16a34a; font-weight: bold; text-align: right;">Beroperasi</td></tr>
                            </table>
                        </div>
                    `;
                    layer.bindPopup(kontenPopup);
                }
            }
        }).addTo(map);

        // B. Jalur Nonaktif (Merah, Putus-putus) dengan Detail Historis
        const layerJalurNonaktif = L.geoJSON(datasets.nonaktif, {
            style: function () {
                return { color: '#ef4444', weight: 3, opacity: 0.8, dashArray: '6, 8', lineJoin: 'round' };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    const namaJalur = feature.properties.name || "Jalur Sejarah / Tanpa Nama";
                    const tipeJalur = feature.properties.railway || "abandoned";
                    
                    const kontenPopup = `
                        <div style="font-family: sans-serif; min-width: 180px;">
                            <h4 style="margin: 0 0 8px 0; color: #dc2626; border-bottom: 2px solid #ef4444; padding-bottom: 4px;">Track Sejarah</h4>
                            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                                <tr><td style="padding: 3px 0; color: #6b7280;">Rute:</td><td style="font-weight: bold; text-align: right;">${namaJalur}</td></tr>
                                <tr><td style="padding: 3px 0; color: #6b7280;">Kategori:</td><td style="text-align: right; text-transform: capitalize;">${tipeJalur}</td></tr>
                                <tr><td style="padding: 3px 0; color: #6b7280;">Status:</td><td style="color: #dc2626; font-weight: bold; text-align: right;">Nonaktif (Heritage)</td></tr>
                            </table>
                        </div>
                    `;
                    layer.bindPopup(kontenPopup);
                }
            }
        }).addTo(map);

        // Membuat ikon kustom untuk stasiun
        const ikonStasiun = L.icon({
            iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlM1SZ4hmoXYBIlQfW54QWl1OegIdpQJNdwQXOnmHmJw&s',
            iconSize: [20, 20],      
            iconAnchor: [10, 10],    
            popupAnchor: [0, -10]    
        });

        // C. STASIUN DENGAN FITUR CLUSTERING & POPOP FOTO INTERAKTIF
        const clusterStasiun = L.markerClusterGroup({
            chunkedLoading: true,        
            showCoverageOnHover: false,  
            zoomToBoundsOnClick: true    
        });

        const layerStasiun = L.geoJSON(datasets.stasiun, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: ikonStasiun });
            },
            onEachFeature: function (feature, layer) {
                const namaStasiun = feature.properties.name || "Stasiun Tidak Diketahui";
                const operator = feature.properties.operator || "PT Kereta Api Indonesia";
                
                // Ambil koordinat langsung dari GeoJSON mentah agar tidak error undefined
                const lon = feature.geometry.coordinates[0];
                const lat = feature.geometry.coordinates[1];

                // TAMPILAN POP-UP BARU: BERSIH, MINIMALIS, DAN ANTI-ERROR
                const popupContent = `
                    <div style="font-family: sans-serif; width: 180px; padding: 5px; text-align: center;">
                        <strong style="font-size: 13px; color: #1e3a8a; display: block; margin-bottom: 2px;">${namaStasiun}</strong>
                        <span style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 8px;">${operator}</span>
                        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank" 
                        style="display: inline-block; width: 100%; background: #2563eb; color: white; text-decoration: none; font-size: 11px; font-weight: bold; padding: 5px 0; border-radius: 4px; text-align: center;">
                        🧭 Petunjuk Arah (Maps)
                        </a>
                    </div>
                `;
                layer.bindPopup(popupContent, { maxWidth: 200 });
            }
        });

        clusterStasiun.addLayer(layerStasiun);
        map.addLayer(clusterStasiun);

        // ==========================================
        // D. KONTROL FILTER OVERLAY & CONTROL SEARCH
        // ==========================================
        const daftarOverlayData = {
            "Jalur Kereta Aktif": layerJalurAktif,
            "Jalur Kereta Nonaktif": layerJalurNonaktif,
            "Titik Stasiun": clusterStasiun
        };

        L.control.layers(pilihanPeta, daftarOverlayData, { 
            position: 'bottomleft', // <-- Mengganti tema & filter layer sekarang pindah ke kiri bawah
            collapsed: true 
        }).addTo(map);

        // KONTROL PENCARIAN YANG SUDAH DIPERBAIKI (HANYA SATU SAKLAR DATA)
        const searchControl = new L.Control.Search({
            layer: clusterStasiun,       
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

        // Menghilangkan layar loading setelah selesai tanpa hambatan
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0'; 
            setTimeout(() => {
                loadingOverlay.style.display = 'none'; 
            }, 500); 
        }

        // Pindahkan elemen dashboard masuk ke sistem kontrol peta Leaflet di Kanan Atas
        const kontrolDashboard = L.control({ position: 'topright' });
        kontrolDashboard.onAdd = function() {
            const elemenDashboard = document.getElementById("stats-dashboard");
            L.DomEvent.disableClickPropagation(elemenDashboard);
            L.DomEvent.disableScrollPropagation(elemenDashboard);
            return elemenDashboard;
        };
        kontrolDashboard.addTo(map);
    });

    // ==========================================
    // 4. LOGIKA PERPINDAHAN HALAMAN (MENU NAVIGASI)
    // ==========================================
    const semuaLinks = document.querySelectorAll('.menu-link');
    const semuaHalaman = document.querySelectorAll('.page-section');

    semuaLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetHalamanId = this.getAttribute('data-target');

            semuaLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            semuaHalaman.forEach(halaman => halaman.classList.remove('active'));
            const halamanTujuan = document.getElementById(targetHalamanId);
            halamanTujuan.classList.add('active');

            if (targetHalamanId === 'maps-section') {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100); 
            }
        });
    });

    // ==========================================
    // 5. KONTROL UTREACH GPS & RESET HOME VIEW
    // ==========================================
    const wadahTombolKustom = L.control({ position: 'bottomleft' });

    wadahTombolKustom.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-custom-control-container');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '8px';

        div.innerHTML = `
            <button onclick="kembaliKeAwal()" title="Kembali ke Tampilan Awal" style="background:white; border:none; width:36px; height:36px; cursor:pointer; font-size:16px; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center;">🏠</button>
            <button onclick="temukanLokasiSaya()" title="Cari Lokasi Saya" style="background:white; border:none; width:36px; height:36px; cursor:pointer; font-size:16px; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center;">🎯</button>
        `;
        return div;
    };
    wadahTombolKustom.addTo(map);

    let markerPengguna = null;

    function temukanLokasiSaya() {
        map.locate({ setView: true, maxZoom: 15 });
    }

    map.on('locationfound', function(e) {
        if (markerPengguna) {
            map.removeLayer(markerPengguna);
        }
        markerPengguna = L.circleMarker(e.latlng, {
            radius: 9,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
            weight: 3
        }).addTo(map);

        markerPengguna.bindPopup("<div style='text-align:center;'><strong>Anda berada di sini!</strong></div>").openPopup();
    });

    map.on('locationerror', function() {
        if (typeof tampilkanPopup === "function") {
            tampilkanPopup("Gagal melacak lokasi. Pastikan izin GPS aktif.", null);
        } else {
            alert("Gagal melacak lokasi perangkat.");
        }
    });

    function kembaliKeAwal() {
        map.flyTo([-2.5, 118.0], 5, { animate: true, duration: 1.2 });
    }