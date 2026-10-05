// render.js — isi DOM dari config + perilaku bersama semua halaman
// (meta/SEO, warna/font, nav, badge buka/tutup, tombol Reservasi & Pesan, footer).
import { RESTO } from "./config.js";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // urut Senin → Minggu
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- util ---------- */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/** Aturan placeholder: teks berisi "[...]" dianggap kosong → tidak dirender */
export const isPlaceholder = (v) => typeof v === "string" && v.includes("[");
export const hasValue = (v) => v != null && v !== "" && !isPlaceholder(v);

const isEmpty = (v) => !hasValue(v) || (Array.isArray(v) && v.every(isEmpty)) ||
  (typeof v === "object" && !Array.isArray(v) && Object.values(v).every(isEmpty));

export const formatPrice = (p) =>
  typeof p === "number" && p > 0 ? "Rp " + p.toLocaleString("id-ID") : "";

export const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const fmtTime = (min) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, "0")}.${String(min % 60).padStart(2, "0")}`;

export const waLink = (text) =>
  `https://wa.me/${RESTO.whatsapp}?text=${encodeURIComponent(text)}`;

export const ICON_WA = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.22-.08-.39-.12-.55.13-.17.24-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47a.9.9 0 0 0-.66.31c-.22.25-.86.85-.86 2.07 0 1.21.88 2.39 1 2.55.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>`;
export const ICON_CLOCK = `<svg class="ico ico-clock" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;

