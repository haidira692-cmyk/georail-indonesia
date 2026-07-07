// 1. SETIAP KAMU UPDATE CODE, CUKUP GANTI ANGKA VERSI INI (misal: v2, v3, dst.)
const CACHE_NAME = 'georail-cache-v3.1'; 

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './dataset.js',
    './favicon.png',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet-search@3.0.2/dist/leaflet-search.min.css',
    'https://unpkg.com/leaflet-search@3.0.2/dist/leaflet-search.min.js',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
];

// Tahap Install: Unduh aset baru
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Mengunduh aset baru ke cache:', CACHE_NAME);
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            // 🌟 PAKSA AKTIF: Langsung mengaktifkan service worker baru tanpa menunggu tab ditutup
            return self.skipWaiting();
        })
    );
});

// Tahap Aktivasi: HAPUS OTOMATIS CACHE LAMA
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Menghapus otomatis cache usang:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // 🌟 KONTROL LANGSUNG: Memastikan semua halaman web terbuka langsung dikontrol oleh sw baru
            return self.clients.claim();
        })
    );
});

// Tahap Fetching (Network-First untuk file lokal agar selalu fresh jika ada internet)
self.addEventListener('fetch', event => {
    // Jalankan strategi Network-First khusus untuk index, app, dan dataset agar selalu update jika online
    if (event.request.mode === 'navigate' || event.request.url.includes('app.js') || event.request.url.includes('dataset.js')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Duplikat hasil dari internet ke cache terbaru
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                    return response;
                })
                .catch(() => caches.match(event.request)) // Jika offline, ambil dari cache
        );
    } else {
        // Cache-First untuk library luar (Leaflet) yang jarang berubah demi kecepatan
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});
