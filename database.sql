

PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    image       TEXT,
    status      TEXT NOT NULL DEFAULT 'Belum Ditangani',
    date        TEXT NOT NULL,
    user_id     INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);


CREATE TABLE IF NOT EXISTS waste_materials (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    code              TEXT NOT NULL UNIQUE,
    name              TEXT NOT NULL,
    weight_per_item   REAL,
    price_per_kg      REAL NOT NULL,
    co2_per_kg        REAL NOT NULL,
    energy_per_kg     REAL NOT NULL,
    is_weight_input   INTEGER NOT NULL DEFAULT 0
);


CREATE TABLE IF NOT EXISTS ai_waste_library (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    description  TEXT,
    material_id  INTEGER,
    unit         TEXT NOT NULL DEFAULT 'Pcs',
    FOREIGN KEY (material_id) REFERENCES waste_materials(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS repair_schedules (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_date TEXT NOT NULL,
    title         TEXT NOT NULL,
    location      TEXT,
    progress      TEXT NOT NULL DEFAULT '0%',
    status        TEXT NOT NULL DEFAULT 'Terjadwal'
);


INSERT INTO reports (lat, lng, title, description, image, status, date) VALUES
(-7.052, 112.569, 'Tumpukan Sampah Plastik',
 'Area taman kota bagian selatan dijadikan tempat pembuangan liar. Bau sangat menyengat dan mengganggu pejalan kaki.',
 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=500&q=60',
 'Belum Ditangani', '21 Juli 2026'),
(-7.056, 112.573, 'Lampu Jalan Mati',
 'Sudah 3 hari lampu penerangan jalan utama mati total, sangat berbahaya bagi pengendara roda dua di malam hari.',
 'https://images.unsplash.com/photo-1519782550186-b489cddb9933?auto=format&fit=crop&w=500&q=60',
 'Proses Perbaikan', '19 Juli 2026');



INSERT INTO waste_materials (code, name, weight_per_item, price_per_kg, co2_per_kg, energy_per_kg, is_weight_input) VALUES
('plastic',   'Botol Plastik PET', 0.02,  2500, 1.5, 15, 0),
('can',       'Kaleng Aluminium',  0.015, 17000, 9,  20, 0),
('paper',     'Kertas',            NULL,  2000, 2.8, 10, 1),
('cardboard', 'Kardus',            NULL,  2800, 3,   8,  1),
('glass',     'Pecahan Kaca / Botol', 0.3, 500, 0.8, 2, 0);



INSERT INTO ai_waste_library (name, description, material_id, unit) VALUES
('Botol Plastik PET',
 'Material termoplastik. Sering ditemukan. Dapat didaur ulang menjadi serat pakaian atau botol baru.',
 (SELECT id FROM waste_materials WHERE code = 'plastic'), 'Pcs'),
('Kaleng Aluminium',
 'Tingkat daur ulang tinggi. Sangat berharga di bank sampah karena hemat energi saat dilebur ulang.',
 (SELECT id FROM waste_materials WHERE code = 'can'), 'Pcs'),
('Kardus Bekas (Corrugated)',
 'Material kertas bergelombang. Pastikan kering dan tidak berminyak sebelum disetorkan.',
 (SELECT id FROM waste_materials WHERE code = 'cardboard'), 'Kg'),
('Pecahan Kaca / Botol',
 'Material inert. Bisa didaur ulang 100% tanpa penurunan kualitas. Pisahkan berdasarkan warna.',
 (SELECT id FROM waste_materials WHERE code = 'glass'), 'Pcs');



INSERT INTO repair_schedules (schedule_date, title, location, progress, status) VALUES
('2026-07-15', 'Penambalan Jalan Berlubang', 'Jl. Jalanin Aja Dulu', '100%', 'Selesai'),
('2026-07-22', 'Perbaikan Lampu Taman', 'Taman Kota Sembayat C', '80%', 'Proses'),
('2026-07-28', 'Pembersihan Gorong-gorong', 'Blok A, Perumahan Miami', '30%', 'Mulai'),
('2026-08-05', 'Renovasi Halte Bus', 'Halte Utama M1G', '0%', 'Terjadwal');