const ICON_PIN = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`;
const ICON_EXT = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;

/** Waktu sekarang di Asia/Jakarta → { date: "YYYY-MM-DD", day: 0-6, minutes } */
export function jakartaNow(at = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(at).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, day: dayOfDate(date), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export const dayOfDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const addDays = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** "2026-10-10" → "Sabtu, 10 Okt 2026" */
export const formatDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
  }).replace(/(\d+) (\w+)\.? /, "$1 $2 ");
};

/** Jam buka satu hari → { open, close } dalam menit (close bisa > 1440 jika lewat tengah malam) */
export function hoursFor(day) {
  const h = RESTO.hours.find((x) => x.day === day);
  if (!h) return null;
  const open = toMin(h.open);
  let close = toMin(h.close);
  if (close <= open) close += 1440;
  return { open, close };
}

/** Status buka/tutup sekarang (Asia/Jakarta). short = teks ringkas untuk nav */
export function openStatus(now = jakartaNow()) {
  const today = hoursFor(now.day);
  const yesterday = hoursFor((now.day + 6) % 7);
  if (today && now.minutes >= today.open && now.minutes < today.close)
    return { open: true, text: `Buka sekarang · tutup ${fmtTime(today.close)}`, short: "Buka sekarang" };
  if (yesterday && yesterday.close > 1440 && now.minutes < yesterday.close - 1440)
    return { open: true, text: `Buka sekarang · tutup ${fmtTime(yesterday.close)}`, short: "Buka sekarang" };
  if (today && now.minutes < today.open)
    return { open: false, text: `Tutup · buka jam ${fmtTime(today.open)}`, short: `Buka ${fmtTime(today.open)}` };
  for (let i = 1; i <= 7; i++) {
    const day = (now.day + i) % 7;
    const h = hoursFor(day);
    if (h) {
      const label = i === 1 ? "besok" : DAY_NAMES[day];
      return { open: false, text: `Tutup · buka ${label} ${fmtTime(h.open)}`, short: "Tutup" };
    }
  }
  return { open: false, text: "Tutup", short: "Tutup" };
}

const hoursText = (d) => {
  const h = RESTO.hours.find((x) => x.day === d);
  return h ? `${h.open.replace(":", ".")} – ${h.close.replace(":", ".")}` : "Tutup";
};

/* ---------- tema, meta, SEO ---------- */
function applyTheme() {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(RESTO.colors)) root.setProperty(`--${k}`, v);
  root.setProperty("--font-display", `"${RESTO.fonts.display}", Georgia, serif`);
  root.setProperty("--font-body", `"${RESTO.fonts.body}", system-ui, sans-serif`);

  const fam = [RESTO.fonts.display + ":ital,wght@0,500;0,600;1,500", RESTO.fonts.body + ":wght@400;500;600"]
    .map((f) => "family=" + f.replace(/ /g, "+")).join("&");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
  document.head.append(link);
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.append(el); }
  el.content = content;
}

function applyMeta() {
  const page = document.body.dataset.page;
  const titles = {
    home: `${RESTO.name} — Sate lilit bakar arang & taman tropis`,
    menu: `Menu — ${RESTO.name}`,
    reservasi: `Reservasi & Lokasi — ${RESTO.name}`
  };
  document.title = titles[page] || RESTO.name;
  const og = new URL(RESTO.ogImage, location.href).href;
  setMeta("name", "description", RESTO.description);
  setMeta("property", "og:title", document.title);
  setMeta("property", "og:description", RESTO.description);
  setMeta("property", "og:image", og);
  setMeta("property", "og:type", "restaurant");
  setMeta("name", "theme-color", RESTO.colors.bg);

  // favicon: logo klien; cadangan = huruf pertama nama resto
  const icon = document.head.querySelector('link[rel="icon"]') || document.head.appendChild(document.createElement("link"));
  icon.rel = "icon";
  if (RESTO.logo?.favicon) {
    icon.type = "image/png";
    icon.href = RESTO.logo.favicon;
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${RESTO.colors.bg}"/><text x="32" y="45" font-family="Georgia,serif" font-size="38" text-anchor="middle" fill="${RESTO.colors.accent}">${esc(RESTO.name.charAt(0))}</text></svg>`;
    icon.href = "data:image/svg+xml," + encodeURIComponent(svg);
  }
  if (RESTO.logo?.appleIcon) {
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = RESTO.logo.appleIcon;
    document.head.append(apple);
  }

  const ld = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: RESTO.name,
    description: RESTO.description,
    image: og,
    url: new URL("index.html", location.href).href,
    menu: new URL("menu.html", location.href).href,
    telephone: "+" + RESTO.whatsapp,
    acceptsReservations: "True",
    servesCuisine: "Indonesian",
    openingHoursSpecification: RESTO.hours.map((h) => ({
      "@type": "OpeningHoursSpecification", dayOfWeek: DAY_SCHEMA[h.day], opens: h.open, closes: h.close
    }))
  };
  if (hasValue(RESTO.address)) {
    ld.address = { "@type": "PostalAddress", streetAddress: RESTO.address, addressCountry: "ID" };
    if (hasValue(RESTO.city)) ld.address.addressLocality = RESTO.city;
  }
  if (RESTO.mapsUrl) ld.hasMap = RESTO.mapsUrl;
  if (RESTO.geo) ld.geo = { "@type": "GeoCoordinates", latitude: RESTO.geo.lat, longitude: RESTO.geo.lng };
  if (RESTO.instagram) ld.sameAs = [RESTO.instagram];
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(ld);
  document.head.append(s);
}

/* ---------- binding teks sederhana ---------- */
function applyBindings() {
  const val = (path) => { const v = get(RESTO, path); return hasValue(v) ? v : ""; };
  document.querySelectorAll("[data-bind]").forEach((el) => { el.textContent = val(el.dataset.bind); });
  document.querySelectorAll("[data-bind-src]").forEach((el) => { el.src = val(el.dataset.bindSrc); });
  document.querySelectorAll("[data-alt-bind]").forEach((el) => { el.alt = val(el.dataset.altBind); });
  document.querySelectorAll("[data-bind-bg]").forEach((el) => {
    el.style.backgroundImage = `url("${val(el.dataset.bindBg)}")`;
  });
  document.querySelectorAll("[data-bind-price]").forEach((el) => {
    el.textContent = formatPrice(get(RESTO, el.dataset.bindPrice));
    el.hidden = !el.textContent;
  });
  document.querySelectorAll("[data-hide-if-empty]").forEach((el) => {
    if (isEmpty(get(RESTO, el.dataset.hideIfEmpty))) el.hidden = true;
  });
  document.querySelectorAll("[data-demo-notice]").forEach((el) => {
    el.textContent = RESTO.demoNotice;
    el.hidden = !RESTO.demoNotice;
  });
  document.querySelectorAll("[data-wa-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", ICON_WA));
  document.querySelectorAll("[data-time-select]").forEach((el) => el.insertAdjacentHTML("afterbegin", ICON_CLOCK));
}

