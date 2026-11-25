// Lentera Rasa — main.js: logika game, loop Three.js, HUD, input.
import { INGREDIENTS, STATIONS, DISHES, DISH_LIST, CUSTOMERS, PLATING_SLOTS, SHIFT_TIME, TARGET_SCORE, TARGET_PLATES, COOK_TIME, PERFECT_ZONE, GOOD_ZONE, PATIENCE, SAMBAL_BONUS } from './config.js';
import { buildWorld, makeFood } from './world.js';

const $ = (s) => document.querySelector(s);
const stage = $('#stage');
const canvas = $('#game');

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(1280, 720, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1280 / 720, 0.1, 100);
camera.position.set(0, 6.7, 11.6);
camera.lookAt(0, 1.1, -1.7);

scene.add(new THREE.AmbientLight(0x1e293b, 0.75));
const hemi = new THREE.HemisphereLight(0x93c5fd, 0x451a03, 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe7c2, 1.4);
sun.position.set(6, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
scene.add(sun);
const lanternLight = new THREE.PointLight(0xff9a3d, 1.7, 18);
lanternLight.position.set(0, 4.2, -2.5);
scene.add(lanternLight);
// sorot hangat ke wajah pelanggan (dari depan-atas)
const faceLight = new THREE.SpotLight(0xffd9a0, 1.5, 16, 0.7, 0.5, 1.2);
faceLight.position.set(0, 5.5, 2.5);
faceLight.target.position.set(0, 2.2, -4);
scene.add(faceLight);
scene.add(faceLight.target);
const fireLight = new THREE.PointLight(0xff6b1a, 1.4, 7);
fireLight.position.set(-1.9, 2.2, -1.0);
scene.add(fireLight);

const W = buildWorld(scene);

// ---------- state ----------
const S = {
  phase: 'start', // start | playing | paused | menu | over
  timeLeft: SHIFT_TIME,
  score: 0, served: 0, combo: 0, bestCombo: 0, perfects: 0, wokHei: 0,
  holding: [], // ingredient ids, max 3
  sambal: 0, // jumlah sambal siap (dari mortar)
  orders: [], // {dish, patience, max, id}
  deck: [],
  stations: {}, // id -> {mode:'idle'|'cooking'|'ready', dish, t, quality}
  plating: [null, null], // dishId | null
  chefTargetX: 0,
  won: false,
  sfx: true,
};
for (const st of STATIONS) S.stations[st.id] = { mode: 'idle', dish: null, t: 0, quality: null };
let orderSeq = 0;

// ---------- audio (WebAudio, tanpa file) ----------
let actx = null;
function beep(freq, dur = 0.12, type = 'sine', vol = 0.15) {
  if (!S.sfx) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) { /* audio tidak tersedia — lanjut tanpa suara */ }
}
const sfxServe = () => { beep(660, 0.1); setTimeout(() => beep(880, 0.14), 90); };
const sfxPerfect = () => { beep(523, 0.09); setTimeout(() => beep(659, 0.09), 80); setTimeout(() => beep(784, 0.16), 160); };
const sfxError = () => beep(160, 0.18, 'square', 0.08);
const sfxCook = () => beep(440, 0.08, 'triangle', 0.1);

// ---------- util ----------
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function drawOrder() {
  if (!S.deck.length) S.deck = shuffle([...DISH_LIST]);
  let d = S.deck.pop();
  const current = S.orders.map((o) => o.dish.id);
  if (current.includes(d.id) && S.deck.length) { S.deck.push(d); d = S.deck.pop(); }
  return d;
}
function newOrder(slot) {
  S.orders[slot] = { dish: drawOrder(), patience: PATIENCE, max: PATIENCE, id: ++orderSeq };
}
function toast(msg, good = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (good ? ' good' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.className = ''; }, 1800);
}

// ---------- HUD ----------
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function dishIcon(id) { return `<svg class="ic"><use href="#ic-${DISHES[id].icon}"/></svg>`; }
function ingIcon(id) { return `<svg class="ic"><use href="#ic-${id}"/></svg>`; }

