class SmartCityEngine {
    constructor() {
        this.particleContainer = document.getElementById('nature-particles');
        this.birdContainer = document.getElementById('birds-container');
        this.scrollY = window.scrollY;
        this.isMobile = window.innerWidth < 768;
        this.resizeDebounce = null;

        this.config = {
            leafCount: window.innerWidth < 768 ? 10 : 25,
            birdCount: window.innerWidth < 768 ? 3 : 7
        };

        if (document.getElementById('eco-premium-bg')) {
            this.init();
        }
    }

    init() {
        this.createLeaves();
        this.createBirds();
        this.createStars();
        this.addEventListeners();
        
        this.applyParallax();
    }

    createLeaves() {
        if (!this.particleContainer) return;
        for (let i = 0; i < this.config.leafCount; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'tiny-leaf';
            
            const startX = Math.random() * window.innerWidth;
            const duration = Math.random() * 10 + 10;
            const delay = Math.random() * 5;
            const size = Math.random() * 0.5 + 0.5;
            
            leaf.style.left = `${startX}px`;
            leaf.style.top = `-20px`;
            leaf.style.transform = `scale(${size})`;
            
            const animName = `fall-${i}`;
            const keyframes = `
                @keyframes ${animName} {
                    0% { transform: translate(0, 0) rotate(0deg) scale(${size}); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.6; }
                    100% { transform: translate(${Math.random() > 0.5 ? 150 : -150}px, ${window.innerHeight}px) rotate(${Math.random() * 360 + 360}deg) scale(${size}); opacity: 0; }
                }
            `;
            const style = document.createElement('style');
            style.innerHTML = keyframes;
            document.head.appendChild(style);

            leaf.style.animation = `${animName} ${duration}s linear infinite`;
            leaf.style.animationDelay = `${delay}s`;
            
            this.particleContainer.appendChild(leaf);
        }
    }

    createBirds() {
        if (!this.birdContainer) return;
        for (let i = 0; i < this.config.birdCount; i++) {
            const bird = document.createElement('div');
            bird.className = 'flying-bird';
            
            const startY = Math.random() * 100;
            const duration = Math.random() * 15 + 15;
            
            bird.style.top = `${startY}px`;
            bird.style.left = `-50px`;
            
            const animName = `fly-${i}`;
            const keyframes = `
                @keyframes ${animName} {
                    0% { transform: translateX(0) translateY(0) scale(1); }
                    50% { transform: translateX(${window.innerWidth / 2}px) translateY(-20px) scale(0.8); }
                    100% { transform: translateX(${window.innerWidth + 100}px) translateY(10px) scale(1); }
                }
            `;
            const style = document.createElement('style');
            style.innerHTML = keyframes;
            document.head.appendChild(style);

            bird.style.animation = `${animName} ${duration}s linear infinite`;
            bird.style.animationDelay = `${Math.random() * 10}s`;
            
            this.birdContainer.appendChild(bird);
        }
    }

    createStars() {
        const starContainer = document.querySelector('.stars-container');
        if (!starContainer) return;
        
        const starCount = window.innerWidth < 768 ? 10 : 18;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.width = (Math.random() * 1.2 + 0.8) + 'px';
            star.style.height = star.style.width;
            star.style.backgroundColor = '#F5F1E8';
            star.style.borderRadius = '50%';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 45 + '%';
            star.style.opacity = Math.random() * 0.4 + 0.15;
            star.style.animation = `pulseDot ${Math.random() * 4 + 3}s infinite alternate`;
            starContainer.appendChild(star);
        }
    }

    addEventListeners() {
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.applyParallax();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });

        const handleViewportChange = () => {
            this.isMobile = window.innerWidth < 768;
            this.applyParallax();
        };
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeDebounce);
            this.resizeDebounce = setTimeout(handleViewportChange, 150);
        });
        window.addEventListener('orientationchange', handleViewportChange);
    }

    applyParallax() {
        const layers = document.querySelectorAll('#eco-premium-bg [data-speed]');
        const maxParallaxScroll = this.isMobile ? 420 : 700;
        const speedMultiplier = this.isMobile ? 0.55 : 1;
        const effectiveScroll = Math.min(this.scrollY, maxParallaxScroll);
        layers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed'));
            if (!speed) return; 
            const yPos = -(effectiveScroll * speed * speedMultiplier);
            layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    }
}

(function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('mobileMenuIcon');
    if (!btn || !menu) return;

    function closeMenu() {
        menu.classList.add('hidden');
        menu.classList.remove('flex');
        btn.setAttribute('aria-expanded', 'false');
        if (icon) { icon.classList.remove('fa-xmark'); icon.classList.add('fa-bars'); }
    }
    function openMenu() {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        btn.setAttribute('aria-expanded', 'true');
        if (icon) { icon.classList.remove('fa-bars'); icon.classList.add('fa-xmark'); }
    }

    btn.addEventListener('click', () => {
        const isOpen = !menu.classList.contains('hidden');
        isOpen ? closeMenu() : openMenu();
    });

    menu.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) closeMenu();
    });
})();

let mapInstance;
let selectedCoordinates = null;
let selectedReportImage = null;
let currentPanelReportId = null;
let currentPanelReport = null;
let temporaryMarker = null;

let communityReports = [
    {
        id: 1, lat: -7.052, lng: 112.569,
        title: "Tumpukan Sampah Plastik",
        desc: "Area taman kota bagian selatan dijadikan tempat pembuangan liar. Bau sangat menyengat dan mengganggu pejalan kaki.",
        img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=500&q=60",
        status: "Belum Ditangani", date: "21 Juli 2026"
    },
    {
        id: 2, lat: -7.056, lng: 112.573,
        title: "Lampu Jalan Mati",
        desc: "Sudah 3 hari lampu penerangan jalan utama mati total, sangat berbahaya bagi pengendara roda dua di malam hari.",
        img: "https://images.unsplash.com/photo-1519782550186-b489cddb9933?auto=format&fit=crop&w=500&q=60",
        status: "Proses Perbaikan", date: "19 Juli 2026"
    }
];

const wasteData = {
    plastic: { weightPerItem: 0.02, pricePerKg: 2500, co2PerKg: 1.5, energyPerKg: 15 },
    can: { weightPerItem: 0.015, pricePerKg: 17000, co2PerKg: 9, energyPerKg: 20 },
    paper: { isWeightInput: true, pricePerKg: 2000, co2PerKg: 2.8, energyPerKg: 10 },
    cardboard: { isWeightInput: true, pricePerKg: 2800, co2PerKg: 3, energyPerKg: 8 },
    glass: { weightPerItem: 0.3, pricePerKg: 500, co2PerKg: 0.8, energyPerKg: 2 },
    electronic: { isWeightInput: true, pricePerKg: 3000, co2PerKg: 20, energyPerKg: 40 }
};

let videoStream = null;
let isCameraActive = false;
let currentScannedItem = null;

const SCANNER_CONFIDENCE_THRESHOLD = 0.40; 
const SCANNER_TICK_MS = 700;
const SCANNER_PREDICTIONS_PER_TICK = 8;
const SCANNER_STABILITY_TICKS = 2;
const SCANNER_CLASS_KEYWORDS = {
    plastic: [
        'pop bottle', 'soda bottle', 'water bottle', 'plastic bag',
        'pill bottle', 'water jug', 'measuring cup', 'shopping basket',
        'bucket', 'pitcher, ewer',
        'milk can', 'whiskey jug', 'mixing bowl', 'soup bowl'
    ],
    can: [
        'tin can', 'beer can', 'soda can'
    ],
    paper: [
        'book jacket, dust cover, dust jacket, dust wrapper', 'menu',
        'binder, ring-binder', 'envelope', 'paper towel',
        'toilet tissue, toilet paper, bathroom tissue'
    ],
    cardboard: [
        'carton', 'cardboard box', 'packet', 'corrugated', 'crate', 'shoe box'
    ],
    glass: [
        'beer bottle', 'wine bottle', 'red wine', 'beer glass', 'goblet', 'vase',
        'cocktail shaker', 'coffee mug',
        'sunglasses, dark glasses, shades', 'sunglass',
        'beaker'
    ],
    electronic: [
        'cellular telephone, cellular phone, cellphone, cell, mobile phone',
        'iPod', 'laptop, laptop computer', 'notebook, notebook computer', 'desktop computer',
        'computer keyboard, keypad', 'mouse, computer mouse',
        'remote control, remote', 'digital watch', 'modem',
        'hard disc, hard disk, fixed disk', 'cassette player',
        'CD player', 'radio, wireless', 'joystick',
        'screen, CRT screen', 'dial telephone, dial phone', 'printer',
        'pay-phone, pay-station'
    ]
};

let mobilenetModel = null;
let isModelLoading = false;
let scannerInferenceTimer = null;
let isInferenceTickRunning = false;
let isDetectionLocked = false;
let lockedDetection = null;
let stableWasteStreakId = null;
let stableWasteStreakCount = 0;

const aiWasteLibrary = [
    { id: 'plastic', name: 'Botol Plastik PET', desc: 'Material termoplastik. Sering ditemukan. Dapat didaur ulang menjadi serat pakaian atau botol baru.', data: wasteData.plastic, unit: 'Pcs' },
    { id: 'can', name: 'Kaleng Aluminium', desc: 'Tingkat daur ulang tinggi. Sangat berharga di bank sampah karena hemat energi saat dilebur ulang.', data: wasteData.can, unit: 'Pcs' },
    { id: 'paper', name: 'Kertas / Buku Bekas', desc: 'Kertas, buku, atau majalah bekas. Pisahkan dari kardus (lebih tipis, tidak bergelombang) dan pastikan kering sebelum disetorkan.', data: wasteData.paper, unit: 'Kg' },
    { id: 'cardboard', name: 'Kardus Bekas (Corrugated)', desc: 'Material kertas bergelombang. Pastikan kering dan tidak berminyak sebelum disetorkan.', data: wasteData.cardboard, unit: 'Kg' },
    { id: 'glass', name: 'Pecahan Kaca / Botol', desc: 'Material inert. Bisa didaur ulang 100% tanpa penurunan kualitas. Pisahkan berdasarkan warna.', data: wasteData.glass, unit: 'Pcs' },
    { id: 'electronic', name: 'Sampah Elektronik (E-waste)', desc: 'Mengandung logam & komponen berbahaya — jangan dicampur sampah biasa atau bank sampah umum. Setorkan ke drop-box e-waste resmi terdekat. Nilai & berat di bawah ini hanya perkiraan kasar.', data: wasteData.electronic, unit: 'Kg' }
];


