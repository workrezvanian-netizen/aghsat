// تبدیل شمسی <-> میلادی (الگوریتم استاندارد jalaali-js / Borkowski) + کمکی‌های سررسید
// همون منطقِ نسخه‌ی قبلیِ db.py (پایتون)، پورت‌شده به جاوااسکریپت.

function div(a, b) { return Math.trunc(a / b); }
function mod(a, b) { return a - Math.trunc(a / b) * b; }

const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
  1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
];

function jalCal(jy) {
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14, jp = breaks[0];
  if (jy < jp || jy >= breaks[bl - 1]) throw new Error("Invalid Jalaali year " + jy);
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5)
    + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let jd, jm, k;
  k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

function toJalaali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }

const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function pad2(n) { return String(n).padStart(2, "0"); }
function dateToISO(gy, gm, gd) { return `${gy}-${pad2(gm)}-${pad2(gd)}`; }
function isoToParts(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { gy: y, gm: m, gd: d };
}

function isoDiffDays(isoA, isoB) {
  const a = isoToParts(isoA), b = isoToParts(isoB);
  const da = Date.UTC(a.gy, a.gm - 1, a.gd);
  const db_ = Date.UTC(b.gy, b.gm - 1, b.gd);
  return Math.round((da - db_) / 86400000);
}

function formatJalali(iso) {
  const { gy, gm, gd } = isoToParts(iso);
  const j = toJalaali(gy, gm, gd);
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

function parseJalaliDate(text) {
  const cleaned = String(text).trim().replace(/\//g, "-");
  const parts = cleaned.split("-");
  if (parts.length !== 3) throw new Error("invalid format");
  const [jy, jm, jd] = parts.map(Number);
  const g = toGregorian(jy, jm, jd);
  return dateToISO(g.gy, g.gm, g.gd);
}

// سررسیدِ همین ماه شمسی (بدون رول به ماه بعد) — برای نمایش
function thisMonthDueDate(dueType, dueValue, todayIso) {
  if (dueType === "once") return dueValue;
  const { gy, gm, gd } = isoToParts(todayIso);
  const todayJ = toJalaali(gy, gm, gd);
  const day = parseInt(dueValue, 10);
  const g = toGregorian(todayJ.jy, todayJ.jm, day);
  return dateToISO(g.gy, g.gm, g.gd);
}

// سررسیدِ بعدی (رول‌خورده به ماه بعد اگه گذشته باشه) — فقط برای زمان‌بندیِ یادآوری
function nextDueDate(dueType, dueValue, todayIso) {
  if (dueType === "once") return dueValue;
  const { gy, gm, gd } = isoToParts(todayIso);
  const todayJ = toJalaali(gy, gm, gd);
  const day = parseInt(dueValue, 10);
  let { jy, jm } = todayJ;
  let g = toGregorian(jy, jm, day);
  let candidateIso = dateToISO(g.gy, g.gm, g.gd);
  if (isoDiffDays(candidateIso, todayIso) < 0) {
    jm += 1;
    if (jm > 12) { jm = 1; jy += 1; }
    g = toGregorian(jy, jm, day);
    candidateIso = dateToISO(g.gy, g.gm, g.gd);
  }
  return candidateIso;
}

function currentJalaliMonthBounds(todayIso) {
  const { gy, gm, gd } = isoToParts(todayIso);
  const todayJ = toJalaali(gy, gm, gd);
  const start = toGregorian(todayJ.jy, todayJ.jm, 1);
  let ny = todayJ.jy, nm = todayJ.jm + 1;
  if (nm > 12) { nm = 1; ny += 1; }
  const next = toGregorian(ny, nm, 1);
  return {
    monthStart: dateToISO(start.gy, start.gm, start.gd),
    nextMonthStart: dateToISO(next.gy, next.gm, next.gd),
  };
}

function currentJalaliMonthName(todayIso) {
  const { gy, gm, gd } = isoToParts(todayIso);
  const j = toJalaali(gy, gm, gd);
  return JALALI_MONTH_NAMES[j.jm - 1];
}

const Jalaali = {
  toJalaali, toGregorian, dateToISO, isoToParts, isoDiffDays,
  formatJalali, parseJalaliDate, thisMonthDueDate, nextDueDate,
  currentJalaliMonthBounds, currentJalaliMonthName, JALALI_MONTH_NAMES,
};

if (typeof window !== 'undefined') { window.Jalaali = Jalaali; }

