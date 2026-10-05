// ============================================================
// config.js — SATU-SATUNYA file yang diedit saat rebrand.
// Nilai yang mengandung [KURUNG SIKU] = placeholder → TIDAK ditampilkan ke pengunjung.
// Field kosong ("" / [] / null) → elemen/section terkait otomatis disembunyikan.
// ============================================================

export const RESTO = {
  name: "KALIA",
  tagline: "Rasa yang akrab di lidah, suasana yang bikin lupa waktu.",
  city: "Jakarta Selatan",
  area: "Tebet",                                            // dipakai di judul section Lokasi
  description: "KALIA — restoran dengan sate lilit bakar arang, ruang makan beratap tinggi dan taman tropis. Reservasi meja langsung via WhatsApp.",

  // Catatan kecil di footer. Kosongkan setelah semua data asli terisi.
  demoNotice: "Website demo - Open Customize Request",

  // bg/surface/text = tema gelap; light/ink = section krem (Story, Best seller, Ulasan, Menu)
  colors: { bg: "#1E1B19", surface: "#2A2622", text: "#F3EDE4", accent: "#E39A5B", light: "#F3EDE4", ink: "#1E1B19" },
  fonts: { display: "Cormorant Garamond", body: "Manrope" },   // Google Fonts

  whatsapp: "628111712199",                                 // nomor reservasi (format 62…)
  // Alamat: baris pertama = jalan (ditebalkan), sisanya baris kedua.
  address: "Jl. Asem Baris Raya No.121, Kb. Baru, Kec. Tebet, Kota Jakarta Selatan, DKI Jakarta 12830",
  geo: { lat: -6.2365684, lng: 106.8604845 },
  mapsUrl: "https://maps.app.goo.gl/VVLEx4LDrpUxHZ1K7",   // klik peta / "Petunjuk Arah" → Google Maps
  mapsEmbed: "https://www.google.com/maps?q=Kalia+Restaurant,+Jl.+Asem+Baris+Raya+No.121,+Tebet,+Jakarta+Selatan&ll=-6.2365684,106.8604845&z=16&output=embed",

  // [JAM BUKA] — contoh sementara, ganti dengan jam asli. 0 = Minggu … 6 = Sabtu.
  hours: [
    { day: 0, open: "10:00", close: "22:00" },
    { day: 1, open: "10:00", close: "22:00" },
    { day: 2, open: "10:00", close: "22:00" },
    { day: 3, open: "10:00", close: "22:00" },
    { day: 4, open: "10:00", close: "22:00" },
    { day: 5, open: "10:00", close: "23:00" },
    { day: 6, open: "10:00", close: "23:00" }
  ],

  delivery: { gofood: "", grabfood: "", shopeefood: "" },   // kosong = tombol disembunyikan (jatuh ke WhatsApp)
  instagram: "",                                            // mis. "https://instagram.com/…"

  // Scene frame sequence (canvas scrub). frames: 0 → poster statis tanpa scrub.
  // Frame: assets/frames/<id>/<desktop|mobile>/0001.webp … ; poster = gambar untuk reduced-motion.
  // fit: "cover" = full-bleed, "contain" = utuh di dalam kotaknya (frame alpha).
  scenes: [
    { id: "hero", frames: 88, mobileFrames: 54, fit: "cover",
      poster: "assets/frames/hero/desktop/0001.webp", posterMobile: "assets/frames/hero/mobile/0001.webp" },
    { id: "signature", frames: 80, mobileFrames: 47, fit: "contain",
      poster: "assets/frames/signature/desktop/0080.webp", posterMobile: "assets/frames/signature/mobile/0047.webp" }
  ],

  signature: {
    name: "Sate Lilit",
    desc: "Sate lilit khas Bali, matang perlahan di atas bara arang, lalu disajikan hangat bersama salad segar.",
    price: null                                             // null = harga tidak ditampilkan
  },

  story: {
    title: "Ruang makan yang terasa seperti taman",
    text: "Atap tinggi, kayu hangat, dan hijau tanaman tropis di setiap sudut. Datang untuk sarapan, makan siang, atau ngopi sore bersama orang terdekat.",
    images: ["assets/img/vibes-5.webp", "assets/img/vibes-4.webp", "assets/img/vibes-1.webp"]
  },

  stats: [
    { value: "Sejak [TAHUN]", label: "Melayani tamu" },
    { value: "[RATING]", label: "Rating Google" },
    { value: "[JUMLAH]", label: "Pilihan menu" }
  ],

  bestSellers: [
    { name: "Sate Lilit", price: null, img: "assets/img/sate-lilit.webp", desc: "Sate lilit dengan salad segar.", tag: "Signature" },
    { name: "Nasi Goreng", price: null, img: "assets/img/nasi-goreng.webp", desc: "Dengan sate, telur ceplok, kerupuk & acar.", tag: "Best Seller" },
    { name: "Chicken Cordon Bleu", price: null, img: "assets/img/cordon-blue.webp", desc: "Dengan kentang goreng, salad & saus.", tag: "Best Seller" },
    { name: "Roll Nori", price: null, img: "assets/img/roll.webp", desc: "Roll berbalut nori dengan saus cocol.", tag: "Best Seller" },
    { name: "Sunny Side Up", price: null, img: "assets/img/breakfast-menu1.webp", desc: "Telur mata sapi, sosis, sourdough & salad.", tag: "Sarapan" },
    { name: "Es Kopi Susu", price: null, img: "assets/img/es-kopu.webp", desc: "Kopi susu dingin.", tag: "Best Seller" }
  ],

  menu: [
    {
      category: "Sarapan",
      items: [
        { name: "Sunny Side Up", price: null, desc: "Telur mata sapi, sosis, sourdough, salad & dressing lemon.", img: "assets/img/breakfast-menu1.webp", tags: ["Best Seller"] }
      ]
    },
    {
      category: "Makanan Utama",
      items: [
        { name: "Sate Lilit", price: null, desc: "Sate lilit dengan salad segar.", img: "assets/img/sate-lilit.webp", tags: ["Signature"] },
        { name: "Nasi Goreng", price: null, desc: "Dengan sate, telur ceplok, kerupuk & acar.", img: "assets/img/nasi-goreng.webp", tags: ["Best Seller"] },
        { name: "Chicken Cordon Bleu", price: null, desc: "Dengan kentang goreng, salad & saus.", img: "assets/img/cordon-blue.webp", tags: ["Best Seller"] },
        { name: "Chicken Steak", price: null, desc: "Ayam crispy, kentang goreng, salad & saus.", img: "assets/img/steak-ayam.webp", tags: [] },
        { name: "Udang Crispy", price: null, desc: "Udang goreng renyah.", img: "assets/img/udang.webp", tags: [] }
      ]
    },
    {
      category: "Camilan",
      items: [
        { name: "Roll Nori", price: null, desc: "Roll berbalut nori dengan saus cocol.", img: "assets/img/roll.webp", tags: ["Best Seller"] }
      ]
    },
    {
      category: "Minuman",
      items: [
        { name: "Es Kopi Susu", price: null, desc: "Kopi susu dingin.", img: "assets/img/es-kopu.webp", tags: ["Best Seller"] },
        { name: "Es Matcha Latte", price: null, desc: "Matcha dan susu dingin.", img: "assets/img/matcha-and-coffee.webp", tags: [] },
        { name: "Es Kopi Latte", price: null, desc: "Espresso dan susu dingin.", img: "assets/img/matcha-and-coffee.webp", tags: [] }
      ]
    }
  ],

  reviews: [
    { name: "[NAMA PELANGGAN]", text: "[KUTIPAN REVIEW GOOGLE 1]", rating: 5, source: "Google" },
    { name: "[NAMA PELANGGAN]", text: "[KUTIPAN REVIEW GOOGLE 2]", rating: 5, source: "Google" },
    { name: "[NAMA PELANGGAN]", text: "[KUTIPAN REVIEW GOOGLE 3]", rating: 5, source: "Google" }
  ],
  rating: { value: "[RATING]", count: "[JUMLAH ULASAN]" },

  // Foto untuk marquee social proof (foto asli klien)
  gallery: [
    "assets/img/vibes-2.webp", "assets/img/sate-lilit.webp", "assets/img/vibes-3.webp",
    "assets/img/es-kopu.webp", "assets/img/vibes-4.webp", "assets/img/roll.webp"
  ],

  faq: [
    { q: "Apakah ada tempat parkir?", a: "[INFO PARKIR]" },
    { q: "Apakah reservasi grup perlu DP?", a: "[INFO DP GRUP]" },
    { q: "Apakah menu halal?", a: "[INFO HALAL / NON-HALAL]" }
  ],

  reservation: { maxPax: 20, minHoursAhead: 2, slotMinutes: 30 },

  // Gambar
  logoText: "KALIA",
  // Logo klien (sumber: assets/logo/). Versi transparan + favicon dibuat dari logo asli.
  logo: {
    mark: "assets/img/logo-mark.webp",        // lotus saja → nav & overlay
    full: "assets/img/logo-full.webp",        // lotus + tulisan → footer
    favicon: "assets/img/favicon.png",
    appleIcon: "assets/img/apple-touch-icon.png"
  },
  ogImage: "assets/img/og.jpg",
  menuHeaderImage: "assets/img/vibes-4.webp",
  reservationImage: "assets/img/vibes-2.webp"
};