/* ---------- tombol Reservasi & Pesan ---------- */
const deliveryLinks = () => [
  ["GoFood", RESTO.delivery.gofood], ["GrabFood", RESTO.delivery.grabfood], ["ShopeeFood", RESTO.delivery.shopeefood]
].filter(([, url]) => url);

/** Buka link eksternal di tab baru; tombol yang mengarah ke WhatsApp diberi ikon WA */
function openExternal(a, href) {
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  if (href.startsWith("https://wa.me/") && !a.querySelector(".ico")) a.insertAdjacentHTML("afterbegin", ICON_WA);
}

export function focusForm(form) {
  const field = form.querySelector("input, select, textarea");
  if (window.__lenis) window.__lenis.scrollTo(form, { offset: -120 });
  else form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  field?.focus({ preventScroll: true });
}

function wireReserveButtons() {
  const form = document.getElementById("reservation-form");
  document.querySelectorAll("[data-reserve]").forEach((a) => {
    if (form) {
      a.href = "#reservasi";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        closeOverlay();
        focusForm(form);
        history.replaceState(null, "", "#reservasi");
      });
    } else {
      a.href = "reservasi.html#reservasi";
    }
  });
}

function wireOrderButtons() {
  const links = deliveryLinks();
  document.querySelectorAll("[data-order]").forEach((a) => {
    const item = a.dataset.order;
    if (links.length === 1) return openExternal(a, links[0][1]);
    if (links.length > 1) {
      a.href = "#order-sheet";
      a.addEventListener("click", (e) => { e.preventDefault(); toggleOrderSheet(true); });
      return;
    }
    // Belum ada link delivery → pesan lewat WhatsApp
    const text = item ? `Halo ${RESTO.name}, saya mau pesan ${item}.` : `Halo ${RESTO.name}, saya mau pesan online.`;
    openExternal(a, waLink(text));
  });
  if (links.length > 1) buildOrderSheet(links);
}