function renderOrders() {
  const wrap = $('#orders');
  wrap.innerHTML = S.orders.map((o, i) => {
    const d = o.dish;
    const pct = Math.max(0, (o.patience / o.max) * 100);
    const cls = pct > 50 ? '' : pct > 25 ? 'warn' : 'crit';
    return `<div class="ocard ${cls}" data-slot="${i}">
      <div class="oc-top"><span class="oc-num">#${String(i + 1).padStart(3, '0')}</span><span class="oc-tag">${d.tag}</span><span class="oc-price">+${d.price}</span></div>
      <div class="oc-body">${dishIcon(d.id)}<div class="oc-name">${d.name}</div></div>
      <div class="oc-bar"><div style="width:${pct}%"></div></div>
      <div class="oc-sec">${Math.ceil(o.patience)}s</div>
    </div>`;
  }).join('');
}
function renderHolding() {
  const h = $('#holding');
  const chips = S.holding.map((id) => `<span class="hold-chip">${ingIcon(id)} ${INGREDIENTS.find((x) => x.id === id).name}</span>`).join('');
  const sam = S.sambal ? `<span class="hold-chip sambal">🌶 Sambal x${S.sambal}</span>` : '';
  h.innerHTML = (chips || '<span class="hold-empty">Kosong — pilih bahan 1-8</span>') + sam;
  $('#binBtn').classList.toggle('has', S.holding.length > 0);
}
function renderPlating() {
  const wrap = $('#plating');
  wrap.innerHTML = S.plating.map((d, i) => {
    if (!d) return `<div class="plate-slot empty" data-slot="${i}"><div class="ps-label">PLATING ${i + 1}/2</div><div class="ps-empty">— kosong —</div></div>`;
    const dish = DISHES[d];
    return `<div class="plate-slot ready" data-slot="${i}"><div class="ps-label">✓ READY - SERVE!</div>${dishIcon(d)}<div class="ps-name">${dish.name}</div></div>`;
  }).join('');
}
function renderHUD() {
  $('#time').textContent = fmtTime(S.timeLeft);
  $('#time').classList.toggle('low', S.timeLeft <= 30);
  $('#score').textContent = S.score.toLocaleString('id-ID');
  $('#combo').textContent = 'x' + S.combo;
  $('#plates').textContent = S.served + '/' + TARGET_PLATES;
  $('#shiftName').textContent = 'SHIFT 2 - LANTERN RUSH';
  renderOrders(); renderHolding(); renderPlating();
}

// ---------- proyeksi 3D -> layar (untuk chip & bubble) ----------
const _v = new THREE.Vector3();
function project(x, y, z) {
  _v.set(x, y, z).project(camera);
  return { x: (_v.x * 0.5 + 0.5) * 1280, y: (-_v.y * 0.5 + 0.5) * 720, behind: _v.z > 1 };
}
// chip timing di atas stasiun + bubble pesanan di atas pelanggan
const chipEls = {};
for (const st of STATIONS) {
  const el = document.createElement('div');
  el.className = 'station-chip';
  el.style.display = 'none';
  $('#floatLayer').appendChild(el);
  chipEls[st.id] = el;
}
const bubbleEls = [];
for (let i = 0; i < 4; i++) {
  const el = document.createElement('div');
  el.className = 'cust-bubble';
  $('#floatLayer').appendChild(el);
  bubbleEls.push(el);
}
function updateFloaters() {
  for (const st of STATIONS) {
    const el = chipEls[st.id];
    const s = S.stations[st.id];
    if (S.phase !== 'playing' || s.mode === 'idle') { el.style.display = 'none'; continue; }
    const p = project(st.x, 3.15, st.z);
    if (p.behind) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.style.left = (p.x - 70) + 'px';
    el.style.top = (p.y - 20) + 'px';
    const prog = Math.min(1, s.t / COOK_TIME);
    const inGold = prog >= PERFECT_ZONE[0] && prog <= PERFECT_ZONE[1];
    const label = s.mode === 'ready' ? '✓ READY!' : inGold ? '★ PERFECT SEAR' : prog > GOOD_ZONE[1] ? '⚠ PULL NOW!' : 'MEMASAK…';
    el.innerHTML = `<div class="sc-label ${s.mode === 'ready' ? 'ready' : inGold ? 'gold' : ''}">${label}</div>
      <div class="sc-bar"><div class="sc-zone" style="left:${PERFECT_ZONE[0] * 100}%;width:${(PERFECT_ZONE[1] - PERFECT_ZONE[0]) * 100}%"></div><div class="sc-needle" style="left:${prog * 100}%"></div></div>`;
  }
  for (let i = 0; i < 4; i++) {
    const el = bubbleEls[i];
    const o = S.orders[i];
    const c = CUSTOMERS[i];
    if (S.phase !== 'playing' || !o) { el.style.display = 'none'; continue; }
    const p = project(c.x, 3.5, c.z);
    if (p.behind) { el.style.display = 'none'; continue; }
    el.style.display = 'flex';
    el.style.left = (p.x - 30) + 'px';
    el.style.top = (p.y - 30) + 'px';
    const pct = o.patience / o.max;
    el.style.borderColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
    el.innerHTML = dishIcon(o.dish.id);
  }
}

