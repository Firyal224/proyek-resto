// scroll-cinematic.js — Home: Lenis + GSAP ScrollTrigger + canvas frame sequence.
// Timeline: 1 Hero (bara, full-bleed) → 2 Signature (piring turun, alpha) → 3 Story → 4 Best seller
// → 5 Social → 6 CTA → 7 Footer. Warna latar berpindah gelap → krem → gelap mengikuti scroll.
import { RESTO } from "./config.js";
import "./render.js";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(max-width: 767px)").matches;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
const PRELOAD_FIRST = 16;      // jumlah frame awal hero yang ditunggu preloader
const PRELOADER_MAX_MS = 1500;
const SIG_FRAMES_END = 0.62;   // piring sudah mendarat di 62% progres signature, sisanya untuk teks

/* ============================================================
   Frame sequence di <canvas>
   ============================================================ */
class FrameSequence {
  constructor(canvas, sceneId, variant, count, fit = "cover") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.count = count;
    this.fit = fit;
    this.urls = Array.from({ length: count }, (_, i) =>
      `assets/frames/${sceneId}/${variant}/${String(i + 1).padStart(4, "0")}.webp`);
    this.imgs = new Array(count);
    this.loaded = 0;
    this.target = 0;
    this.current = -1;
    this.started = false;
    this.onProgress = null;
    this.onFirstDraw = null;
    new ResizeObserver(() => this.resize()).observe(canvas);
  }

  /** Muat frame bertahap: frame target dulu, lalu berurutan dengan 6 koneksi paralel */
  start() {
    if (this.started) return;
    this.started = true;
    const queue = [...this.urls.keys()];
    const first = queue.splice(this.target, 1)[0];
    const worker = async () => {
      while (queue.length) await this.loadOne(queue.shift());
    };
    this.loadOne(first).then(() => { for (let i = 0; i < 6; i++) worker(); });
  }

  async loadOne(i) {
    const img = new Image();
    img.src = this.urls[i];
    try { await img.decode(); } catch { return; }
    this.imgs[i] = img;
    this.loaded++;
    this.onProgress?.(this.loaded, this.count);
    this.render();
  }

  setProgress(p) {
    this.target = Math.round(Math.min(Math.max(p, 0), 1) * (this.count - 1));
    this.render();
  }

  /** Gambar frame terdekat yang sudah dimuat (kalau target belum siap) */
  render() {
    for (let d = 0; d < this.count; d++) {
      for (const i of [this.target - d, this.target + d]) {
        if (i >= 0 && i < this.count && this.imgs[i]) {
          if (i !== this.current) this.draw(i);
          return;
        }
      }
    }
  }

  draw(i) {
    const img = this.imgs[i];
    const { width: cw, height: ch } = this.canvas;
    if (!cw || !ch) return;
    const fitFn = this.fit === "contain" ? Math.min : Math.max;
    const scale = fitFn(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.clearRect(0, 0, cw, ch); // wajib untuk frame alpha
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    if (this.current < 0) this.onFirstDraw?.();
    this.current = i;
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.round(this.canvas.clientHeight * dpr);
    this.current = -1;
    this.render();
  }
}

/* ============================================================
   Setup scene dari config
   ============================================================ */
function setupScenes() {
  const scenes = {};
  for (const cfg of RESTO.scenes) {
    const el = document.getElementById(`scene-${cfg.id}`);
    if (!el) continue;
    const poster = el.querySelector(".scene__poster");
    const canvas = el.querySelector(".scene__canvas");
    const count = isMobile ? cfg.mobileFrames : cfg.frames;
    const scrub = count > 0 && !reduceMotion && hasGsap;
    const posterSrc = (isMobile && cfg.posterMobile) || cfg.poster;

    el.classList.add(scrub ? "scene--frames" : "scene--poster");
    // Poster hero sudah ada di HTML (LCP). Poster "contain" (piring mendarat) hanya untuk mode statis,
    // karena frame awal signature sengaja kosong (piring belum turun).
    if (poster && !poster.getAttribute("src") && (!scrub || cfg.fit !== "contain")) poster.src = posterSrc;
    if (poster && scrub && cfg.fit === "contain") poster.hidden = true;

    let seq = null;
    if (scrub) {
      seq = new FrameSequence(canvas, cfg.id, isMobile ? "mobile" : "desktop", count, cfg.fit);
      seq.onFirstDraw = () => el.classList.add("is-drawn");
    }
    scenes[cfg.id] = { el, poster, seq };
  }
  return scenes;
}

