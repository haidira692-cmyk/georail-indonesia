// dataset.js

// Fungsi asinkron untuk memanggil kelima file dataset GeoJSON
async function panggilSemuaDataset() {
    try {
        // 1. Memanggil ke-5 file secara bersamaan
        const responses = await Promise.all([
            fetch('jaluraktif.geojson'),
            fetch('jalurnonaktif.geojson'),
            fetch('stasiun.geojson'),
            fetch('hotosm_idn_railways_lines_geojson.geojson'), //dataset tambahan
            fetch('hotosm_idn_railways_points_geojson.geojson') //dataset tambahan
        ]);

        // 2. Mengecek apakah semua file berhasil dimuat (status 200)
        for (const res of responses) {
            if (!res.ok) throw new Error(`Gagal memuat file, status: ${res.status}`);
        }

        // 3. Mengubah hasil panggilan menjadi format JSON
        const [aktif, nonaktif, stasiun, linesHotosm, pointsHotosm] = await Promise.all(
            responses.map(res => res.json())
        );

        // 4. Mengembalikan semua data agar bisa dipakai di app.js
        return {
            aktif,
            nonaktif,
            stasiun,
            linesHotosm,
            pointsHotosm
        };

    } catch (error) {
        console.error("Gagal memuat file dataset:", error);
        alert("Gagal memuat dataset! Pastikan nama file dan path folder sudah benar di dalam folder 'dataset/'.");
        return null; // Mengembalikan null jika gagal
    }
}