// ---------- steam (uap) ----------
const steamTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.75)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const steams = [];
for (const st of STATIONS) {
  if (st.id === 'mortar') continue;
  const grey = st.id === 'grill'; // asap arang abu-abu, uap masak putih
  const parts = [];
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false, color: grey ? 0x9ca3af : 0xffffff }));
    sp.position.set(st.x, 1.8, st.z);
    sp.scale.set(0.5, 0.5, 1);
    sp.userData = { off: Math.random(), speed: (grey ? 0.3 : 0.5) + Math.random() * 0.4 };
    scene.add(sp);
    parts.push(sp);
  }
  steams.push({ station: st.id, parts, grey });
}
// bara api beterbangan di atas wok
const emberGeo = new THREE.BufferGeometry();
const EMBERS = 18;
const emberPos = new Float32Array(EMBERS * 3);
const emberSeed = [];
for (let i = 0; i < EMBERS; i++) emberSeed.push(Math.random());
emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({ color: 0xffa500, size: 0.12, transparent: true, opacity: 0.95 }));
scene.add(embers);
function updateSteam(dt, t) {
  for (const s of steams) {
    const st = S.stations[s.station];
    const sx = STATIONS.find((x) => x.id === s.station).x;
    // grill: asap arang selalu naik; wok/panci: uap hanya saat memasak
    const active = s.grey ? true : (S.phase === 'playing' && st.mode !== 'idle');
    for (const sp of s.parts) {
      if (!active) { sp.material.opacity = 0; continue; }
      const cyc = ((t * sp.userData.speed + sp.userData.off) % 1);
      sp.position.y = 1.9 + cyc * (s.grey ? 1.8 : 1.3);
      sp.position.x = sx + Math.sin((t + sp.userData.off * 9)) * 0.15;
      sp.material.opacity = (s.grey ? 0.4 : 0.5) * (1 - cyc);
      const sc = (s.grey ? 0.6 : 0.4) + cyc * 0.9;
      sp.scale.set(sc, sc, 1);
    }
  }
  // bara api di atas wok (selalu menyala)
  const pos = embers.geometry.attributes.position;
  for (let i = 0; i < EMBERS; i++) {
    const cyc = ((t * 0.45 + emberSeed[i]) % 1);
    pos.array[i * 3] = -1.9 + Math.sin((emberSeed[i] * 20 + t * 2)) * 0.35 * (1 - cyc * 0.5);
    pos.array[i * 3 + 1] = 1.7 + cyc * 1.6;
    pos.array[i * 3 + 2] = -1.6 + Math.cos((emberSeed[i] * 17 + t * 1.6)) * 0.3;
  }
  pos.needsUpdate = true;
  embers.material.opacity = 0.5 + Math.sin(t * 7) * 0.3;
}

// ---------- sparkle saat sajikan ----------
const bursts = [];
function burstAt(x, y, z, color = 0xffd34d) {
  const geo = new THREE.BufferGeometry();
  const n = 26, pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2;
    vel.push([Math.cos(a) * Math.cos(e) * 2.4, Math.abs(Math.sin(e)) * 3 + 1, Math.sin(a) * Math.cos(e) * 2.4]);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.16, transparent: true, opacity: 1 }));
  scene.add(pts);
  bursts.push({ pts, vel, life: 0.9 });
}