document.addEventListener('DOMContentLoaded', async () => {
    AOS.init({ offset: 120, duration: 800, easing: 'ease-out-cubic', once: false, mirror: true });
    initScrollFeatures();
    initThemeToggle();
    initCalendar(); 
    await initInteractiveMap(); 
    initWeeklyChallenge();
    startSiteTimeTracker();
    renderNearbySection();

    new SmartCityEngine();
});

const weeklyChallenges = {
    'kalkulator': {
        title: '🧮 Coba Kalkulator Sampah',
        desc: 'Masukkan minimal satu jenis sampah di Kalkulator untuk melihat estimasi nilai & dampaknya.',
        type: 'event',
        link: '#page-calculator',
        cta: 'Buka Kalkulator'
    },
    'artikel': {
        title: '📖 Baca 1 Artikel Edukasi',
        desc: 'Buka salah satu artikel di Pusat Edukasi dan baca sampai selesai.',
        type: 'event',
        link: '#page-edukasi',
        cta: 'Buka Pusat Edukasi'
    },
    'jelajah': {
        title: '⏱️ Jelajahi Situs 5 Menit',
        desc: 'Habiskan waktu 5 menit menjelajahi fitur-fitur KotaKu — berjalan otomatis di latar belakang.',
        type: 'timer',
        targetSeconds: 300,
        link: null,
        cta: null
    }
};

function challengeKey(id) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((now - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    return `ecohub_challenge_${id}_${now.getFullYear()}_w${weekNum}`;
}

function initWeeklyChallenge() {
    const select = document.getElementById('challengeSelect');
    if (!select) return;
    const activeId = localStorage.getItem('ecohub_active_challenge') || 'kalkulator';
    select.value = activeId;
    renderChallenge(activeId);
}

function switchChallenge(id) {
    localStorage.setItem('ecohub_active_challenge', id);
    renderChallenge(id);
}

function markChallengeDone(id) {
    const key = challengeKey(id);
    if (localStorage.getItem(key) === 'done') return;
    localStorage.setItem(key, 'done');
    if (document.getElementById('challengeSelect')?.value === id) {
        renderChallenge(id);
    }
}

function renderChallenge(id) {
    const data = weeklyChallenges[id];
    const descEl = document.getElementById('challengeDesc');
    const btn = document.getElementById('challengeBtn');
    if (!data || !descEl || !btn) return;

    descEl.textContent = data.desc;

    if (data.type === 'timer') {
        const seconds = parseInt(localStorage.getItem(challengeKey(id))) || 0;
        updateChallengeUI(seconds, data.targetSeconds, null, null, true);
    } else {
        const done = localStorage.getItem(challengeKey(id)) === 'done';
        updateChallengeUI(done ? 1 : 0, 1, data.link, data.cta, false);
    }
}

function updateChallengeUI(progress, target, link, ctaLabel, isTimer) {
    const bar = document.getElementById('challengeBar');
    const text = document.getElementById('challengeProgressText');
    const btn = document.getElementById('challengeBtn');
    if (!bar || !text || !btn) return;

    const ratio = Math.min(progress / target, 1);
    bar.style.width = `${ratio * 100}%`;

    if (progress >= target) {
        text.textContent = 'Tantangan selesai! 🎉';
        btn.classList.add('hidden');
    } else {
        text.textContent = isTimer
            ? `${Math.floor(progress / 60)} menit ${progress % 60} detik / 5 menit`
            : 'Belum dimulai — terdeteksi otomatis';
        if (link) {
            btn.classList.remove('hidden');
            btn.href = link;
            btn.innerHTML = `${ctaLabel} <i class="fa-solid fa-arrow-right"></i>`;
        } else {
            btn.classList.add('hidden');
        }
    }
}

function startSiteTimeTracker() {
    setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        const data = weeklyChallenges.jelajah;
        const key = challengeKey('jelajah');
        let seconds = parseInt(localStorage.getItem(key)) || 0;
        if (seconds >= data.targetSeconds) return;
        seconds += 1;
        localStorage.setItem(key, seconds);
        if (document.getElementById('challengeSelect')?.value === 'jelajah') {
            updateChallengeUI(seconds, data.targetSeconds, null, null, true);
        }
    }, 1000);
}

const fallbackReports = [
    { title: 'Tumpukan Sampah Plastik', status: 'Belum Ditangani', lat: -7.052, lng: 112.569 },
    { title: 'Lampu Jalan Mati', status: 'Proses Perbaikan', lat: -7.056, lng: 112.573 }
];
const bankSampahPoint = { title: 'Bank Sampah Terdekat', status: 'BankSampah', lat: -7.049, lng: 112.575 };

function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m) {
    if (m == null) return '';
    return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

function renderNearbySection() {
    const list = document.getElementById('nearbyList');
    if (!list) return;

    const baseReports = (communityReports && communityReports.length > 0) ? communityReports : fallbackReports;
    const points = [...baseReports.filter(r => typeof r.lat === 'number' && typeof r.lng === 'number'), bankSampahPoint];

    if (!navigator.geolocation) {
        renderNearbyList(points.slice(0, 3), 'unsupported');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            const withDistance = points
                .map(r => ({ ...r, distanceM: haversineMeters(latitude, longitude, r.lat, r.lng) }))
                .sort((a, b) => a.distanceM - b.distanceM)
                .slice(0, 3);
            renderNearbyList(withDistance, 'known');
        },
        () => renderNearbyList(points.slice(0, 3), 'denied'),
        { timeout: 6000, maximumAge: 300000 }
    );
}

function renderNearbyList(items, locationStatus) {
    const list = document.getElementById('nearbyList');
    if (!list) return;
    const dotColor = { 'Belum Ditangani': 'bg-amber-500', 'Proses Perbaikan': 'bg-blue-500', 'Selesai': 'bg-emerald-500', 'BankSampah': 'bg-teal-500' };

    const rows = items.map(r => `
        <li class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-2 truncate">
                <span class="w-2 h-2 rounded-full shrink-0 ${dotColor[r.status] || 'bg-slate-400'}"></span>
                <span class="truncate">${r.title}</span>
            </span>
            <span class="text-xs text-adaptive-muted shrink-0">${r.distanceM != null ? formatDistance(r.distanceM) : '—'}</span>
        </li>`).join('');

    const note = locationStatus === 'denied'
        ? `<li class="text-[11px] text-adaptive-muted italic pt-1">Izinkan akses lokasi di browser untuk jarak akurat</li>`
        : locationStatus === 'unsupported'
        ? `<li class="text-[11px] text-adaptive-muted italic pt-1">Browser ini tidak mendukung deteksi lokasi</li>`
        : '';

    list.innerHTML = rows + note;
}

async function fetchCommunityReports() {
    try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Gagal mengambil data laporan');
        const rows = await res.json();
        communityReports = rows.map(r => ({
            id: r.id,
            lat: r.lat,
            lng: r.lng,
            title: r.title,
            desc: r.description,
            img: r.image,
            status: r.status,
            date: r.date,
            user_id: r.user_id
        }));
    } catch (err) {
        console.error('Tidak bisa memuat laporan dari server, pakai data kosong.', err);
        communityReports = [];
    }
}

async function initInteractiveMap() {
    const mapElement = document.getElementById('interactive-map');
    if (!mapElement) return;

    const streetMode = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    const satelliteMode = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    mapInstance = L.map('interactive-map', {
        center: [-7.054, 112.571], 
        zoom: 15,
        layers: [streetMode] 
    });

    const baseMaps = {
        "🗺️ Mode Jalan": streetMode,
        "🛰️ Mode Satelit": satelliteMode
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(mapInstance);

    await fetchCommunityReports();
    renderAllReports();

    mapInstance.on('click', function(e) {
        selectedCoordinates = e.latlng;

        if (temporaryMarker) {
            temporaryMarker.setLatLng(selectedCoordinates);
        } else {
            const tempIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });
            temporaryMarker = L.marker(selectedCoordinates, {icon: tempIcon}).addTo(mapInstance);
        }

        const btnTrigger = document.getElementById('btnTriggerReport');
        btnTrigger.classList.remove('hidden');
        btnTrigger.classList.add('flex');
    });

    document.getElementById('input-rep-img').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
            alert('Format foto harus PNG, JPG, WEBP, atau GIF.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const MAX = 1000;
                let w = img.width, h = img.height;
                if (w > h && w > MAX) { h = Math.round(h * (MAX / w)); w = MAX; }
                else if (h > MAX) { w = Math.round(w * (MAX / h)); h = MAX; }

                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);

                selectedReportImage = canvas.toDataURL('image/jpeg', 0.82);
                document.getElementById('img-preview').src = selectedReportImage;
                document.getElementById('preview-container').classList.remove('hidden');
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

let reportMarkersLayer = null;

function renderAllReports() {
    const reportIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
    });

    if (reportMarkersLayer) {
        mapInstance.removeLayer(reportMarkersLayer);
    }
    reportMarkersLayer = L.layerGroup().addTo(mapInstance);

    communityReports.forEach(report => {
        const marker = L.marker([report.lat, report.lng], {icon: reportIcon}).addTo(reportMarkersLayer);
        
        marker.bindTooltip(report.title, { direction: 'top', offset: [0, -35] });

        marker.on('click', () => {
            document.getElementById('report-empty-state').classList.add('hidden');
            document.getElementById('report-detail-data').classList.remove('hidden');
            document.getElementById('report-detail-data').classList.add('flex');

            currentPanelReportId = report.id;
            currentPanelReport = report;
            updateDeleteButtonVisibility(report);
            document.getElementById('panel-rep-img').src = report.img;
            document.getElementById('panel-rep-title').innerText = report.title;
            document.getElementById('panel-rep-date').innerText = report.date;
            document.getElementById('panel-rep-desc').innerText = report.desc;
            document.getElementById('panel-rep-coords').innerHTML = `<i class="fa-solid fa-location-dot mr-1"></i> ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`;
            
            const statusBadge = document.getElementById('panel-rep-status');
            statusBadge.innerText = report.status;
            if(report.status === "Proses Perbaikan") {
                statusBadge.className = "absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md";
            } else if(report.status === "Selesai") {
                statusBadge.className = "absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md";
            } else {
                statusBadge.className = "absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md";
            }
        });
    });
}