/* ============================================================
   Preloader — progress dari frame hero saja, maks 1.5 dtk
   ============================================================ */
function runPreloader(hero) {
  const pre = document.getElementById("preloader");
  if (!pre) return;
  const bar = pre.querySelector(".preloader__bar span");
  const done = () => pre.classList.add("is-done");
  setTimeout(done, PRELOADER_MAX_MS);

  if (hero?.seq) {
    const need = Math.min(PRELOAD_FIRST, hero.seq.count);
    hero.seq.onProgress = (loaded) => {
      bar.style.transform = `scaleX(${Math.min(loaded / need, 1)})`;
      if (loaded >= need) done();
    };
    hero.seq.start();
  } else if (hero?.poster) {
    const finish = () => { bar.style.transform = "scaleX(1)"; setTimeout(done, 150); };
    hero.poster.decode().then(finish, finish);
  } else done();
}

/* ============================================================
   Smooth scroll (ringan, tanpa snap)
   ============================================================ */
function setupLenis() {
  if (reduceMotion || !window.Lenis) return null;
  const lenis = new window.Lenis({ lerp: 0.1 });
  window.__lenis = lenis;
  if (hasGsap) {
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((t) => lenis.raf(t * 1000));
    window.gsap.ticker.lagSmoothing(0);
  } else {
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  return lenis;
}

/* ============================================================
   Count-up angka stats (hanya nilai yang mengandung angka)
   ============================================================ */
function countUp(el) {
  const m = el.textContent.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return;
  const [, pre, num, post] = m;
  const decimals = (num.split(/[.,]/)[1] || "").length;
  const sep = num.includes(",") ? "," : ".";
  const end = parseFloat(num.replace(",", "."));
  const obj = { v: 0 };
  window.gsap.to(obj, {
    v: end, duration: 1.4, ease: "power2.out",
    onUpdate: () => { el.textContent = pre + obj.v.toFixed(decimals).replace(".", sep) + post; }
  });
}

/* ============================================================
   Timeline scroll Home
   ============================================================ */
function animate(scenes) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("is-cinematic");
  const { bg, light } = RESTO.colors;
  const q = (s, root = document) => root.querySelector(s);

  // 1 · Hero (pinned): bara di-scrub, zoom 1→1.15, judul naik+membesar+memudar, akhir: fade/blur ke bg
  const hero = scenes.hero;
  if (hero) {
    const media = q(".hero__media", hero.el);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero.el, start: "top top", end: isMobile ? "+=70%" : "+=100%", pin: true, scrub: true,
        onUpdate: (self) => {
          hero.seq?.setProgress(self.progress);
          if (self.progress >= 0.5) scenes.signature?.seq?.start(); // scene berikutnya dimuat saat 50%
        }
      }
    });
    tl.fromTo(media, { scale: 1 }, { scale: 1.15, duration: 1 }, 0)
      .to(q(".hero__front", hero.el), { autoAlpha: 0, y: -24, duration: 0.3 }, 0.04)
      .to(q(".scroll-hint", hero.el), { autoAlpha: 0, duration: 0.1 }, 0)
      .fromTo(q(".hero__title", hero.el), { yPercent: 0, scale: 1, autoAlpha: 1 },
        { yPercent: -45, scale: 1.22, autoAlpha: 0, duration: 0.62 }, 0.08)
      .to(media, { filter: "blur(10px)", duration: 0.28 }, 0.72)
      .to(q(".hero__fade", hero.el), { opacity: 1, duration: 0.28 }, 0.72);
  }

  // 2 · Signature (pinned): piring turun & mendarat di depan judul raksasa, lalu teks masuk stagger
  const sig = scenes.signature;
  if (sig) {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sig.el, start: "top top", end: isMobile ? "+=90%" : "+=120%", pin: true, scrub: true,
        onEnter: () => sig.seq?.start(),
        onUpdate: (self) => sig.seq?.setProgress(self.progress / SIG_FRAMES_END)
      }
    });
    // judul raksasa sudah muncul saat section masuk layar → tidak ada jeda gelap kosong setelah hero
    gsap.fromTo(sig.el.querySelectorAll(".signature__giant span"), { autoAlpha: 0, yPercent: 24 }, {
      autoAlpha: 1, yPercent: 0, stagger: 0.08, ease: "power1.out",
      scrollTrigger: { trigger: sig.el, start: "top 85%", end: "top 15%", scrub: true }
    });
    // Piring belum terlihat sebelum pin dimulai; lalu turun dari atas layar (kotak canvas ikut digeser naik
    // di awal, karena frame pertama klip masih menampilkan tepi bawah piring).
    const media = q(".signature__media", sig.el);
    const plate = q(".scene__canvas", media);
    tl.fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.01)
      .fromTo(plate, { yPercent: -70 }, { yPercent: 0, duration: 0.34, ease: "power1.out" }, 0)
      .fromTo(media, { scale: 1.06 }, { scale: 1, duration: SIG_FRAMES_END }, 0)
      .from(sig.el.querySelectorAll(".signature__left > *, .signature__right > *:not([hidden])"),
        { autoAlpha: 0, y: 36, stagger: 0.04, duration: 0.14, ease: "power2.out" }, 0.68)
      .to({}, { duration: 0.08 }); // jeda singkat sebelum lepas pin
  }

  // Ritme warna: gelap (hero, signature) → krem (story, best, social) → gelap (CTA, footer)
  const story = q(".story");
  const cta = q(".cta");
  document.body.style.backgroundColor = bg;
  if (story) gsap.fromTo(document.body, { backgroundColor: bg }, {
    backgroundColor: light, ease: "none", immediateRender: false,
    scrollTrigger: { trigger: story, start: "top 75%", end: "top 45%", scrub: true }
  });
  if (cta) gsap.fromTo(document.body, { backgroundColor: light }, {
    backgroundColor: bg, ease: "none", immediateRender: false,
    scrollTrigger: { trigger: cta, start: "top 75%", end: "top 45%", scrub: true }
  });

  // 3 · Story & 6 · CTA: parallax berlapis (data-speed = yPercent)
  document.querySelectorAll("[data-speed]").forEach((el) => {
    const v = Number(el.dataset.speed);
    const section = el.closest("section");
    gsap.fromTo(el, { yPercent: -v }, {
      yPercent: v, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  document.querySelectorAll("[data-inner-speed]").forEach((img) => {
    gsap.fromTo(img, { yPercent: -Number(img.dataset.innerSpeed) }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: img.closest("section"), start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  if (story) gsap.from(story.querySelectorAll(".story__copy > *"), {
    y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power2.out",
    scrollTrigger: { trigger: story, start: "top 60%" }
  });
  const stats = q(".stats");
  if (stats && !stats.hidden) ScrollTrigger.create({
    trigger: stats, start: "top 85%", once: true,
    onEnter: () => stats.querySelectorAll("[data-count]").forEach(countUp)
  });

  // 4 · Best seller & judul section: masuk ringan dari bawah (kartu sudah pakai .reveal stagger)
  document.querySelectorAll(".best .section-head, .social__head").forEach((head) => {
    gsap.from(head.children, {
      y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: head, start: "top 80%" }
    });
  });

  // 6 · CTA form
  if (cta) gsap.from(cta.querySelectorAll(".cta__copy > *, #reservation-form"), {
    y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: "power2.out",
    scrollTrigger: { trigger: cta, start: "top 60%" }
  });

  // 7 · Footer "terbuka" dari bawah
  const footer = q(".footer");
  if (footer) gsap.from(footer.children, {
    yPercent: -18, autoAlpha: 0.3, ease: "none",
    scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: true }
  });

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ============================================================
   Hover foto Story: tilt 3D halus + kilau mengikuti kursor (desktop mouse saja)
   ============================================================ */
function wireStoryTilt() {
  if (reduceMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const MAX = 6; // derajat
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const fig = el.closest(".story__img");
    let raf = 0;
    el.addEventListener("pointerenter", () => fig.classList.add("is-hover"));
    el.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", `${(x - 0.5) * MAX * 2}deg`);
        el.style.setProperty("--rx", `${(0.5 - y) * MAX * 2}deg`);
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
      });
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      fig.classList.remove("is-hover");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

/* ============================================================
   init
   ============================================================ */
const scenes = setupScenes();
runPreloader(scenes.hero);
setupLenis();
if (hasGsap && !reduceMotion) animate(scenes);
wireStoryTilt();