// ---------- aksi game ----------
function startGame(preset) {
  Object.assign(S, {
    phase: 'playing', timeLeft: SHIFT_TIME, score: 0, served: 0, combo: 0, bestCombo: 0,
    perfects: 0, wokHei: 0, holding: [], sambal: 0, plating: [null, null], won: false,
  });
  for (const st of STATIONS) {
    S.stations[st.id] = { mode: 'idle', dish: null, t: 0, quality: null };
    const grp = W.stations[st.id];
    grp.traverse((o) => { if (o.userData.isFood) o.visible = false; });
  }
  // bersihkan makanan di piring plating
  for (const p of W.plates) {
    if (p.userData.food) { p.remove(p.userData.food); p.userData.food = null; }
  }
  S.deck = shuffle([...DISH_LIST]);
  S.orders = [];
  for (let i = 0; i < 4; i++) newOrder(i);
  $('#startOverlay').classList.add('hidden');
  $('#endOverlay').classList.add('hidden');
  $('#menuOverlay').classList.add('hidden');
  if (preset) Object.assign(S, preset);
  renderHUD();
}
function grabIngredient(id) {
  if (S.phase !== 'playing') return;
  if (S.holding.length >= 3) { toast('Tangan penuh (max 3 bahan)!'); sfxError(); return; }
  S.holding.push(id);
  beep(520, 0.06, 'triangle', 0.08);
  renderHolding();
}
function clearHolding() {
  S.holding = [];
  renderHolding();
}
function matchDish(stationId) {
  const held = [...S.holding];
  return DISH_LIST.find((d) => d.station === stationId && d.needs.every((n) => held.includes(n)));
}
function clickStation(id) {
  if (S.phase !== 'playing') return;
  const st = S.stations[id];
  S.chefTargetX = STATIONS.find((s) => s.id === id).x;
  if (id === 'mortar') {
    if (st.mode !== 'idle') return;
    if (!S.holding.includes('chili')) { toast('Mortar butuh Chili! (tombol 6)'); sfxError(); return; }
    S.holding.splice(S.holding.indexOf('chili'), 1);
    st.mode = 'cooking'; st.dish = 'sambal'; st.t = 0;
    sfxCook(); renderHolding();
    toast('Menumbuk sambal…');
    return;
  }
  if (st.mode === 'cooking') {
    // PULL — nilai timing
    const prog = Math.min(1, st.t / COOK_TIME);
    let q = 'good';
    if (prog >= PERFECT_ZONE[0] && prog <= PERFECT_ZONE[1]) q = 'perfect';
    else if (prog < GOOD_ZONE[0]) q = 'raw';
    else if (prog > GOOD_ZONE[1]) q = 'burnt';
    finishCook(id, q);
    return;
  }
  if (st.mode === 'ready') { finishCook(id, st.quality || 'good'); return; }
  // idle: mulai masak kalau bahan cocok
  if (!S.holding.length) { toast('Pilih bahan dulu (klik nampan / tombol 1-8)!'); sfxError(); return; }
  const dish = matchDish(id);
  if (!dish) { toast('Tidak cocok — cek Buku Menu (M)!'); sfxError(); return; }
  for (const n of dish.needs) S.holding.splice(S.holding.indexOf(n), 1);
  st.mode = 'cooking'; st.dish = dish.id; st.t = 0;
  sfxCook();
  renderHolding();
}
function finishCook(id, quality) {
  const st = S.stations[id];
  if (id === 'mortar') {
    S.sambal = Math.min(3, S.sambal + 1);
    st.mode = 'idle'; st.dish = null; st.t = 0;
    toast('Sambal siap! Hidangan berikutnya +50', true);
    beep(700, 0.1); renderHolding();
    return;
  }
  const dishId = st.dish;
  if (quality === 'burnt') {
    st.mode = 'idle'; st.dish = null; st.t = 0;
    S.combo = 0;
    toast('Gosong! Hidangan hangus.', false);
    sfxError(); renderHUD();
    return;
  }
  // cari slot plating kosong
  const slot = S.plating.indexOf(null);
  if (slot === -1) { toast('Plating penuh! Sajikan dulu (bel / F).'); sfxError(); return; }
  if (quality === 'perfect') { S.perfects++; S.wokHei++; sfxPerfect(); }
  else beep(600, 0.1);
  S.plating[slot] = dishId;
  W.plates[slot].userData.quality = quality;
  const food = makeFood(dishId);
  food.position.y = 0.08;
  W.plates[slot].add(food);
  W.plates[slot].userData.food = food;
  st.mode = 'idle'; st.dish = null; st.t = 0;
  if (quality === 'perfect') toast('★ PERFECT SEAR! Wok Hei x' + S.wokHei, true);
  else if (quality === 'raw') toast('Kurang matang — tetap disajikan (poin 50%).');
  else toast(DISHES[dishId].name + ' siap di-plating!', true);
  renderPlating();
}
function clickPlate(slot) {
  if (S.phase !== 'playing') return;
  const d = S.plating[slot];
  if (!d) return;
  // ambil kembali dari plating (buang ke bin = klik bin; klik piring = angkat kembali ke tangan? sederhanakan: klik piring kosongkan ke holding? tidak — klik piring = sajikan langsung kalau cocok)
  serveDish(d, slot);
}
function serveDish(dishId, slot) {
  const idx = S.orders.findIndex((o) => o.dish.id === dishId);
  if (idx === -1) { toast('Tidak ada yang pesan ' + DISHES[dishId].name + ' — tunggu pesanan!'); sfxError(); return; }
  const order = S.orders[idx];
  const quality = W.plates[slot].userData.quality || 'good';
  let pts = order.dish.price;
  if (quality === 'perfect') pts = Math.round(pts * 1.5);
  if (quality === 'raw') pts = Math.round(pts * 0.5);
  pts += S.combo * 15;
  if (S.sambal > 0) { pts += SAMBAL_BONUS; S.sambal--; toast('2x SAMBAL! +' + SAMBAL_BONUS, true); }
  S.score += pts;
  S.combo++;
  S.bestCombo = Math.max(S.bestCombo, S.combo);
  S.served++;
  S.plating[slot] = null;
  if (W.plates[slot].userData.food) { W.plates[slot].remove(W.plates[slot].userData.food); W.plates[slot].userData.food = null; }
  const c = CUSTOMERS[idx];
  burstAt(c.x, 2.6, c.z - 0.5);
  const cust = W.customers[idx];
  cust.userData.happy = 0.6;
  sfxServe();
  toast(`+${pts} ${order.dish.name} tersaji! Combo x${S.combo}`, true);
  newOrder(idx);
  renderHUD();
  checkWin();
}
function ringBell() {
  if (S.phase !== 'playing') return;
  const slot = S.plating.findIndex((d) => d !== null && S.orders.some((o) => o.dish.id === d));
  if (slot === -1) {
    if (S.plating.some((d) => d !== null)) toast('Bel berbunyi — tapi tidak ada pesanan yang cocok!');
    else toast('Bel berbunyi — plating masih kosong!');
    beep(300, 0.08, 'square', 0.06);
    return;
  }
  serveDish(S.plating[slot], slot);
}
function checkWin() {
  if (S.won) return;
  if (S.score >= TARGET_SCORE || S.served >= TARGET_PLATES) {
    S.won = true;
    endShift(true);
  }
}
function endShift(won) {
  S.phase = 'over';
  const el = $('#endOverlay');
  el.classList.remove('hidden');
  $('#endTitle').textContent = won ? '★ SHIFT SELESAI! ★' : 'Shift Berakhir';
  $('#endSub').textContent = won ? 'Target ' + TARGET_SCORE.toLocaleString('id-ID') + ' poin tercapai — pasar malam memujamu!' : 'Waktu habis — target ' + TARGET_SCORE.toLocaleString('id-ID') + ' poin belum tercapai.';
  $('#endStats').innerHTML = `
    <div><b>${S.score.toLocaleString('id-ID')}</b><span>SKOR</span></div>
    <div><b>${S.served}/${TARGET_PLATES}</b><span>PIRING</span></div>
    <div><b>x${S.bestCombo}</b><span>COMBO TERBAIK</span></div>
    <div><b>${S.perfects}</b><span>PERFECT SEAR</span></div>`;
  if (won) sfxPerfect(); else sfxError();
}