function updateDeleteButtonVisibility(report) {
    const btn = document.getElementById('panel-rep-delete-btn');
    if (!btn) return;
    const isOwner = Boolean(plCurrentUser) && Boolean(report) && report.user_id === plCurrentUser.id;
    const canDelete = isAdminMode || isOwner;
    btn.classList.toggle('hidden', !canDelete);
}

async function handleDeleteReport() {
    if (!currentPanelReportId) return;

    const title = document.getElementById('panel-rep-title').innerText;
    if (!confirm(`Yakin mau menghapus laporan "${title}"? Tindakan ini tidak bisa dibatalkan.`)) {
        return;
    }

    const token = plGetToken();
    if (!token) {
        alert('Kamu harus masuk terlebih dahulu untuk menghapus laporan ini.');
        return;
    }

    const headers = { 'Authorization': 'Bearer ' + token };

    const btn = document.getElementById('panel-rep-delete-btn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghapus...';

    try {
        const res = await fetch(`/api/reports/${currentPanelReportId}`, {
            method: 'DELETE',
            headers
        });

        if (res.status === 401 || res.status === 403) {
            const data = await res.json().catch(() => ({}));
            alert(data.error || 'Kamu tidak diizinkan menghapus laporan ini.');
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            return;
        }
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Gagal menghapus laporan');
        }

        document.getElementById('report-detail-data').classList.add('hidden');
        document.getElementById('report-detail-data').classList.remove('flex');
        document.getElementById('report-empty-state').classList.remove('hidden');
        currentPanelReportId = null;
        currentPanelReport = null;

        await fetchCommunityReports();
        renderAllReports();
    } catch (err) {
        alert('Laporan gagal dihapus: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

function openReportModal() {
    if (!plRequireLoginForReport()) return;
    if (!selectedCoordinates) return;
    
    document.getElementById('modal-coords').innerText = `Lat: ${selectedCoordinates.lat.toFixed(5)} | Lng: ${selectedCoordinates.lng.toFixed(5)}`;
    const modal = document.getElementById('reportModal');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.children[0].classList.remove('scale-95'); }, 10);
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.add('opacity-0');
    modal.children[0].classList.add('scale-95');

    setTimeout(() => { 
        modal.classList.remove('flex'); 
        modal.classList.add('hidden'); 
    }, 300);

    selectedReportImage = null;
    document.getElementById('input-rep-img').value = '';
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('img-preview').src = '';
}

async function submitReport() {
    if (!plRequireLoginForReport()) return;

    const title = document.getElementById('input-rep-title').value;
    const desc = document.getElementById('input-rep-desc').value;

    if(!title || !desc || !selectedCoordinates) {
        alert("Harap isi judul dan deskripsi terlebih dahulu!");
        return;
    }

    const today = new Date();
    const dateString = `${today.getDate()} ${["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][today.getMonth()]} ${today.getFullYear()}`;

    const payload = {
        lat: selectedCoordinates.lat,
        lng: selectedCoordinates.lng,
        title: title,
        description: desc,
        image: selectedReportImage || "",
        status: "Laporan Baru",
        date: dateString
    };

    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = plGetToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/reports', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Gagal mengirim laporan');
        }
    } catch (err) {
        alert('Laporan gagal dikirim: ' + err.message);
        return;
    }

    if (temporaryMarker) {
        mapInstance.removeLayer(temporaryMarker);
        temporaryMarker = null;
    }
    document.getElementById('btnTriggerReport').classList.add('hidden');

    closeReportModal();
    selectedReportImage = null;
    document.getElementById('input-rep-title').value = '';
    document.getElementById('input-rep-desc').value = '';
    document.getElementById('input-rep-img').value = '';
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('img-preview').src = '';

    await fetchCommunityReports();
    renderAllReports();

    alert("Laporan berhasil disimpan ke database!");
}

function syncTailwindDarkClass() {
    const isLight = document.body.classList.contains('light-mode');
    document.documentElement.classList.toggle('dark', !isLight);
}

function initThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    syncTailwindDarkClass();
    if (document.body.classList.contains('light-mode')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        syncTailwindDarkClass();
        if (document.body.classList.contains('light-mode')) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    });
}

const articleLibrary = {
    'zero-waste': {
        title: 'Strategi Zero Waste di Lingkungan Rumah',
        tag: 'Manajemen Limbah',
        tagColor: 'bg-emerald-500',
        img: 'assets/img/zero-waste.jpeg',
        body: [
            'Gaya hidup zero waste berfokus pada pengurangan sampah yang berakhir di tempat pembuangan akhir (TPA) melalui prinsip 5R: Refuse (menolak), Reduce (mengurangi), Reuse (memakai ulang), Recycle (mendaur ulang), dan Rot (mengomposkan).',
            'Langkah paling praktis di rumah adalah memilah sampah sejak dari sumbernya menjadi tiga kategori utama: organik, anorganik bernilai jual (plastik, kertas, logam), dan residu. Pemilahan ini mempermudah proses daur ulang di bank sampah maupun fasilitas pengolahan.',
            'Selain itu, kebiasaan sederhana seperti membawa tas belanja sendiri, memakai wadah isi ulang, dan mengolah sisa makanan menjadi kompos dapat memangkas volume sampah rumah tangga secara signifikan dalam jangka panjang.'
        ],
        refs: [
            { text: 'Ekonomi Sirkular (Kementerian LHK)', url: 'https://kemenlh.go.id/contents/18/Ekonomi-Sirkular' },
            { text: 'Pengelolaan Sampah Berbasis Ekonomi Sirkular (Kemenkeu RI)', url: 'https://kpbu.kemenkeu.go.id/read/1220-1758/umum/kajian-opini-publik/pengelolaan-sampah-berbasis-ekonomi-sirkular-dan-implikasinya-bagi-indonesia' },
            { text: 'Program Pengelolaan Sampah Organik (Kemenkeu RI)', url: 'https://www.kemenkeu.go.id/informasi-publik/publikasi/berita-utama/Program-Pengelolaan-Sampah-Organik-%281%29' }
        ]
    },
    'smart-city-iot': {
        title: 'Implementasi IoT untuk Smart City',
        tag: 'Teknologi Kota',
        tagColor: 'bg-blue-500',
        img: 'assets/img/smart-city.jpg',
        body: [
            'Internet of Things (IoT) memungkinkan berbagai perangkat di kota — dari sensor kualitas udara, tong sampah pintar, hingga lampu jalan — saling terhubung dan mengirim data secara real-time ke pusat kendali kota.',
            'Dalam konteks pengelolaan sampah, sensor level pada tong sampah dapat memberi tahu petugas kapan sebuah lokasi perlu diangkut, sehingga rute pengangkutan menjadi lebih efisien dan mengurangi emisi kendaraan operasional.',
            'Data yang terkumpul dari jaringan IoT juga membantu pemerintah kota membuat kebijakan berbasis bukti (data-driven policy), misalnya menentukan titik rawan penumpukan sampah atau kemacetan yang butuh intervensi infrastruktur.'
        ],
        refs: [
            { text: 'Mengenal Lebih Dekat Dengan Konsep Smart City (Telkom University)', url: 'https://telkomuniversity.ac.id/mengenal-lebih-dekat-dengan-konsep-smart-city/' },
            { text: 'Kementerian Komunikasi dan Digital RI — Gerakan Menuju Smart City', url: 'https://www.telkom.co.id/sites/berita/id_ID/news/living-lab-smart-city-nusantara-dukung-digitalisasi-kotakabupaten-di-indonesia-992' },
            { text: 'Smart City Nusantara (MyTEnS)', url: 'https://mytens.co.id/government/smart-city-nusantara' }
        ]
    },
    'energi-terbarukan': {
        title: 'Transisi Menuju Energi Terbarukan',
        tag: 'Energi Hijau',
        tagColor: 'bg-amber-500',
        img: 'assets/img/energi-terbarukan.jpeg',
        body: [
            'Energi terbarukan seperti surya, angin, air, dan biomassa menawarkan alternatif yang lebih bersih dibanding bahan bakar fosil, dengan emisi karbon yang jauh lebih rendah sepanjang siklus hidupnya.',
            'Pada skala komunitas, panel surya atap dan turbin angin berskala kecil dapat dipasang di fasilitas umum seperti balai warga atau taman kota untuk memenuhi kebutuhan listrik penerangan dan perangkat publik.',
            'Keberhasilan transisi energi juga bergantung pada edukasi warga mengenai efisiensi konsumsi listrik, sehingga investasi infrastruktur energi hijau dapat memberikan dampak maksimal bagi keberlanjutan kota.'
        ],
        refs: [
            { text: 'Kementerian ESDM RI — Rencana Umum Energi Nasional', url: 'https://www.esdm.go.id/' },
            { text: 'IRENA — Renewable Energy Statistics', url: 'https://www.irena.org/Data' },
        
        ]
    }
};