function buildOrderSheet(links) {
  const sheet = document.createElement("div");
  sheet.id = "order-sheet";
  sheet.className = "order-sheet";
  sheet.hidden = true;
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Pilih aplikasi pesan antar");
  sheet.innerHTML = `<div class="order-sheet__panel">
      <p class="order-sheet__title">Pesan lewat</p>
      ${links.map(([n, u]) => `<a class="btn btn--secondary" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join("")}
      <button type="button" class="link-arrow" data-close><span>Tutup</span></button>
    </div>`;
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("[data-close]")) toggleOrderSheet(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleOrderSheet(false); });
  document.body.append(sheet);
}

function toggleOrderSheet(show) {
  const sheet = document.getElementById("order-sheet");
  if (!sheet) return;
  sheet.hidden = !show;
  if (show) sheet.querySelector("a")?.focus();
}

/* ---------- badge buka/tutup ---------- */
function updateBadges() {
  const st = openStatus();
  document.querySelectorAll("[data-open-badge]").forEach((el) => {
    el.textContent = el.dataset.openBadge === "short" ? st.short : st.text;
    el.classList.toggle("is-open", st.open);
    el.classList.toggle("is-closed", !st.open);
  });
}

/* ============================================================
   NAV — 3 kolom; transparan di atas hero, solid + blur setelahnya,
   sembunyi saat scroll turun, muncul saat scroll naik. Mobile: overlay.
   ============================================================ */
const NAV_LINKS = [["index.html", "home", "Beranda"], ["menu.html", "menu", "Menu"], ["reservasi.html#lokasi", "reservasi", "Lokasi"]];

function renderNav() {
  const nav = document.querySelector('[data-render="nav"]');
  if (!nav) return;
  const page = document.body.dataset.page;
  const cur = (p) => (p === page ? ' aria-current="page"' : "");
  const brand = `${RESTO.logo?.mark ? `<img class="nav__mark" src="${esc(RESTO.logo.mark)}" alt="" width="160" height="118">` : ""}<span>${esc(RESTO.logoText || RESTO.name)}</span>`;
  nav.innerHTML = `
    <div class="wrap nav__inner">
      <a class="nav__brand" href="index.html" aria-label="${esc(RESTO.name)} — Beranda">${brand}</a>
      <nav class="nav__links" aria-label="Navigasi utama">
        ${NAV_LINKS.map(([href, p, label]) => `<a href="${href}"${cur(p)}>${label}</a>`).join("")}
      </nav>
      <div class="nav__right">
        <span class="badge" data-open-badge="short"></span>
        <a class="btn btn--primary btn--sm" href="reservasi.html" data-reserve>Reservasi</a>
        <button class="nav__burger" type="button" aria-expanded="false" aria-controls="nav-overlay" aria-label="Buka menu navigasi"><span></span><span></span></button>
      </div>
    </div>`;

  // overlay di luar <header> (header punya transform → fixed child akan ikut bergeser)
  const today = jakartaNow().day;
  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  overlay.id = "nav-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Menu navigasi");
  overlay.inert = true;
  overlay.innerHTML = `
    <div class="nav-overlay__top">
      <a class="nav__brand" href="index.html" aria-label="${esc(RESTO.name)} — Beranda">${brand}</a>
      <button class="nav-overlay__close" type="button" aria-label="Tutup menu">×</button>
    </div>
    <nav class="nav-overlay__links" aria-label="Navigasi utama (mobile)">
      ${NAV_LINKS.map(([href, p, label], i) => `<a href="${href}"${cur(p)}><small>0${i + 1}</small>${label}</a>`).join("")}
    </nav>
    <div class="nav-overlay__foot">
      <div>
        <p class="footer__h">Jam buka</p>
        <ul class="nav-overlay__hours">${WEEK.map((d) => `<li${d === today ? ' class="is-today"' : ""}><span>${DAY_NAMES[d]}</span><span>${hoursText(d)}</span></li>`).join("")}</ul>
      </div>
      <span class="badge" data-open-badge></span>
      <a class="btn btn--primary" href="reservasi.html" data-reserve>Reservasi</a>
    </div>`;
  document.body.append(overlay);
}

let lastFocus = null;
function openOverlay() {
  const ov = document.getElementById("nav-overlay");
  if (!ov) return;
  lastFocus = document.activeElement;
  ov.inert = false;
  ov.classList.add("is-open");
  document.querySelector(".nav__burger")?.setAttribute("aria-expanded", "true");
  document.documentElement.style.overflow = "hidden";
  window.__lenis?.stop();
  setTimeout(() => ov.querySelector(".nav-overlay__close")?.focus(), 50);
}
export function closeOverlay() {
  const ov = document.getElementById("nav-overlay");
  if (!ov?.classList.contains("is-open")) return;
  ov.classList.remove("is-open");
  ov.inert = true;
  document.querySelector(".nav__burger")?.setAttribute("aria-expanded", "false");
  document.documentElement.style.overflow = "";
  window.__lenis?.start();
  lastFocus?.focus?.();
}

function wireNav() {
  const nav = document.querySelector(".nav");
  const bar = document.querySelector(".progress-bar");
  const mobileBar = document.querySelector(".mobile-bar");
  if (!nav) return;
  const heroEl = document.querySelector("[data-nav-hero]");
  const lightEls = [...document.querySelectorAll('[data-nav-theme="light"]')];
  let lastY = scrollY;

  nav.querySelector(".nav__burger")?.addEventListener("click", openOverlay);
  const ov = document.getElementById("nav-overlay");
  ov?.querySelector(".nav-overlay__close")?.addEventListener("click", closeOverlay);
  ov?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { if (!a.hasAttribute("data-reserve")) closeOverlay(); }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
    // jebakan fokus sederhana di overlay
    if (e.key === "Tab" && ov?.classList.contains("is-open")) {
      const f = [...ov.querySelectorAll("a, button")];
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });

  const heroBottom = () => {
    if (!heroEl) return 0;
    const box = heroEl.closest(".pin-spacer") || heroEl;
    return box.getBoundingClientRect().bottom;
  };

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    const navH = nav.offsetHeight;
    const pastHero = heroBottom() <= navH + 1;
    nav.classList.toggle("nav--solid", pastHero);

    // teks nav gelap saat berada di atas section krem
    const onLight = lightEls.some((el) => {
      if (el.hidden) return false;
      const r = el.getBoundingClientRect();
      return r.top <= navH / 2 && r.bottom >= navH / 2;
    });
    nav.classList.toggle("nav--on-light", onLight);

    // sembunyi saat scroll turun (setelah hero), muncul saat scroll naik
    const dy = y - lastY;
    if (!pastHero || nav.contains(document.activeElement)) setHidden(nav, false);
    else if (dy > 4) setHidden(nav, true);
    else if (dy < -4) setHidden(nav, false);
    lastY = y;

    mobileBar?.classList.toggle("is-visible", y > innerHeight * 0.6 || !heroEl);
  };
  nav.addEventListener("focusin", () => setHidden(nav, false));
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();
}

function setHidden(nav, hide) {
  nav.classList.toggle("nav--hidden", hide);
  document.documentElement.classList.toggle("nav-is-hidden", hide);
}

/** Header parallax pendek (Menu & Reservasi) — background bergerak lebih lambat */
function wireHeaderParallax() {
  const bg = document.querySelector("[data-parallax]");
  if (!bg || reduceMotion) return;
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (scrollY < innerHeight) bg.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
      ticking = false;
    });
  }, { passive: true });
}

/* ---------- renderer section ---------- */
const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const realReviews = () => RESTO.reviews.filter((r) => hasValue(r.text) && hasValue(r.name));

/** Kartu menu: foto 4:5 + tag di pojok foto, judul, deskripsi 1 baris, harga kiri & "Pesan" kanan */
const card = (m, tags, extraClass = "") => {
  const price = formatPrice(m.price);
  return `
    <article class="card reveal ${extraClass}">
      ${m.img ? `<div class="card__media">
        <img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" decoding="async" width="800" height="1000">
        ${tags.length ? `<span class="tag">${esc(tags[0])}</span>` : ""}
      </div>` : ""}
      <div class="card__body">
        <h3 class="card__title">${esc(m.name)}</h3>
        ${hasValue(m.desc) ? `<p class="card__desc" title="${esc(m.desc)}">${esc(m.desc)}</p>` : ""}
        <div class="card__foot">
          ${price ? `<span class="price">${price}</span>` : ""}
          <a class="btn btn--secondary btn--sm" href="menu.html" data-order="${esc(m.name)}" aria-label="Pesan ${esc(m.name)}">Pesan</a>
        </div>
      </div>
    </article>`;
};

const renderers = {
  nav: () => null, // ditangani renderNav()

  "best-sellers": () => RESTO.bestSellers.map((m) => card(m, m.tag ? [m.tag] : [])).join(""),

  stats: () => RESTO.stats.filter((s) => hasValue(s.value)).map((s) => `
    <div class="stat"><span class="stat__value" data-count>${esc(s.value)}</span><span class="stat__label">${esc(s.label)}</span></div>`).join(""),

  social: () => {
    const reviews = realReviews();
    const imgs = RESTO.gallery.map((src) => `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" width="600" height="800">`).join("");
    const rating = hasValue(RESTO.rating?.value)
      ? `<p class="rating"><strong>${esc(RESTO.rating.value)}</strong>${hasValue(RESTO.rating.count) ? ` dari ${esc(RESTO.rating.count)} ulasan Google` : " di Google"}</p>` : "";
    const head = reviews.length
      ? `<p class="eyebrow">Ulasan</p><h2 class="section-title" id="social-title">Kata <em>tamu</em> kami</h2>${rating}`
      : `<p class="eyebrow">Suasana</p><h2 class="section-title" id="social-title">Sudut-sudut <em>favorit</em> tamu</h2>`;
    const chev = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
    const ctrl = RESTO.gallery.length > 1 ? `
          <button class="gallery__btn gallery__btn--prev" type="button" data-marquee="prev" aria-label="Foto sebelumnya">${chev("M15 5l-7 7 7 7")}</button>
          <button class="gallery__btn gallery__btn--next" type="button" data-marquee="next" aria-label="Foto berikutnya">${chev("M9 5l7 7-7 7")}</button>` : "";
    return `
      <div class="wrap social__head">
        <div>${head}
          ${RESTO.instagram ? `<a class="link-arrow" href="${esc(RESTO.instagram)}" target="_blank" rel="noopener"><span>Ikuti di Instagram</span><span class="arrow" aria-hidden="true">→</span></a>` : ""}
        </div>
      </div>
      ${RESTO.gallery.length ? `<div class="gallery">
        <div class="marquee" role="region" aria-label="Galeri foto suasana"><div class="marquee__track">${imgs}${imgs.replace(/<img /g, '<img aria-hidden="true" ')}</div></div>${ctrl}
      </div>` : ""}
      ${reviews.length ? `<div class="wrap"><div class="reviews">${reviews.map((r) => `
        <figure class="review reveal">
          <div class="review__stars" aria-label="Rating ${r.rating} dari 5">${stars(r.rating)}</div>
          <blockquote>“${esc(r.text)}”</blockquote>
          <figcaption>${esc(r.name)} · ${esc(r.source)}</figcaption>
        </figure>`).join("")}</div></div>` : ""}`;
  },

  "menu-tabs": () => RESTO.menu.map((c, i) => `
    <a class="tab" href="#cat-${i}" data-tab="${i}">${esc(c.category)}</a>`).join(""),

  menu: () => RESTO.menu.map((c, i) => `
    <section class="menu-cat" id="cat-${i}" aria-labelledby="cat-${i}-title">
      <div class="menu-cat__head">
        <h2 class="menu-cat__title" id="cat-${i}-title">${esc(c.category)}</h2>
        <span class="menu-cat__count">${c.items.length} menu</span>
      </div>
      <div class="card-grid">${c.items.map((m) => card(m, m.tags || [])).join("")}</div>
    </section>`).join(""),

  "hours-table": () => {
    const today = jakartaNow().day;
    return WEEK.map((d) => `<tr${d === today ? ' class="is-today" aria-current="date"' : ""}><th scope="row">${DAY_NAMES[d]}${d === today ? " <small>· hari ini</small>" : ""}</th><td>${hoursText(d)}</td></tr>`).join("");
  },

  faq: () => RESTO.faq.filter((f) => hasValue(f.a)).map((f) => `
    <details class="faq__item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join(""),

  /** Section Lokasi: alamat + aksi + jam buka di kiri, peta (klik → Google Maps) di kanan */
  location: () => {
    if (!hasValue(RESTO.address) && !RESTO.mapsUrl) return "";
    const [street, ...rest] = hasValue(RESTO.address) ? RESTO.address.split(/,\s*/) : [];
    const area = hasValue(RESTO.area) ? RESTO.area : RESTO.name;
    const map = RESTO.mapsEmbed ? `
      <a class="map-card" href="${esc(RESTO.mapsUrl || RESTO.mapsEmbed)}" target="_blank" rel="noopener" aria-label="Buka lokasi ${esc(RESTO.name)} di Google Maps">
        <iframe src="${esc(RESTO.mapsEmbed)}" title="Peta lokasi ${esc(RESTO.name)}" loading="lazy" tabindex="-1" aria-hidden="true" referrerpolicy="no-referrer-when-downgrade"></iframe>
        <span class="map-card__cta">${ICON_PIN}<span>Buka di Google Maps</span>${ICON_EXT}</span>
      </a>` : "";
    return `
    <div class="wrap location__grid${map ? "" : " location__grid--solo"}">
      <div class="location__info">
        <p class="eyebrow">Lokasi</p>
        <h2 class="section-title" id="loc-title">Temukan kami di <em>${esc(area)}</em></h2>
        ${street ? `<address class="location__address"><strong>${esc(street)}</strong>${rest.length ? `<span>${esc(rest.join(", "))}</span>` : ""}</address>` : ""}
        <div class="location__actions">
          ${RESTO.mapsUrl ? `<a class="btn btn--primary" href="${esc(RESTO.mapsUrl)}" target="_blank" rel="noopener">${ICON_PIN}Petunjuk Arah</a>` : ""}
          ${street ? `<button class="link-arrow" type="button" data-copy-address><span>Salin alamat</span><span class="arrow" aria-hidden="true">→</span></button>
          <span class="location__copied" role="status" aria-live="polite"></span>` : ""}
        </div>
        <div class="location__hours">
          <h3 class="footer__h">Jam buka</h3>
          <table class="hours-table"><tbody>${renderers["hours-table"]()}</tbody></table>
        </div>
      </div>
      ${map}
    </div>`;
  },

  footer: () => {
    const links = deliveryLinks();
    const today = jakartaNow().day;
    const hours = WEEK.map((d) => `<li${d === today ? ' class="is-today"' : ""}><span>${DAY_NAMES[d]}</span><span>${hoursText(d)}</span></li>`).join("");
    const hasLoc = hasValue(RESTO.address);
    const explore = `
      <ul class="footer__links">
        <li><a class="link-arrow" href="menu.html"><span>Menu</span><span class="arrow" aria-hidden="true">→</span></a></li>
        <li><a class="link-arrow" href="reservasi.html#reservasi"><span>Reservasi</span><span class="arrow" aria-hidden="true">→</span></a></li>
        ${RESTO.instagram ? `<li><a class="link-arrow" href="${esc(RESTO.instagram)}" target="_blank" rel="noopener"><span>Instagram</span><span class="arrow" aria-hidden="true">→</span></a></li>` : ""}
      </ul>`;
    return `
    <p class="footer__word" aria-hidden="true">${esc(RESTO.name)}</p>
    <div class="wrap">
      <div class="footer__inner">
        <div class="footer__brand">
          ${RESTO.logo?.full
            ? `<img class="footer__logo-img" src="${esc(RESTO.logo.full)}" alt="${esc(RESTO.name)}" width="360" height="360" loading="lazy" decoding="async">`
            : `<p class="footer__logo">${esc(RESTO.name)}</p>`}
          <p>${esc(RESTO.tagline)}</p>
          <span class="badge" data-open-badge></span>
        </div>
        <div>
          <h2 class="footer__h">Jam buka</h2>
          <ul class="footer__hours">${hours}</ul>
        </div>
        <div class="footer__col">
          ${hasLoc ? `<h2 class="footer__h">Lokasi</h2>
          ${hasValue(RESTO.address) ? `<p>${esc(RESTO.address)}</p>` : ""}
` : ""}
          <h2 class="footer__h"${hasLoc ? ' style="margin-top:32px"' : ""}>Jelajahi</h2>
          ${explore}
          ${links.length ? `<h2 class="footer__h" style="margin-top:32px">Pesan antar</h2><div class="hero__ctas">${links.map(([n, u]) => `<a class="btn btn--secondary btn--sm" href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join("")}</div>` : ""}
        </div>
      </div>
      <div class="footer__bottom">
        <span>© ${new Date().getFullYear()} ${esc(RESTO.name)}</span>
        <span data-demo-notice></span>
      </div>
    </div>`;
  }
};