// ---------- input: klik canvas (raycast) ----------
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => {
  if (S.phase !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    const u = h.object.userData;
    if (u.stationId) { clickStation(u.stationId); return; }
    if (u.plateId !== undefined) { clickPlate(u.plateId); return; }
    if (u.customerSlot !== undefined) {
      const o = S.orders[u.customerSlot];
      if (o) {
        const slot = S.plating.findIndex((d) => d === o.dish.id);
        if (slot !== -1) serveDish(o.dish.id, slot);
        else toast(o.dish.name + ' belum ada di plating!');
      }
      return;
    }
  }
});

// ---------- input: HTML ----------
document.querySelectorAll('.ing-tile').forEach((el) => {
  el.addEventListener('click', () => grabIngredient(el.dataset.id));
});
$('#bellBtn').addEventListener('click', ringBell);
$('#binBtn').addEventListener('click', () => { clearHolding(); toast('Bahan dibuang.'); });
$('#menuBtn').addEventListener('click', openMenu);
$('#closeMenuBtn').addEventListener('click', closeMenu);
$('#sfxBtn').addEventListener('click', () => { S.sfx = !S.sfx; $('#sfxBtn').textContent = S.sfx ? 'SFX ON' : 'SFX OFF'; });
$('#shiftBtn').addEventListener('click', () => toast('Shift 2 - Lantern Rush • Target ' + TARGET_SCORE + ' poin • ' + fmtTime(S.timeLeft) + ' tersisa'));
$('#pauseBtn').addEventListener('click', togglePause);
$('#startBtn').addEventListener('click', () => startGame());
$('#againBtn').addEventListener('click', () => startGame());
document.querySelectorAll('.plate-slot').forEach((el) => {
  el.addEventListener('click', () => clickPlate(Number(el.dataset.slot)));
});
function togglePause() {
  if (S.phase === 'playing') { S.phase = 'paused'; $('#pauseBtn').textContent = '▶'; toast('Jeda — klik ▶ untuk lanjut'); }
  else if (S.phase === 'paused') { S.phase = 'playing'; $('#pauseBtn').textContent = 'II'; }
}
function openMenu() {
  if (S.phase !== 'playing' && S.phase !== 'paused') return;
  S._prevPhase = S.phase;
  S.phase = 'menu';
  $('#menuStats').innerHTML = `
    <div><b>${S.score.toLocaleString('id-ID')}</b><span>SKOR</span></div>
    <div><b>${S.served}/${TARGET_PLATES}</b><span>PIRING</span></div>
    <div><b>${Math.round((S.served / Math.max(1, S.served + 0)) * 100)}%</b><span>SINERGI</span></div>
    <div><b>x${S.wokHei}</b><span>WOK HEI</span></div>`;
  $('#menuOverlay').classList.remove('hidden');
}
function closeMenu() {
  $('#menuOverlay').classList.add('hidden');
  S.phase = S._prevPhase || 'playing';
}
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (S.phase === 'playing') {
    const ing = INGREDIENTS.find((x) => x.key === k);
    if (ing) { grabIngredient(ing.id); return; }
    if (k === ' ') { e.preventDefault(); const c = STATIONS.find((s) => S.stations[s.id].mode === 'cooking'); if (c) clickStation(c.id); return; }
    if (k === 'f') { ringBell(); return; }
    if (k === 'x') { clearHolding(); return; }
    if (k === 'm') { openMenu(); return; }
    if (k === 'p' || k === 'escape') { togglePause(); return; }
  } else if (S.phase === 'menu' && (k === 'm' || k === 'escape')) closeMenu();
  else if (S.phase === 'paused' && (k === 'p' || k === 'escape')) togglePause();
  else if (S.phase === 'start' && k === 'enter') startGame();
  else if (S.phase === 'over' && k === 'enter') startGame();
});

