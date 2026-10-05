// reservasi.js — form reservasi → WhatsApp (dipakai di Home section 6 & halaman Reservasi)
import { RESTO } from "./config.js";
import { jakartaNow, hoursFor, dayOfDate, addDays, fmtTime, waLink, esc, formatDate } from "./render.js";

const { maxPax, minHoursAhead, slotMinutes } = RESTO.reservation;
const form = document.getElementById("reservation-form");

/** Daftar slot jam (menit) yang valid untuk tanggal ISO tertentu */
function slotsFor(dateISO, now = jakartaNow()) {
  const h = hoursFor(dayOfDate(dateISO));
  if (!h || dateISO < now.date) return [];
  // slot terakhir = satu slot sebelum tutup
  const earliest = dateISO === now.date ? now.minutes + minHoursAhead * 60 : -Infinity;
  const tomorrowEarliest = addDays(now.date, 1) === dateISO ? now.minutes + minHoursAhead * 60 - 1440 : -Infinity;
  const slots = [];
  for (let t = h.open; t <= h.close - slotMinutes; t += slotMinutes) {
    if (t >= earliest && t >= tomorrowEarliest) slots.push(t);
  }
  return slots;
}

function buildMessage(data) {
  const lines = [
    `Halo ${RESTO.name}, saya mau reservasi:`,
    `Nama: ${data.name || "-"}`,
    `Tanggal: ${data.date ? formatDate(data.date) : "-"}`,
    `Jam: ${data.time !== "" && data.time != null ? fmtTime(Number(data.time)) : "-"}`,
    `Jumlah orang: ${data.pax || "-"}`
  ];
  if (data.note) lines.push(`Catatan: ${data.note}`);
  return lines.join("\n");
}

function readForm() {
  const f = form.elements;
  return {
    name: f.name.value.trim(),
    date: f.date.value,
    time: f.time.value,
    pax: f.pax.value.trim(),
    note: f.note ? f.note.value.trim() : ""
  };
}

/* ---------- UI slot jam ---------- */
function fillTimeOptions() {
  const select = form.elements.time;
  const date = form.elements.date.value;
  const prev = select.value;
  if (!date) {
    select.innerHTML = `<option value="">Pilih tanggal dulu</option>`;
    select.disabled = true;
    return;
  }
  const slots = slotsFor(date);
  if (!slots.length) {
    const closedDay = !hoursFor(dayOfDate(date));
    select.innerHTML = `<option value="">${closedDay ? "Tutup di hari ini — pilih tanggal lain" : "Slot habis — pilih tanggal lain"}</option>`;
    select.disabled = true;
    return;
  }
  select.disabled = false;
  select.innerHTML = `<option value="">Pilih jam</option>` +
    slots.map((t) => `<option value="${t}">${fmtTime(t)}</option>`).join("");
  if (slots.includes(Number(prev))) select.value = prev;
}

/* ---------- validasi ---------- */
function setError(field, msg) {
  const el = form.querySelector(`[data-error-for="${field}"]`);
  const input = form.elements[field];
  if (el) el.textContent = msg || "";
  if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
}

function validate(data) {
  const now = jakartaNow();
  const errors = {};
  if (data.name.length < 2) errors.name = "Isi nama pemesan.";
  if (!data.date) errors.date = "Pilih tanggal.";
  else if (data.date < now.date) errors.date = "Tanggal sudah lewat.";
  else if (!hoursFor(dayOfDate(data.date))) errors.date = "Kami tutup di tanggal ini.";

  if (!errors.date) {
    if (data.time === "") errors.time = "Pilih jam kedatangan.";
    else if (!slotsFor(data.date, now).includes(Number(data.time)))
      errors.time = `Jam harus di dalam jam buka dan minimal ${minHoursAhead} jam dari sekarang.`;
  }

  const pax = Number(data.pax);
  if (!data.pax || !Number.isInteger(pax) || pax < 1) errors.pax = "Isi jumlah orang (minimal 1).";
  else if (pax > maxPax) errors.pax = "group";
  return errors;
}

function showErrors(errors) {
  for (const field of ["name", "date", "time", "pax"]) {
    if (field === "pax" && errors.pax === "group") {
      const el = form.querySelector('[data-error-for="pax"]');
      const href = waLink(`Halo ${RESTO.name}, saya mau tanya reservasi untuk acara/grup besar.`);
      el.innerHTML = `Lebih dari ${maxPax} orang? Untuk acara/grup besar, <a href="${esc(href)}" target="_blank" rel="noopener">chat langsung via WhatsApp</a>.`;
      form.elements.pax.setAttribute("aria-invalid", "true");
    } else setError(field, errors[field]);
  }
  const first = ["name", "date", "time", "pax"].find((f) => errors[f]);
  if (first) form.elements[first].focus();
}

function openInNewTab(href) {
  // anchor sementara: tetap dianggap aksi user sehingga tidak diblokir popup blocker
  const a = Object.assign(document.createElement("a"), { href, target: "_blank", rel: "noopener" });
  document.body.append(a);
  a.click();
  a.remove();
}

/* ---------- preview pesan (halaman Reservasi) ---------- */
/** Input date bawaan tidak bisa diformat → tampilkan "Sabtu, 10 Okt 2026" di bawah field */
function updateDateLabel() {
  const label = form.querySelector("[data-date-label]");
  if (label) label.textContent = form.elements.date.value ? formatDate(form.elements.date.value) : "";
}

function updatePreview() {
  const preview = document.getElementById("wa-preview");
  if (preview) preview.textContent = buildMessage(readForm());
}

function init() {
  if (!form) return;
  const today = jakartaNow().date;
  form.elements.date.min = today;
  form.elements.pax.placeholder = `1–${maxPax}`;
  fillTimeOptions();
  updateDateLabel();
  updatePreview();

  form.elements.date.addEventListener("change", () => { fillTimeOptions(); updateDateLabel(); setError("date", ""); updatePreview(); });
  form.addEventListener("input", (e) => {
    if (e.target.name) setError(e.target.name, "");
    updatePreview();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    fillTimeOptions(); // segarkan slot (waktu bisa sudah bergeser)
    const data = readForm();
    const errors = validate(data);
    if (Object.keys(errors).length) return showErrors(errors);
    openInNewTab(waLink(buildMessage(data)));
  });
}

init();