function renderSections() {
  document.querySelectorAll("[data-render]").forEach((el) => {
    const fn = renderers[el.dataset.render];
    const html = fn?.();
    if (html == null) return;
    el.innerHTML = html;
    if (!html.trim()) el.hidden = true;
  });
  // kartu info yang isinya kosong (lokasi/FAQ placeholder) ikut disembunyikan
  document.querySelectorAll("[data-render-section]").forEach((sec) => {
    const body = sec.querySelector("[data-render]");
    if (!body || !body.innerHTML.trim()) sec.hidden = true;
  });
}

/* ---------- Lokasi: salin alamat & lompatan hash di halaman yang sama ---------- */
function wireLocation() {
  document.querySelectorAll("[data-copy-address]").forEach((btn) => btn.addEventListener("click", async () => {
    const out = btn.parentElement.querySelector(".location__copied");
    try { await navigator.clipboard.writeText(RESTO.address); out.textContent = "Alamat disalin"; }
    catch { out.textContent = "Gagal menyalin — tekan lama alamat untuk menyalin"; }
    setTimeout(() => { out.textContent = ""; }, 2400);
  }));
  // link "reservasi.html#lokasi" saat sudah di halaman reservasi → scroll halus + perbarui URL
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || a.hasAttribute("data-reserve")) return;
    a.addEventListener("click", (e) => {
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      closeOverlay();
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -24 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", url.hash);
    });
  });  // buka langsung dari link (mis. menu.html → reservasi.html#lokasi): koreksi posisi setelah konten & font dirender
  if (location.hash.length > 1) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) document.fonts?.ready.then(() => requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto" })));
  }
}