// ---------- loop ----------
const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  // cap 0.5 dtk: timer game tetap jalan walau render lambat (SwiftShader ~fps rendah)
  const dt = Math.min(0.5, clock.getDelta());
  const t = clock.elapsedTime;
  elapsed += dt;
  // lampion bergoyang + api berkedip
  for (const l of W.lanterns) l.rotation.z = Math.sin(t * 0.8 + l.userData.phase) * 0.06;
  lanternLight.intensity = 1.15 + Math.sin(t * 2.2) * 0.12;
  fireLight.intensity = 1.2 + Math.sin(t * 11) * 0.35 + Math.sin(t * 23) * 0.15;
  for (const f of W.flames) {
    f.children.forEach((c, i) => { c.scale.y = 0.85 + Math.sin(t * 9 + i * 1.7) * 0.25; });
  }
  for (const c of W.coals) c.children.forEach((b, i) => { b.material.emissiveIntensity = 0.9 + Math.sin(t * 3 + i) * 0.5; });
  // pelanggan: napas + lambaian + senang
  W.customers.forEach((c, i) => {
    c.position.y = Math.sin(t * 1.4 + i * 1.3) * 0.03;
    c.userData.armR.rotation.z = (c.userData.armR.userData.baseZ ?? -0.6) + Math.sin(t * 2 + i) * 0.12;
    if (c.userData.happy > 0) {
      c.userData.happy -= dt;
      c.position.y += Math.sin(t * 14) * 0.05;
    }
    const o = S.orders[i];
    if (o && o.patience < 10) c.rotation.z = Math.sin(t * 8) * 0.02;
    else c.rotation.z = 0;
  });
  // koki bergerak ke stasiun aktif + lebih hidup (ayun spatula besar, kepala miring)
  const chef = W.chef;
  const dx = S.chefTargetX - chef.position.x;
  chef.position.x += dx * Math.min(1, dt * 4);
  chef.position.y = Math.abs(dx) > 0.05 ? Math.abs(Math.sin(t * 10)) * 0.08 : 0;
  chef.userData.armR.rotation.z = -0.9 + Math.sin(t * 3) * 0.25;
  chef.rotation.z = Math.sin(t * 1.8) * 0.02;

  if (S.phase === 'playing') {
    S.timeLeft -= dt;
    if (S.timeLeft <= 0) { S.timeLeft = 0; renderHUD(); endShift(S.score >= TARGET_SCORE); }
    // pesanan: kesabaran berkurang
    let ordersChanged = false;
    S.orders.forEach((o, i) => {
      o.patience -= dt;
      if (o.patience <= 0) {
        S.combo = 0;
        toast(o.dish.name + ' keburu pergi — combo reset!');
        sfxError();
        newOrder(i);
        ordersChanged = true;
      }
    });
    // stasiun: masak berjalan
    for (const st of STATIONS) {
      const s = S.stations[st.id];
      if (s.mode === 'cooking') {
        s.t += dt;
        if (st.id === 'mortar' && s.t >= 2) { finishCook('mortar', 'good'); continue; }
        if (s.t >= COOK_TIME) { s.mode = 'ready'; s.quality = 'good'; s.t = COOK_TIME; beep(760, 0.12, 'triangle', 0.12); }
      } else if (s.mode === 'ready') {
        s.t += dt;
        if (s.t > COOK_TIME + 3) { // gosong kalau dibiarkan
          st.mode = 'idle'; st.dish = null; st.t = 0;
          S.combo = 0;
          toast('Gosong di ' + st.label + '!');
          sfxError();
        }
      }
    }
    renderHUD();
  }
  updateSteam(dt, t);
  updateFloaters();
  renderer.render(scene, camera);
}
animate();