function openArticle(id) {
    const article = articleLibrary[id];
    if (!article) return;

    document.getElementById('article-img').src = article.img;
    document.getElementById('article-img').alt = article.title;
    const tagEl = document.getElementById('article-tag');
    tagEl.textContent = article.tag;
    tagEl.className = `absolute top-3 left-3 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider backdrop-blur-sm ${article.tagColor}`;
    document.getElementById('article-title').textContent = article.title;

    const bodyEl = document.getElementById('article-body');
    bodyEl.innerHTML = article.body.map(p => `<p>${p}</p>`).join('');

    const refsEl = document.getElementById('article-refs');
    refsEl.innerHTML = article.refs.map(r =>
        `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-500 hover:underline inline-flex items-center gap-1"><i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> ${r.text}</a></li>`
    ).join('');

    const modal = document.getElementById('articleModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    });
    document.body.style.overflow = 'hidden';

    if (typeof markChallengeDone === 'function') markChallengeDone('artikel');
}

function closeArticle() {
    const modal = document.getElementById('articleModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    document.body.style.overflow = '';
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function initScrollFeatures() {
    gsap.registerPlugin(ScrollTrigger);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById("scrollBar").style.width = scrolled + "%";
        
        const navbar = document.getElementById("navbar");
        if (winScroll > 50) {
            navbar.style.backdropFilter = "blur(30px)";
            navbar.style.boxShadow = "0 4px 30px rgba(0,0,0,0.2)";
        } else {
            navbar.style.backdropFilter = "blur(12px)";
            navbar.style.boxShadow = "none";
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if(targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

async function toggleCamera() {
    const videoElement = document.getElementById('cameraFeed');
    const cameraOffState = document.getElementById('cameraOffState');
    const arOverlay = document.getElementById('arOverlay');
    const btnToggle = document.getElementById('btnToggleCamera');
    const status = document.getElementById('cameraStatus');

    if (!isCameraActive) {
        try {
            status.innerText = "MEMINTA IZIN KAMERA...";

            if (!videoStream || videoStream.getTracks().every(t => t.readyState === 'ended')) {
                videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
            }

            videoElement.srcObject = videoStream;
            videoElement.classList.remove('hidden');
            cameraOffState.classList.add('hidden');
            arOverlay.classList.remove('hidden');

            isCameraActive = true;

            btnToggle.innerHTML = '<i class="fa-solid fa-video-slash"></i> Tutup Kamera';
            btnToggle.classList.replace('bg-slate-800', 'bg-red-600/80');
            btnToggle.classList.replace('hover:bg-slate-700', 'hover:bg-red-500');

            resetScannerState();

            await ensureScannerModelLoaded();
            if (isCameraActive && !isDetectionLocked) startInferenceLoop();

        } catch (err) {
            console.error("Akses kamera ditolak atau gagal:", err);
            status.innerText = "AKSES DITOLAK";
            alert("Gagal mengakses kamera. Pastikan perangkat memiliki kamera dan telah memberi izin di browser.");
        }
    } else {
        stopInferenceLoop();

        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        videoStream = null;
        videoElement.srcObject = null;
        videoElement.classList.add('hidden');
        cameraOffState.classList.remove('hidden');
        arOverlay.classList.add('hidden');

        isCameraActive = false;

        btnToggle.innerHTML = '<i class="fa-solid fa-video"></i> Buka Kamera';
        btnToggle.classList.replace('bg-red-600/80', 'bg-slate-800');
        btnToggle.classList.replace('hover:bg-red-500', 'hover:bg-slate-700');

        resetScannerState();
        status.innerText = "KAMERA NONAKTIF";
    }
}

async function ensureScannerModelLoaded() {
    if (mobilenetModel || isModelLoading) return;
    isModelLoading = true;

    const status = document.getElementById('cameraStatus');
    const btnScan = document.getElementById('btnRealScan');
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> MEMUAT MODEL AI...';
    btnScan.disabled = true;
    btnScan.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        if (typeof tf === 'undefined' || typeof mobilenet === 'undefined') {
            throw new Error('Pustaka TensorFlow.js/MobileNet gagal dimuat dari CDN (mungkin diblokir jaringan/firewall).');
        }
        if (typeof tf.loadGraphModel !== 'function') {
            throw new Error('tf.loadGraphModel tidak ditemukan. Kemungkinan besar Content-Security-Policy server belum mengizinkan \'unsafe-eval\' (lihat server.js -> helmet -> contentSecurityPolicy -> scriptSrc), bukan masalah versi/CDN.');
        }

        const fetchedUrls = [];
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : (input && input.url) || String(input);
            const entry = { url, status: 'pending' };
            fetchedUrls.push(entry);
            return originalFetch.call(window, input, init).then(
                (res) => { entry.status = 'HTTP ' + res.status; return res; },
                (err) => { entry.status = 'GAGAL: ' + err.message; throw err; }
            );
        };
        try {
            mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        } finally {
            window.fetch = originalFetch;
            console.log('[EcoHub AI] URL yang dicoba diunduh saat memuat model:', fetchedUrls);
            window.__ecohubLastModelFetches = fetchedUrls;
        }
    } catch (err) {
        console.error('Gagal memuat model AI:', err);
        status.innerText = "GAGAL MEMUAT MODEL AI";
        let urlDetail = '';
        if (window.__ecohubLastModelFetches && window.__ecohubLastModelFetches.length) {
            urlDetail = '\n\nURL yang dicoba:\n' + window.__ecohubLastModelFetches
                .map(f => '- ' + f.url + ' -> ' + f.status)
                .join('\n');
        } else {
            urlDetail = '\n\n(Tidak ada request model.json yang sempat tercatat — gagal sebelum proses unduh model dimulai.)';
        }
        alert('Gagal memuat model AI.\n\nDetail: ' + (err && err.message ? err.message : err) + urlDetail + '\n\nPeriksa koneksi internet Anda (pastikan cdn.jsdelivr.net, unpkg.com & storage.googleapis.com tidak diblokir firewall/antivirus), lalu coba buka kamera lagi.');
    } finally {
        isModelLoading = false;
    }
}

function startInferenceLoop() {
    if (isDetectionLocked || !mobilenetModel || !isCameraActive) return;
    stopInferenceLoop(); 
    updateScannerStatus('searching');
    scannerInferenceTimer = setInterval(runInferenceTick, SCANNER_TICK_MS);
}

function stopInferenceLoop() {
    if (scannerInferenceTimer) {
        clearInterval(scannerInferenceTimer);
        scannerInferenceTimer = null;
    }
    isInferenceTickRunning = false;
}

async function runInferenceTick() {
    if (isDetectionLocked || isInferenceTickRunning || !isCameraActive || !mobilenetModel) return;
    isInferenceTickRunning = true;

    const videoElement = document.getElementById('cameraFeed');
    updateScannerStatus('analyzing');

    try {
        const predictions = await mobilenetModel.classify(videoElement, SCANNER_PREDICTIONS_PER_TICK);
        if (isDetectionLocked) return; 

        renderDebugPredictions(predictions);

        const match = mapPredictionToWaste(predictions);

        if (match && match.probability >= SCANNER_CONFIDENCE_THRESHOLD) {
            if (match.item.id === stableWasteStreakId) {
                stableWasteStreakCount++;
            } else {
                stableWasteStreakId = match.item.id;
                stableWasteStreakCount = 1;
            }

            if (stableWasteStreakCount >= SCANNER_STABILITY_TICKS) {
                lockDetection(match);
            } else {
                updateScannerStatus('confirming');
            }
        } else {
            stableWasteStreakId = null;
            stableWasteStreakCount = 0;
            updateScannerStatus('searching');
        }
    } catch (err) {
        console.error('Inferensi AI gagal:', err);
    } finally {
        isInferenceTickRunning = false;
    }
}

function matchLabelToWaste(label) {
    const lower = label.toLowerCase();
    for (const [wasteId, keywords] of Object.entries(SCANNER_CLASS_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return aiWasteLibrary.find(w => w.id === wasteId) || null;
        }
    }
    return null;
}

function mapPredictionToWaste(predictions) {
    const scoreByWasteId = {};
    const topPredictionByWasteId = {};

    for (const pred of predictions) {
        const item = matchLabelToWaste(pred.className);
        if (!item) continue;

        scoreByWasteId[item.id] = (scoreByWasteId[item.id] || 0) + pred.probability;
        if (!topPredictionByWasteId[item.id] || pred.probability > topPredictionByWasteId[item.id].probability) {
            topPredictionByWasteId[item.id] = { className: pred.className, probability: pred.probability };
        }
    }

    let bestWasteId = null;
    let bestScore = 0;
    for (const [wasteId, score] of Object.entries(scoreByWasteId)) {
        if (score > bestScore) {
            bestScore = score;
            bestWasteId = wasteId;
        }
    }
    if (!bestWasteId) return null;

    return {
        item: aiWasteLibrary.find(w => w.id === bestWasteId),
        className: topPredictionByWasteId[bestWasteId].className, 
        probability: Math.min(bestScore, 0.99)
    };
}


function renderDebugPredictions(predictions) {
    console.log('[EcoHub AI][debug] Prediksi mentah:', predictions.map(p => `${p.className} (${(p.probability * 100).toFixed(1)}%)`));

    const buildRows = (list) => list.map((p, i) => {
        const pct = (p.probability * 100).toFixed(1);
        const cleanLabel = p.className.split(',')[0].trim();
        const match = matchLabelToWaste(p.className);
        const isTop = i === 0;

        const barColor = match ? 'bg-emerald-400' : (isTop ? 'bg-amber-400' : 'bg-slate-600');
        const textColor = match ? 'text-emerald-300' : (isTop ? 'text-slate-200' : 'text-slate-500');
        const badge = match
            ? `<div class="mt-1 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-0.5">
                   <i class="fa-solid fa-check"></i> ${match.name}
               </div>`
            : '';

        return `
            <div class="${textColor}">
                <div class="flex items-center justify-between gap-2 text-[10px] mb-1 leading-tight">
                    <span class="truncate">${isTop ? '▸' : '·'}&nbsp; ${cleanLabel}</span>
                    <span class="shrink-0 font-bold tabular-nums">${pct}%</span>
                </div>
                <div class="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-300 ease-out" style="width:${pct}%"></div>
                </div>
                ${badge}
            </div>`;
    }).join('');

    const mobileWrap = document.getElementById('aiDebugOverlay');
    const mobileRows = document.getElementById('aiDebugOverlayRows');
    if (mobileWrap && mobileRows) {
        mobileWrap.classList.remove('dbg-hidden');
        mobileRows.innerHTML = buildRows(predictions.slice(0, 3));
    }

    const desktopWrap = document.getElementById('aiDebugOverlayDesktop');
    const desktopRows = document.getElementById('aiDebugOverlayDesktopRows');
    if (desktopWrap && desktopRows) {
        desktopWrap.classList.remove('dbg-hidden');
        desktopRows.innerHTML = buildRows(predictions);
    }
}

function hideDebugPredictions() {
    const mobileWrap = document.getElementById('aiDebugOverlay');
    const mobileRows = document.getElementById('aiDebugOverlayRows');
    if (mobileWrap) mobileWrap.classList.add('dbg-hidden');
    if (mobileRows) mobileRows.innerHTML = '';

    const desktopWrap = document.getElementById('aiDebugOverlayDesktop');
    const desktopRows = document.getElementById('aiDebugOverlayDesktopRows');
    if (desktopWrap) desktopWrap.classList.add('dbg-hidden');
    if (desktopRows) desktopRows.innerHTML = '';
}

function updateScannerStatus(phase) {
    if (isDetectionLocked) return;
    const status = document.getElementById('cameraStatus');
    if (phase === 'analyzing') {
        status.innerHTML = '<i class="fa-solid fa-arrows-spin fa-spin mr-1 text-emerald-400"></i> AI MENGANALISIS VISUAL...';
    } else if (phase === 'confirming') {

        status.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1 text-amber-400"></i> OBJEK TERDETEKSI, MENGONFIRMASI...';
    } else {
        status.innerHTML = '<i class="fa-solid fa-circle text-red-500 animate-pulse mr-1"></i> MENCARI OBJEK...';
    }
}

function lockDetection(match) {
    isDetectionLocked = true;
    lockedDetection = {
        wasteId: match.item.id,
        className: match.className,
        confidence: match.probability,
        timestamp: Date.now()
    };

    stopInferenceLoop();
    hideDebugPredictions();
    showScanResult(match.item, match.probability);

    const status = document.getElementById('cameraStatus');
    status.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> DETEKSI TERKUNCI';

    const btnScan = document.getElementById('btnRealScan');
    btnScan.disabled = false;
    btnScan.classList.remove('opacity-50', 'cursor-not-allowed');
    btnScan.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Scan Lagi';
}

function showScanResult(item, probability) {
    currentScannedItem = item;

    const placeholder = document.getElementById('scanResultPlaceholder');
    const dataDiv = document.getElementById('scanResultData');
    placeholder.style.display = 'none';
    dataDiv.style.display = 'flex';

    const accuracy = (probability * 100).toFixed(1);
    document.getElementById('aiAccuracyMatch').innerHTML = `<i class="fa-solid fa-microchip"></i> AI Match: ${accuracy}%`;

    document.getElementById('resMaterialType').innerText = item.name;
    document.getElementById('resMaterialDesc').innerText = item.desc;

    if (item.data.isWeightInput) {
        document.getElementById('resMaterialWeight').innerText = `Input Manual (${item.unit})`;
    } else {
        document.getElementById('resMaterialWeight').innerText = `${item.data.weightPerItem} Kg / ${item.unit}`;
    }
    document.getElementById('resMaterialPrice').innerText = `Rp ${item.data.pricePerKg.toLocaleString('id-ID')} / Kg`;
}

function clearScanResult() {
    currentScannedItem = null;
    document.getElementById('scanResultPlaceholder').style.display = 'flex';
    document.getElementById('scanResultData').style.display = 'none';
    document.getElementById('scanTextPlaceholder').innerText = 'Sistem AI Siaga';
}

function resetScannerState() {
    isDetectionLocked = false;
    lockedDetection = null;
    stableWasteStreakId = null;
    stableWasteStreakCount = 0;
    clearScanResult();
    hideDebugPredictions();

    const btnScan = document.getElementById('btnRealScan');
    btnScan.disabled = true;
    btnScan.classList.add('opacity-50', 'cursor-not-allowed');
    btnScan.innerHTML = '<i class="fa-solid fa-expand"></i> Pindai Objek';

    const status = document.getElementById('cameraStatus');
    status.innerText = isCameraActive ? "MENYIAPKAN AI..." : "KAMERA NONAKTIF";
}

function resetScanner() {
    isDetectionLocked = false;
    lockedDetection = null;
    stableWasteStreakId = null;
    stableWasteStreakCount = 0;

    clearScanResult();

    const btnScan = document.getElementById('btnRealScan');
    btnScan.disabled = true;
    btnScan.classList.add('opacity-50', 'cursor-not-allowed');
    btnScan.innerHTML = '<i class="fa-solid fa-expand"></i> Pindai Objek';

    updateScannerStatus('searching');

    if (isCameraActive && mobilenetModel) startInferenceLoop();
}

function startARScan() {
    if (isDetectionLocked) resetScanner();
}

function addToCalculator() {
    if(!currentScannedItem) return;

    const inputId = `${currentScannedItem.id}Input`;
    const sliderId = `${currentScannedItem.id}Slider`;
    const inputElement = document.getElementById(inputId);
    const sliderElement = document.getElementById(sliderId);
    const cardElement = document.getElementById(`calc-card-${currentScannedItem.id}`);

    if (!inputElement) {
        alert(`Integrasi kalkulator untuk "${currentScannedItem.name}" akan hadir di versi mendatang!`);
        return;
    }

    const addValue = currentScannedItem.data.isWeightInput ? 1 : 1;
    inputElement.value = parseFloat(inputElement.value) + addValue;
    if(sliderElement) sliderElement.value = inputElement.value;

    navigateTo('calculator');

    setTimeout(() => {
        const scrollTarget = cardElement || document.getElementById('page-calculator');
        scrollTarget.scrollIntoView({behavior: 'smooth', block: 'center'});

        if (cardElement) {
            cardElement.classList.add('border-emerald-500', 'scale-[1.03]', 'z-10');
            cardElement.style.boxShadow = "0 0 30px rgba(16, 185, 129, 0.4)";
            cardElement.style.background = "rgba(16, 185, 129, 0.1)";
        }

        calculateWaste();

        setTimeout(() => {
            if (cardElement) {
                cardElement.classList.remove('border-emerald-500', 'scale-[1.03]', 'z-10');
                cardElement.style.boxShadow = "";
                cardElement.style.background = "";
            }
        }, 1500);
    }, 350);
}

function syncInput(type, fromNumber = false) {
    const slider = document.getElementById(`${type}Slider`);
    const input = document.getElementById(`${type}Input`);
    if(slider && input) {
        if (fromNumber) slider.value = input.value;
        else input.value = slider.value;
    }
}

function calculateWaste() {
    let totalWeight = 0, totalValue = 0, totalCO2 = 0, totalEnergy = 0;
    let hasInput = false;

    for (const [type, data] of Object.entries(wasteData)) {
        const inputEl = document.getElementById(`${type}Input`);
        if (!inputEl) continue; 

        const qty = parseFloat(inputEl.value) || 0;
        let weight = data.isWeightInput ? qty : qty * data.weightPerItem;
        totalWeight += weight;
        totalValue += weight * data.pricePerKg;
        totalCO2 += weight * data.co2PerKg;
        totalEnergy += weight * data.energyPerKg;
        if (qty > 0) hasInput = true;
    }

    animateValue("resWeight", parseFloat(document.getElementById("resWeight").innerText) || 0, totalWeight, 1500, " <span class='text-xl font-bold opacity-60'>kg</span>");
    animateValue("resMoney", parseFloat(document.getElementById("resMoney").innerText.replace(/[^0-9]/g, '')) || 0, totalValue, 1500, "", true);
    animateValue("resCO2", parseFloat(document.getElementById("resCO2").innerText) || 0, totalCO2, 1500, " <span class='text-xl font-bold opacity-60'>kg</span>");
    animateValue("resEnergy", parseFloat(document.getElementById("resEnergy").innerText) || 0, totalEnergy, 1500, " <span class='text-xl font-bold opacity-60'>kWh</span>");

    updateAchievement(totalWeight, hasInput);
    if (hasInput) markChallengeDone('kalkulator');
}

function animateValue(id, start, end, duration, suffix = "", isCurrency = false) {
    const obj = document.getElementById(id);
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        let current = easeOut * (end - start) + start;
        
        if (isCurrency) {
            obj.innerHTML = 'Rp ' + Math.floor(current).toLocaleString('id-ID');
        } else {
            let formatted = current % 1 === 0 ? current : current.toFixed(2);
            obj.innerHTML = formatted + suffix;
        }
        
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function updateAchievement(weight, hasInput) {
    const badge = document.getElementById('badgeDisplay');
    const text = document.getElementById('badgeText');
    if(!badge || !text) return;
    
    badge.style.transform = 'scale(0.9)';
    badge.style.opacity = '0.5';

    setTimeout(() => {
        let bgClass = "";
        let iconClass = "fa-seedling";
        
        if (!hasInput || weight === 0) {
            text.innerText = "Masukkan Data!";
            bgClass = "bg-slate-200 border border-slate-300 text-slate-500";
            iconClass = "fa-pen-to-square";
        } else if (weight < 5) {
            text.innerText = "Eco Beginner";
            bgClass = "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border-0";
            iconClass = "fa-leaf";
        } else if (weight < 20) {
            text.innerText = "Plastic Saver";
            bgClass = "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border-0";
            iconClass = "fa-shield-halved";
        } else {
            text.innerText = "Recycle Hero!";
            bgClass = "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] border-0";
            iconClass = "fa-medal animate-pulse";
        }
        
        badge.className = `px-8 py-4 rounded-full font-black text-xl flex items-center gap-4 transition-all duration-700 ${bgClass}`;
        badge.innerHTML = `<i class="fa-solid ${iconClass} text-3xl"></i> <span id="badgeText">${text.innerText}</span>`;
        
        badge.style.transform = 'scale(1)';
        badge.style.opacity = '1';
    }, 300);
}

const repairSchedules = {
    "2026-07-15": { title: "Penambalan Jalan Berlubang", location: "Jl. Jalanin Aja Dulu", progress: "100%", status: "Selesai" },
    "2026-07-22": { title: "Perbaikan Lampu Taman", location: "Taman Kota Sembayat C", progress: "80%", status: "Proses" },
    "2026-07-28": { title: "Pembersihan Gorong-gorong", location: "Blok A, Perumahan Miami", progress: "30%", status: "Mulai" },
    "2026-08-05": { title: "Renovasi Halte Bus", location: "Halte Utama M1G", progress: "0%", status: "Terjadwal" }
};

let currentDate = new Date(2026, 6, 1); 
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function initCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonthYear').innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDiv);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerText = day;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (repairSchedules[dateStr]) {
            dayDiv.classList.add('has-event');
            dayDiv.setAttribute('title', 'Ada jadwal perbaikan!');
        }
        
        dayDiv.addEventListener('click', () => selectDate(dayDiv, dateStr));
        calendarGrid.appendChild(dayDiv);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    resetDetailPanel();
}

function selectDate(element, dateStr) {
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active-select'));
    
    const event = repairSchedules[dateStr];
    
    if (event) {
        element.classList.add('active-select');
        
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('activeState').classList.remove('hidden');
        document.getElementById('activeState').classList.add('flex');
        
        
        
        const dateObj = new Date(dateStr);
        document.getElementById('detailDateBadge').innerText = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        
        document.getElementById('detailTitle').innerText = event.title;
        document.getElementById('detailLocation').innerText = event.location;

        
    } else {
        resetDetailPanel();
    }
}

function resetDetailPanel() {
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active-select'));
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('activeState').classList.add('hidden');
    document.getElementById('activeState').classList.remove('flex');
}

const PL_API_BASE = window.ECOHUB_API_BASE || '';

let plGrown = false;
let plMode = 'login'; 

let plCurrentUser = null; 
const PL_AVATAR_PRESETS = {
    'avatar-preset:leaf-1': '🍃',
    'avatar-preset:leaf-2': '🌱',
    'avatar-preset:leaf-3': '🌳',
    'avatar-preset:leaf-4': '🌻',
    'avatar-preset:leaf-5': '🌍'
};

function plGetToken() {
    return localStorage.getItem('ecohub_token');
}

function plClearSession() {
    localStorage.removeItem('ecohub_token');
    plCurrentUser = null;
}

function plRenderNavAvatar(el, avatarValue, initial) {
    if (!el) return;
    el.classList.remove('bg-gradient-to-br', 'from-emerald-400', 'to-blue-500');
    el.style.backgroundImage = '';
    el.style.backgroundColor = '';
    el.textContent = '';

    if (avatarValue && avatarValue.startsWith('data:image')) {
        el.style.backgroundImage = `url("${avatarValue}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
    } else if (avatarValue && PL_AVATAR_PRESETS[avatarValue]) {
        el.style.backgroundColor = 'rgba(255,255,255,0.14)';
        el.textContent = PL_AVATAR_PRESETS[avatarValue];
    } else {
        el.classList.add('bg-gradient-to-br', 'from-emerald-400', 'to-blue-500');
        el.textContent = initial;
    }
}

function plApplyLoggedInUI(user) {
    plCurrentUser = user;
    refreshAdminMode();
    const initial = (user.display_name || user.username || '?').trim().charAt(0).toUpperCase() || '?';
    const label = user.display_name || user.username;

    const loginDesktop = document.getElementById('navLoginBtnDesktop');
    const loginMobile = document.getElementById('navLoginBtnMobile');
    const profileDesktop = document.getElementById('navProfileBtnDesktop');
    const profileMobile = document.getElementById('navProfileBtnMobile');

    if (loginDesktop) loginDesktop.classList.add('auth-hidden');
    if (loginMobile) loginMobile.classList.add('auth-hidden');
    if (profileDesktop) profileDesktop.classList.remove('auth-hidden');
    if (profileMobile) profileMobile.classList.remove('auth-hidden');

    const navName = document.getElementById('navProfileName');
    const navNameMobile = document.getElementById('navProfileNameMobile');
    if (navName) navName.textContent = label;
    if (navNameMobile) navNameMobile.textContent = label;

    plRenderNavAvatar(document.getElementById('navProfileAvatar'), user.avatar, initial);
    plRenderNavAvatar(document.getElementById('navProfileAvatarMobile'), user.avatar, initial);
}

function plApplyLoggedOutUI() {
    plCurrentUser = null;
    applyAdminModeUI(false);

    const loginDesktop = document.getElementById('navLoginBtnDesktop');
    const loginMobile = document.getElementById('navLoginBtnMobile');
    const profileDesktop = document.getElementById('navProfileBtnDesktop');
    const profileMobile = document.getElementById('navProfileBtnMobile');

    if (loginDesktop) loginDesktop.classList.remove('auth-hidden');
    if (loginMobile) loginMobile.classList.remove('auth-hidden');
    if (profileDesktop) profileDesktop.classList.add('auth-hidden');
    if (profileMobile) profileMobile.classList.add('auth-hidden');
}

function plRequireLoginForReport() {
    if (plCurrentUser) return true;

    const dashboard = document.getElementById('page-dashboard');
    if (dashboard) {
        dashboard.scrollIntoView({ behavior: 'smooth' });
        setTimeout(openLoginModal, 450);
    } else {
        openLoginModal();
    }
    return false;
}

function handleQuickReportClick() {
    if (!plRequireLoginForReport()) return;
    navigateTo('map');
    const mapCard = document.getElementById('map-container');
    if (mapCard) {
        mapCard.classList.remove('ebn-map-highlight');
        void mapCard.offsetWidth;
        mapCard.classList.add('ebn-map-highlight');
        setTimeout(() => mapCard.classList.remove('ebn-map-highlight'), 1700);
    }
}

function ebnOpenReport() {
    handleQuickReportClick();
}


async function plTryRestoreSession() {
    const token = plGetToken();
    if (!token) return false;

    try {
        const res = await fetch(PL_API_BASE + '/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) { plClearSession(); return false; }
        const data = await res.json();
        plApplyLoggedInUI(data.user);
        return true;
    } catch (err) {
        return false;
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 10);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('opacity-0');
    modal.children[0].classList.add('scale-95');
    document.body.classList.remove('overflow-hidden');

    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

document.addEventListener('DOMContentLoaded', async () => {
    const restored = await plTryRestoreSession();
    if (!restored) {
        openLoginModal();
        applyAdminModeUI(false);
    }
});

let isAdminMode = false;

function applyAdminModeUI(active) {
    isAdminMode = active;

    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('admin-only', !active);
    });

    updateDeleteButtonVisibility(currentPanelReport);
}

async function refreshAdminMode() {
    const token = plGetToken();
    if (!token) {
        applyAdminModeUI(false);
        return;
    }
    try {
        const res = await fetch('/api/admin/verify', { headers: { 'Authorization': 'Bearer ' + token } });
        applyAdminModeUI(res.ok);
    } catch (err) {
        applyAdminModeUI(false);
    }
}

function plTogglePlant() {
    plGrown = !plGrown;
    document.getElementById('plPotWrap').classList.toggle('grown', plGrown);
}

function plSwitchMode(e) {
    if (e) e.preventDefault();
    plMode = plMode === 'login' ? 'register' : 'login';
    const isRegister = plMode === 'register';

    document.getElementById('plEmailField').classList.toggle('open', isRegister);
    document.getElementById('plEmail').required = isRegister;
    document.getElementById('plCardSub').textContent = isRegister
        ? 'Buat akun baru untuk KotaKu'
        : 'Masuk untuk melanjutkan ke KotaKu';
    document.getElementById('plSubmitBtn').textContent = isRegister ? 'Daftar' : 'Masuk';
    document.getElementById('plSwitchText').textContent = isRegister
        ? 'Sudah punya akun?'
        : 'Belum punya akun?';
    document.getElementById('plSwitchLink').textContent = isRegister
        ? 'Masuk di sini'
        : 'Daftar sekarang';

    const msg = document.getElementById('plFormMsg');
    msg.textContent = '';
    msg.className = 'pl-msg';
}

async function plHandleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('plSubmitBtn');
    const msg = document.getElementById('plFormMsg');
    const username = document.getElementById('plUsername').value.trim();
    const password = document.getElementById('plPassword').value;
    const email = document.getElementById('plEmail').value.trim();

    msg.textContent = '';
    msg.className = 'pl-msg';
    btn.disabled = true;
    btn.textContent = plMode === 'register' ? 'Mendaftar...' : 'Memproses...';

    const endpoint = plMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = plMode === 'register' ? { username, password, email } : { username, password };

    try {
        const res = await fetch(PL_API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.error || 'Terjadi kesalahan.';
            msg.className = 'pl-msg error';
        } else {
            localStorage.setItem('ecohub_token', data.token);
            if (data.user) plApplyLoggedInUI(data.user);
            msg.textContent = plMode === 'register'
                ? 'Akun berhasil dibuat! Mengalihkan...'
                : 'Berhasil masuk! Mengalihkan...';
            msg.className = 'pl-msg ok';
            setTimeout(closeLoginModal, 900);
        }
    } catch (err) {
        msg.textContent = 'Tidak dapat terhubung ke server backend (' + PL_API_BASE + ').';
        msg.className = 'pl-msg error';
    } finally {
        btn.disabled = false;
        btn.textContent = plMode === 'register' ? 'Daftar' : 'Masuk';
    }

    return false;
}

let pfPendingAvatar; 
function openProfileModal() {
    if (!plCurrentUser) { openLoginModal(); return; }

    document.getElementById('pfDisplayName').value = plCurrentUser.display_name || '';
    document.getElementById('pfUsername').value = plCurrentUser.username || '';
    document.getElementById('pfEmail').value = plCurrentUser.email || '';
    document.getElementById('pfBio').value = plCurrentUser.bio || '';

    const memberSince = document.getElementById('pfMemberSince');
    if (memberSince) {
        if (plCurrentUser.created_at) {
            const d = new Date(plCurrentUser.created_at.replace(' ', 'T'));
            const formatted = isNaN(d) ? '' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            memberSince.textContent = formatted ? `Warga KotaKu sejak ${formatted}` : 'Warga KotaKu';
        } else {
            memberSince.textContent = 'Warga KotaKu';
        }
    }

    pfPendingAvatar = undefined;
    pfUpdateAvatarPreview(plCurrentUser.avatar);
    document.querySelectorAll('#pfPresetRow .pf-preset-swatch').forEach(el => {
        el.classList.toggle('selected', el.dataset.preset === plCurrentUser.avatar);
    });

    const pwForm = document.getElementById('pfPasswordForm');
    pwForm.classList.remove('open');
    document.getElementById('pfPasswordLink').innerHTML = '<i class="fa-solid fa-lock"></i> Ubah Password';
    document.getElementById('pfCurrentPassword').value = '';
    document.getElementById('pfNewPassword').value = '';
    document.getElementById('pfPasswordMsg').textContent = '';
    document.getElementById('pfPasswordMsg').className = 'pf-msg';
    document.getElementById('pfFormMsg').textContent = '';
    document.getElementById('pfFormMsg').className = 'pf-msg';

    const modal = document.getElementById('profileModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 10);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.add('opacity-0');
    modal.children[0].classList.add('scale-95');
    document.body.classList.remove('overflow-hidden');

    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

const KK_TREE_STORAGE_KEY = 'kotaku_tree_taps';

const KK_TREE_STAGES = [
    { min: 0,  level: 1, name: 'Benih' },
    { min: 3,  level: 2, name: 'Tunas' },
    { min: 8,  level: 3, name: 'Pohon Muda' },
    { min: 16, level: 4, name: 'Pohon Rindang' },
    { min: 31, level: 5, name: 'Hutan Mini' }
];

const KK_GREEN_FACTS = [
    'Mendaur ulang 1 ton kertas dapat menyelamatkan sekitar 17 pohon dewasa.',
    'Ekonomi sirkular berpotensi memangkas emisi karbon global secara signifikan jika diterapkan penuh.',
    'Satu pohon dewasa mampu menyerap sekitar 22 kg karbon dioksida per tahun.',
    'Lampu jalan pintar (smart lighting) dapat menghemat energi kota hingga 50-70%.',
    'Sampah organik yang dikompos membantu mengurangi emisi metana dari tempat pembuangan akhir.',
    'Ruang terbuka hijau di perkotaan bisa menurunkan suhu udara sekitar beberapa derajat.',
    'Botol plastik butuh ratusan tahun untuk terurai secara alami di lingkungan.',
    'Menanam pohon di lingkungan perkotaan terbukti membantu menurunkan tingkat stres warga.',
    'Panel surya rumahan dapat memangkas tagihan listrik rumah tangga secara nyata.',
    'Bersepeda atau berjalan kaki untuk jarak dekat membantu mengurangi jejak karbon pribadi.'
];

let kkLastFactIndex = -1;

function kkGetTaps() {
    return parseInt(localStorage.getItem(KK_TREE_STORAGE_KEY) || '0', 10) || 0;
}
function kkSetTaps(v) {
    try { localStorage.setItem(KK_TREE_STORAGE_KEY, String(v)); } catch (e) { /* ignore quota/privacy errors */ }
}
function kkGetStage(taps) {
    let s = KK_TREE_STAGES[0];
    for (const st of KK_TREE_STAGES) { if (taps >= st.min) s = st; }
    return s;
}
function kkGetNextStage(taps) {
    return KK_TREE_STAGES.find(st => st.min > taps) || null;
}

function kkSpawnLeafBurst(x, y) {
    const glyphs = ['🍃', '🌿', '✨'];
    const count = 9;
    for (let i = 0; i < count; i++) {
        const leaf = document.createElement('span');
        leaf.className = 'kk-burst-leaf';
        leaf.textContent = glyphs[i % glyphs.length];
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 55 + Math.random() * 55;
        leaf.style.left = x + 'px';
        leaf.style.top = y + 'px';
        leaf.style.setProperty('--tx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        leaf.style.setProperty('--ty', (Math.sin(angle) * dist).toFixed(1) + 'px');
        leaf.style.setProperty('--rot', (Math.random() * 360 - 180).toFixed(0) + 'deg');
        leaf.style.fontSize = (14 + Math.random() * 10).toFixed(0) + 'px';
        document.body.appendChild(leaf);
        setTimeout(() => leaf.remove(), 1000);
    }
}

function kkRenderTree(stageLevel) {
    document.querySelectorAll('#kkTreeSvg .kk-tree-part').forEach(p => {
        const lvl = parseInt(p.dataset.level, 10);
        p.classList.toggle('kk-visible', lvl === 0 || lvl === stageLevel);
    });
}

function kkPickFact() {
    let idx;
    do { idx = Math.floor(Math.random() * KK_GREEN_FACTS.length); }
    while (idx === kkLastFactIndex && KK_GREEN_FACTS.length > 1);
    kkLastFactIndex = idx;
    return KK_GREEN_FACTS[idx];
}

function kkUpdatePopoverContent() {
    const taps = kkGetTaps();
    const stage = kkGetStage(taps);
    const next = kkGetNextStage(taps);

    kkRenderTree(stage.level);

    const nameEl = document.getElementById('kkStageName');
    const countEl = document.getElementById('kkTapCount');
    const fillEl = document.getElementById('kkProgressFill');
    const nextEl = document.getElementById('kkNextStageHint');
    const factEl = document.getElementById('kkFactText');

    if (nameEl) nameEl.textContent = stage.name;
    if (countEl) countEl.textContent = `${taps} interaksi hijau`;

    if (fillEl) {
        let pct = 100;
        if (next) {
            const span = next.min - stage.min;
            pct = Math.max(0, Math.min(100, Math.round(((taps - stage.min) / span) * 100)));
        }
        fillEl.style.width = pct + '%';
    }
    if (nextEl) {
        nextEl.textContent = next
            ? `${next.min - taps} interaksi lagi menuju "${next.name}"`
            : 'Tahap maksimum tercapai — kamu menginspirasi hutan mini KotaKu!';
    }
    if (factEl) factEl.textContent = kkPickFact();
}

function kkPositionPopover(anchorEl) {
    const popover = document.getElementById('kkLogoPopover');
    if (!popover || !anchorEl) return;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        popover.style.left = '50%';
        popover.style.right = 'auto';
        popover.style.top = 'auto';
        popover.style.bottom = '96px';
        popover.style.transform = 'translateX(-50%)';
        return;
    }

    const rect = anchorEl.getBoundingClientRect();
    const popW = 300;
    let left = rect.left + rect.width / 2 - popW / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - popW - 16));
    let top = rect.bottom + 14;
    if (top + 380 > window.innerHeight) top = Math.max(16, rect.top - 380 - 14);

    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
    popover.style.right = 'auto';
    popover.style.bottom = 'auto';
    popover.style.transform = 'none';
}

function handleKotakuLogoClick(event) {
    const anchor = event.currentTarget;
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    kkSpawnLeafBurst(cx, cy);

    anchor.classList.add('kk-logo-pop');
    setTimeout(() => anchor.classList.remove('kk-logo-pop'), 400);

    kkSetTaps(kkGetTaps() + 1);

    kkPositionPopover(anchor);
    kkUpdatePopoverContent();

    const popover = document.getElementById('kkLogoPopover');
    const backdrop = document.getElementById('kkLogoPopoverBackdrop');
    if (popover) popover.classList.add('open');
    if (backdrop && window.innerWidth < 768) backdrop.classList.add('open');
}

function closeLogoPopover() {
    const popover = document.getElementById('kkLogoPopover');
    const backdrop = document.getElementById('kkLogoPopoverBackdrop');
    if (popover) popover.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLogoPopover();
});

document.addEventListener('click', (e) => {
    const popover = document.getElementById('kkLogoPopover');
    if (!popover || !popover.classList.contains('open')) return;
    if (popover.contains(e.target)) return;
    if (e.target.closest('.kk-logo-clickable')) return;
    closeLogoPopover();
});

window.addEventListener('resize', () => {
    const popover = document.getElementById('kkLogoPopover');
    if (popover && popover.classList.contains('open')) closeLogoPopover();
});

const PF_DEFAULT_AVATAR_GRADIENT = 'linear-gradient(135deg, #34D399, #3B82F6)';
const PF_PRESET_AVATAR_BG = 'rgba(255,255,255,0.14)';

function pfUpdateAvatarPreview(avatarValue) {
    const img = document.getElementById('pfAvatarImg');
    const initial = document.getElementById('pfAvatarInitial');
    const label = (plCurrentUser && (plCurrentUser.display_name || plCurrentUser.username)) || '?';
    const fallback = label.trim().charAt(0).toUpperCase() || '?';

    initial.style.background = '';

    if (avatarValue && avatarValue.startsWith('data:image')) {

        img.onerror = () => {
            img.removeAttribute('src');
            img.classList.add('hidden');
            img.style.display = 'none';
            initial.classList.remove('hidden');
            initial.style.display = 'flex';
            initial.style.background = PF_DEFAULT_AVATAR_GRADIENT;
            initial.textContent = fallback;
        };
        img.src = avatarValue;
        img.classList.remove('hidden');
        img.style.display = 'block';
        initial.classList.add('hidden');
        initial.style.display = 'none';
    } else if (avatarValue && PL_AVATAR_PRESETS[avatarValue]) {
        img.removeAttribute('src');
        img.classList.add('hidden');
        img.style.display = 'none';
        initial.classList.remove('hidden');
        initial.style.display = 'flex';
        initial.style.background = PF_PRESET_AVATAR_BG;
        initial.textContent = PL_AVATAR_PRESETS[avatarValue];
    } else {
        img.removeAttribute('src');
        img.classList.add('hidden');
        img.style.display = 'none';
        initial.classList.remove('hidden');
        initial.style.display = 'flex';
        initial.style.background = PF_DEFAULT_AVATAR_GRADIENT;
        initial.textContent = fallback;
    }
}

function pfSelectPreset(presetId) {
    pfPendingAvatar = presetId;
    pfUpdateAvatarPreview(presetId);
    document.querySelectorAll('#pfPresetRow .pf-preset-swatch').forEach(el => {
        el.classList.toggle('selected', el.dataset.preset === presetId);
    });
}

function pfHandleAvatarFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
        const msg = document.getElementById('pfFormMsg');
        if (msg) { msg.textContent = 'Format foto harus PNG, JPG, atau WEBP.'; msg.className = 'pf-msg error'; }
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {

            const MAX = 320;
            let w = img.width, h = img.height;
            const longest = Math.max(w, h);
            if (longest > MAX) {
                const scale = MAX / longest;
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            pfPendingAvatar = dataUrl;
            pfUpdateAvatarPreview(dataUrl);
            document.querySelectorAll('#pfPresetRow .pf-preset-swatch').forEach(el => el.classList.remove('selected'));
        };
        img.onerror = () => {
            const msg = document.getElementById('pfFormMsg');
            if (msg) { msg.textContent = 'Foto gagal dibaca. Coba file lain.'; msg.className = 'pf-msg error'; }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = ''; 
}

async function pfHandleSave(e) {
    e.preventDefault();
    const btn = document.getElementById('pfSaveBtn');
    const msg = document.getElementById('pfFormMsg');
    const token = plGetToken();

    if (!token) { openLoginModal(); return false; }

    const payload = {
        display_name: document.getElementById('pfDisplayName').value.trim(),
        email: document.getElementById('pfEmail').value.trim(),
        bio: document.getElementById('pfBio').value.trim()
    };
    if (pfPendingAvatar !== undefined) {
        payload.avatar = pfPendingAvatar === null ? '' : pfPendingAvatar;
    }

    msg.textContent = '';
    msg.className = 'pf-msg';
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const res = await fetch(PL_API_BASE + '/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.error || 'Gagal menyimpan perubahan.';
            msg.className = 'pf-msg error';
        } else {
            plApplyLoggedInUI(data.user);
            pfPendingAvatar = undefined;
            msg.textContent = 'Profil berhasil diperbarui!';
            msg.className = 'pf-msg ok';
        }
    } catch (err) {
        msg.textContent = 'Tidak dapat terhubung ke server backend.';
        msg.className = 'pf-msg error';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Perubahan';
    }

    return false;
}

function pfTogglePassword(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('pfPasswordForm');
    const link = document.getElementById('pfPasswordLink');
    const isOpen = form.classList.toggle('open');
    link.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i> Batal'
        : '<i class="fa-solid fa-lock"></i> Ubah Password';
}

async function pfHandleChangePassword(e) {
    e.preventDefault();
    const btn = document.getElementById('pfPasswordBtn');
    const msg = document.getElementById('pfPasswordMsg');
    const token = plGetToken();
    const currentPassword = document.getElementById('pfCurrentPassword').value;
    const newPassword = document.getElementById('pfNewPassword').value;

    if (!token) { openLoginModal(); return false; }

    msg.textContent = '';
    msg.className = 'pf-msg';
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

    try {
        const res = await fetch(PL_API_BASE + '/api/auth/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.error || 'Gagal mengubah password.';
            msg.className = 'pf-msg error';
        } else {
            msg.textContent = 'Password berhasil diperbarui!';
            msg.className = 'pf-msg ok';
            document.getElementById('pfCurrentPassword').value = '';
            document.getElementById('pfNewPassword').value = '';
        }
    } catch (err) {
        msg.textContent = 'Tidak dapat terhubung ke server backend.';
        msg.className = 'pf-msg error';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-key"></i> Perbarui Password';
    }

    return false;
}

function pfLogout() {
    plClearSession();
    plApplyLoggedOutUI();
    closeProfileModal();
    setTimeout(openLoginModal, 320);
}

function ebnProfileClick() {
    if (plCurrentUser) {
        openProfileModal();
    } else {
        openLoginModal();
    }
}

function ebnSetActive(btn) {
    const nav = document.getElementById('ecoBottomNav');
    const indicator = document.getElementById('ebnIndicator');
    if (!nav || !indicator || !btn) return;

    nav.querySelectorAll('.ebn-item').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');

    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const indicatorSize = indicator.offsetWidth;
    const left = (btnRect.left - navRect.left) + (btnRect.width / 2) - (indicatorSize / 2);
    indicator.style.left = left + 'px';
}

function ebnToggleTheme() {
    const realThemeBtn = document.getElementById('themeToggleBtn');
    if (realThemeBtn) realThemeBtn.click();

    const ebnIcon = document.getElementById('ebnThemeIcon');
    if (ebnIcon) {
        ebnIcon.classList.toggle('fa-sun');
        ebnIcon.classList.toggle('fa-moon');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const nav = document.getElementById('ecoBottomNav');
    if (!nav) return;

    nav.querySelectorAll('.ebn-item').forEach(btn => {
        btn.addEventListener('click', function () {
            ebnSetActive(btn);
        });
    });

    const initiallyActive = nav.querySelector('.ebn-item.active') || nav.querySelector('.ebn-item');
    requestAnimationFrame(() => ebnSetActive(initiallyActive));

    window.addEventListener('resize', () => {
        const current = nav.querySelector('.ebn-item.active');
        if (current) ebnSetActive(current);
    });
});

const APP_VIEWS = ['dashboard', 'jelajah', 'edukasi', 'aksi-warga', 'map', 'scanner', 'calculator'];
let currentAppView = 'dashboard';
let isAppViewTransitioning = false;

function viewFromHash(hash) {
    const id = (hash || '').replace('#page-', '').replace('#', '');
    return APP_VIEWS.includes(id) ? id : null;
}

function syncDockActiveState(view) {

    const mobileNav = document.getElementById('ecoBottomNav');
    if (mobileNav) {
        const mobileBtn = mobileNav.querySelector(`.ebn-item[data-view="${view}"]`);
        if (mobileBtn && typeof ebnSetActive === 'function') {
            ebnSetActive(mobileBtn);
        } else {
            mobileNav.querySelectorAll('.ebn-item').forEach(el => el.classList.remove('active'));
        }
    }

    document.querySelectorAll('nav a[href^="#page-"]').forEach(a => {
        const linkView = a.getAttribute('href').replace('#page-', '');
        a.classList.toggle('text-emerald-500', linkView === view);
    });

    if (typeof window.kkNavCarouselRevealView === 'function') {
        window.kkNavCarouselRevealView(view);
    }
}

(function () {
    const VISIBLE_COUNT = 4;
    let startIndex = 0;

    function initNavCarousel() {
        const track = document.getElementById('navCarouselTrack');
        const prevBtn = document.getElementById('navCarouselPrev');
        const nextBtn = document.getElementById('navCarouselNext');
        if (!track || !prevBtn || !nextBtn) return;

        const items = Array.from(track.children);
        const total = items.length;
        const maxStart = Math.max(0, total - VISIBLE_COUNT);

        function render() {
            const itemWidth = items[0] ? items[0].getBoundingClientRect().width : 0;
            track.style.transform = `translateX(-${startIndex * itemWidth}px)`;

            const atStart = startIndex <= 0;
            const atEnd = startIndex >= maxStart;
            prevBtn.disabled = atStart;
            nextBtn.disabled = atEnd;
            prevBtn.classList.toggle('nav-carousel-arrow--disabled', atStart);
            nextBtn.classList.toggle('nav-carousel-arrow--disabled', atEnd);
        }

        prevBtn.addEventListener('click', () => {
            startIndex = Math.max(0, startIndex - 1);
            render();
        });
        nextBtn.addEventListener('click', () => {
            startIndex = Math.min(maxStart, startIndex + 1);
            render();
        });

        window.addEventListener('resize', render);
        requestAnimationFrame(render);

        window.kkNavCarouselRevealView = function (view) {
            const idx = items.findIndex((el) => el.dataset.view === view);
            if (idx === -1) return;

            if (idx < startIndex) {
                startIndex = idx;
            } else if (idx > startIndex + VISIBLE_COUNT - 1) {
                startIndex = idx - VISIBLE_COUNT + 1;
            }
            startIndex = Math.min(Math.max(startIndex, 0), maxStart);
            render();
        };
    }

    document.addEventListener('DOMContentLoaded', initNavCarousel);
})();

function navigateTo(view, opts = {}) {
    if (!APP_VIEWS.includes(view)) return;
    const target = document.getElementById('page-' + view);
    if (!target) return;

    if (view === currentAppView && !opts.force) {
        syncDockActiveState(view);
        return;
    }
    if (isAppViewTransitioning && !opts.instant) return;

    const current = document.getElementById('page-' + currentAppView);
    const leavingView = currentAppView;
    isAppViewTransitioning = true;

    if (leavingView === 'scanner' && typeof isCameraActive !== 'undefined' && isCameraActive) {
        toggleCamera();
    }

    const finishShow = () => {
        target.classList.add('active');
        currentAppView = view;
        isAppViewTransitioning = false;
        syncDockActiveState(view);

        const appContent = document.querySelector('main');
        if (appContent) appContent.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        window.scrollTo(0, 0);

        if (view === 'map' && typeof mapInstance !== 'undefined' && mapInstance) {
            requestAnimationFrame(() => requestAnimationFrame(() => mapInstance.invalidateSize()));
        }
        if (typeof AOS !== 'undefined') {
            requestAnimationFrame(() => AOS.refreshHard());
        }

        if (!opts.replace) {
            history.pushState({ view }, '', '#page-' + view);
        } else {
            history.replaceState({ view }, '', '#page-' + view);
        }
    };

    if (current) {
        current.classList.remove('active', 'leaving');
    }
    target.classList.add('active');
    finishShow();
}

document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('a[href^="#page-"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const view = viewFromHash(this.getAttribute('href'));
            if (view) {
                e.preventDefault();
                navigateTo(view);
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden') && typeof closeMenu === 'function') {
                    closeMenu();
                }
            }
        });
    });

    window.addEventListener('popstate', (e) => {
        const view = (e.state && e.state.view) || viewFromHash(location.hash) || 'dashboard';
        navigateTo(view, { replace: true, instant: true });
    });

    window.addEventListener('resize', () => syncDockActiveState(currentAppView));

    const initialView = viewFromHash(location.hash) || 'dashboard';
    navigateTo(initialView, { replace: true, instant: true, force: true });
});

const VIEW_LABELS = {
    dashboard: 'Beranda',
    jelajah: 'Jelajah',
    edukasi: 'Edukasi & Teori',
    'aksi-warga': 'Misi & Aksi Warga',
    map: 'Peta Warga',
    scanner: 'AR Scanner',
    calculator: 'Kalkulator Dampak',
};

function initPageNavs() {
    APP_VIEWS.forEach((view, i) => {
        const holder = document.querySelector(`[data-page-nav="${view}"]`);
        if (!holder) return;

        const prevView = APP_VIEWS[i - 1];
        const nextView = APP_VIEWS[i + 1];

        const prevHtml = prevView ? `
            <button type="button" class="kk-page-nav-btn kk-page-nav-btn--prev" data-goto="${prevView}">
                <i class="fa-solid fa-arrow-left"></i>
                <span><span class="kk-page-nav-caption">Kembali</span>${VIEW_LABELS[prevView]}</span>
            </button>` : '<span></span>';

        const nextHtml = nextView ? `
            <button type="button" class="kk-page-nav-btn kk-page-nav-btn--next" data-goto="${nextView}">
                <span><span class="kk-page-nav-caption">Selanjutnya</span>${VIEW_LABELS[nextView]}</span>
                <i class="fa-solid fa-arrow-right"></i>
            </button>` : '<span></span>';

        holder.innerHTML = prevHtml + nextHtml;
        holder.querySelectorAll('[data-goto]').forEach((btn) => {
            btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-goto')));
        });
    });
}

document.addEventListener('DOMContentLoaded', initPageNavs);