/* ---------- tombol mengambang "Pesan Online" disembunyikan saat footer terlihat ---------- */
function wireFab() {
  const fab = document.querySelector(".fab");
  const footer = document.querySelector(".footer");
  if (!fab || !footer || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([e]) => fab.classList.toggle("is-hidden", e.isIntersecting)).observe(footer);
}

/* ---------- galeri: auto-slide terus jalan, tombol ‹ › & swipe geser manual ---------- */
function wireMarquee() {
  const box = document.querySelector(".marquee");
  const track = box?.querySelector(".marquee__track");
  if (!track) return;
  document.documentElement.classList.add("marquee-js");
  const SPEED = reduceMotion ? 0 : 40;       // px/detik saat auto
  let x = 0, boost = 0, last = performance.now(), hover = false, drag = null;
  const half = () => track.scrollWidth / 2;   // isi track diduplikasi → loop mulus
  const step = () => { const img = track.querySelector("img"); return img ? img.offsetWidth + 16 : 300; };
  const wrap = () => { const h = half(); if (h) x = ((x % h) + h) % h; };

  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!drag) {
      const move = boost * Math.min(dt * 6, 1); // geser tombol: ease-out
      boost -= move;
      x += move + (hover ? 0 : SPEED * dt);
      wrap();
    }
    track.style.transform = `translate3d(${-x}px,0,0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  document.querySelectorAll("[data-marquee]").forEach((btn) => btn.addEventListener("click", () => {
    boost += (btn.dataset.marquee === "next" ? 1 : -1) * step();
  }));
  box.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hover = true; });
  box.addEventListener("pointerleave", () => { hover = false; });
  box.addEventListener("pointerdown", (e) => {
    drag = { start: e.clientX, x0: x, id: e.pointerId };
    box.setPointerCapture(e.pointerId);
    box.classList.add("is-dragging");
  });
  box.addEventListener("pointermove", (e) => {
    if (!drag) return;
    x = drag.x0 - (e.clientX - drag.start);
    wrap();
  });
  const end = () => { drag = null; box.classList.remove("is-dragging"); };
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", end);
}

/* ---------- halaman Menu: tab aktif ---------- */
function wireMenuPage() {
  const tabs = [...document.querySelectorAll("[data-tab]")];
  if (!tabs.length) return;
  const setActive = (i) => tabs.forEach((t) => {
    const on = t.dataset.tab === String(i);
    t.classList.toggle("is-active", on);
    if (on) { t.setAttribute("aria-current", "true"); t.scrollIntoView?.({ block: "nearest", inline: "nearest" }); }
    else t.removeAttribute("aria-current");
  });
  setActive(0);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id.replace("cat-", "")); });
  }, { rootMargin: "-35% 0px -60% 0px" });
  document.querySelectorAll(".menu-cat").forEach((s) => io.observe(s));
}

export function wireReveal() {
  const els = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      // stagger ringan per baris grid
      const siblings = [...e.target.parentElement.children];
      e.target.style.transitionDelay = `${(siblings.indexOf(e.target) % 3) * 90}ms`;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
}

/* ---------- init ---------- */
applyTheme();
applyMeta();
renderNav();
renderSections();
applyBindings();
wireReserveButtons();
wireOrderButtons();
updateBadges();
setInterval(updateBadges, 60_000);
wireNav();
wireMenuPage();
wireLocation();
wireFab();
wireMarquee();
wireReveal();
wireHeaderParallax();