// ---------- skala stage ----------
function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720);
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fit);
fit();
renderHUD();

// ---------- mode screenshot (?shot=) ----------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot === 'play') {
  startGame();
  // preset seperti referensi: skor jalan, 1 wajan masak di zona perfect, 2 plating siap
  S.score = 1640; S.combo = 3; S.bestCombo = 4; S.served = 6; S.timeLeft = 108;
  S.stations.wok = { mode: 'cooking', dish: 'nasiGoreng', t: COOK_TIME * 0.68, quality: null };
  S.plating = ['nasiGoreng', 'chiliGreens'];
  for (const [i, d] of S.plating.entries()) {
    const food = makeFood(d);
    food.position.y = 0.08;
    W.plates[i].add(food);
    W.plates[i].userData.food = food;
    W.plates[i].userData.quality = 'good';
  }
  S.holding = ['lime', 'greens'];
  S.orders[0].patience = 22; S.orders[1].patience = 31; S.orders[2].patience = 12; S.orders[3].patience = 38;
  renderHUD();
} else if (shot === 'end') {
  startGame();
  S.score = 2480; S.served = 9; S.bestCombo = 5; S.perfects = 4; S.wokHei = 8; S.timeLeft = 0;
  endShift(true);
}

// ---------- hook debug untuk playtest ----------
window.__game = {
  S,
  start: () => startGame(),
  grab: grabIngredient,
  station: clickStation,
  bell: ringBell,
  plate: clickPlate,
  project: (x, y, z) => {
    const p = project(x, y, z);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (p.x / 1280) * r.width, y: r.top + (p.y / 720) * r.height };
  },
  orders: () => S.orders.map((o) => o.dish.id),
  state: () => ({ phase: S.phase, score: S.score, served: S.served, combo: S.combo, timeLeft: Math.round(S.timeLeft), holding: [...S.holding], plating: [...S.plating], stations: Object.fromEntries(Object.entries(S.stations).map(([k, v]) => [k, v.mode])) }),
};
