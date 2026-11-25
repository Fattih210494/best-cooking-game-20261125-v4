// Lentera Rasa — world.js: stan pasar malam 3D (Three.js r149, procedural low-poly).
// Awning merah-putih, lampion menyala, 4 stasiun berapi, 4 pelanggan, koki, lantai ubin.
import { CUSTOMERS, STATIONS, PLATING_SLOTS } from './config.js';

function std(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...o });
}
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}
function checkerTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    const s = 64;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      g.fillStyle = (x + y) % 2 ? '#e8c890' : '#c98f4e';
      g.fillRect(x * s, y * s, s, s);
    }
    g.strokeStyle = 'rgba(120,72,30,0.5)'; g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
    }
  });
}
function batikTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7c2d12'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fbbf24'; g.lineWidth = 5;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = x * 64 + 32, cy = y * 64 + 32;
      g.beginPath(); g.arc(cx, cy, 18, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.stroke();
    }
    g.fillStyle = '#fbbf24';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g.fillRect(x * 64 + 60, y * 64 + 60, 6, 6);
  });
}

// ---------- pelanggan ----------
// Muka BESAR & jelas: s = pengali ukuran fitur terhadap kepala (kepala pelanggan r=0.58 -> s=1.32).
// expr: 'smile' | 'happy' (mata tertutup bahagia) | 'wow' (mulut terbuka) | 'wink'.
function makeFace(skin, opts = {}) {
  const s = opts.s || 1;
  const g = new THREE.Group();
  const eyeW = std(0xffffff), eyeB = std(0x1a1a1a);
  for (const sx of [-1, 1]) {
    if (opts.expr === 'happy' || (opts.expr === 'wink' && sx === 1)) {
      // mata tertutup bahagia: busur
      const arc = mesh(new THREE.TorusGeometry(0.09 * s, 0.022 * s, 8, 14, Math.PI), eyeB, sx * 0.21 * s, 0.06 * s, 0.5 * s);
      arc.rotation.z = 0;
      g.add(arc);
    } else {
      const e = mesh(new THREE.SphereGeometry(0.11 * s, 12, 12), eyeW, sx * 0.21 * s, 0.06 * s, 0.5 * s);
      e.scale.set(1, 1.25, 0.5); g.add(e);
      g.add(mesh(new THREE.SphereGeometry(0.058 * s, 10, 10), eyeB, sx * 0.21 * s, 0.06 * s, 0.56 * s));
      // kilau mata
      g.add(mesh(new THREE.SphereGeometry(0.02 * s, 8, 8), std(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5 }), sx * 0.21 * s - 0.02 * s, 0.09 * s, 0.6 * s));
    }
    const b = mesh(new THREE.BoxGeometry(0.17 * s, 0.035 * s, 0.02 * s), std(0x2a1a10), sx * 0.21 * s, 0.22 * s, 0.48 * s);
    b.rotation.z = sx * -0.12; g.add(b);
    const c = mesh(new THREE.SphereGeometry(0.075 * s, 10, 10), std(0xff9d9d), sx * 0.34 * s, -0.08 * s, 0.44 * s);
    c.scale.set(1, 0.7, 0.4); g.add(c);
  }
  g.add(mesh(new THREE.SphereGeometry(0.06 * s, 10, 10), skin, 0, -0.04 * s, 0.52 * s));
  if (opts.expr === 'wow') {
    // mulut terbuka kaget
    const mo = mesh(new THREE.SphereGeometry(0.09 * s, 12, 10), std(0x5b2121), 0, -0.16 * s, 0.48 * s);
    mo.scale.set(1, 1.25, 0.5); g.add(mo);
  } else {
    const smile = mesh(new THREE.TorusGeometry(0.16 * s, 0.028 * s, 8, 16, Math.PI * 0.85), std(0x7a3b22), 0, -0.13 * s, 0.49 * s);
    smile.rotation.z = Math.PI + (Math.PI - Math.PI * 0.85) / 2;
    smile.rotation.x = 0.15;
    g.add(smile);
  }
  if (opts.glasses) {
    const ring = std(0x222222, { metalness: 0.4, roughness: 0.4 });
    for (const sx of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.16 * s, 0.025 * s, 8, 24), ring, sx * 0.21 * s, 0.06 * s, 0.55 * s));
    g.add(mesh(new THREE.BoxGeometry(0.12 * s, 0.025 * s, 0.02 * s), ring, 0, 0.07 * s, 0.55 * s));
  }
  return g;
}

function makeCustomer(kind) {
  const g = new THREE.Group();
  const skins = { batik: 0xc98d5f, hijab: 0xf0c297, peci: 0x8a5a3b, ponytail: 0xe8b98a };
  const skin = std(skins[kind]);
  let torsoMat = std(0x888888);
  if (kind === 'batik') torsoMat = new THREE.MeshStandardMaterial({ map: batikTexture(), roughness: 0.85 });
  if (kind === 'hijab') torsoMat = std(0x0e7490);
  if (kind === 'peci') torsoMat = std(0x166534);
  if (kind === 'ponytail') torsoMat = std(0xdb2777);
  const torso = mesh(new THREE.CapsuleGeometry(0.55, 0.8, 6, 14), torsoMat, 0, 0.95, 0);
  torso.scale.z = 0.72;
  g.add(torso);
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.3, 12), skin, 0, 1.62, 0));
  // kepala BESAR + muka jelas (face group diposisikan di tengah kepala!)
  const head = mesh(new THREE.SphereGeometry(0.58, 24, 20), skin, 0, 2.08, 0);
  head.scale.set(0.95, 1.05, 0.92);
  g.add(head);
  const exprs = { batik: 'wow', hijab: 'happy', peci: 'smile', ponytail: 'wink' };
  const face = makeFace(skin, { glasses: kind === 'peci', s: 1.32, expr: exprs[kind] });
  face.position.set(0, 2.08, 0);
  g.add(face);
  if (kind === 'batik') {
    const hair = mesh(new THREE.SphereGeometry(0.58, 20, 16), std(0x2b1a12), 0, 2.3, -0.04);
    hair.scale.set(0.98, 0.72, 0.95);
    g.add(hair);
    g.add(mesh(new THREE.BoxGeometry(0.62, 0.2, 0.12), std(0x2b1a12), 0, 2.5, 0.36));
    // topi
    g.add(mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.16, 18), std(0x78350f), 0, 2.56, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.38, 0.58, 0.14, 18), std(0x92400e), 0, 2.68, 0));
  } else if (kind === 'hijab') {
    const hj = mesh(new THREE.SphereGeometry(0.66, 20, 16), std(0x7c3aed), 0, 2.14, -0.08);
    hj.scale.set(1.05, 1.1, 1.0);
    g.add(hj);
    const drape = mesh(new THREE.CylinderGeometry(0.58, 0.74, 0.8, 16), std(0x7c3aed), 0, 1.68, 0);
    g.add(drape);
    // tas tangan kecil
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.4, 0.12), std(0x92400e), -0.72, 0.62, 0.15));
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), std(0x92400e), -0.72, 0.9, 0.15));
  } else if (kind === 'peci') {
    const hair = mesh(new THREE.SphereGeometry(0.58, 20, 16), std(0xd6d3d1), 0, 2.3, -0.04);
    hair.scale.set(0.98, 0.6, 0.95);
    g.add(hair);
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.18, 16), std(0x111827), 0, 2.6, 0));
  } else {
    const hair = mesh(new THREE.SphereGeometry(0.58, 20, 16), std(0x3f2d20), 0, 2.32, -0.1);
    hair.scale.set(1.0, 0.7, 0.98);
    g.add(hair);
    const tail = mesh(new THREE.CapsuleGeometry(0.16, 0.65, 4, 10), std(0x3f2d20), 0.36, 2.1, -0.52);
    tail.rotation.x = 0.5; g.add(tail);
    g.add(mesh(new THREE.TorusGeometry(0.11, 0.035, 8, 14), std(0xfbbf24), 0.36, 2.42, -0.38));
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xffd34d, { metalness: 0.7 }), -0.52, 2.0, 0.2));
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xffd34d, { metalness: 0.7 }), 0.52, 2.0, 0.2));
  }
  // lengan: pose beda-beda tiap orang
  const armL = mesh(new THREE.CapsuleGeometry(0.14, 0.6, 4, 10), torsoMat, -0.62, 1.05, 0.05);
  if (kind === 'ponytail') { armL.rotation.z = 0.9; armL.position.set(-0.6, 0.95, 0.15); }
  else if (kind === 'batik') { armL.rotation.z = -0.7; armL.position.set(-0.62, 1.35, 0.1); }
  else armL.rotation.z = 0.25;
  g.add(armL);
  const armR = new THREE.Group();
  armR.position.set(0.62, 1.45, 0.1);
  armR.add(mesh(new THREE.CapsuleGeometry(0.14, 0.55, 4, 10), torsoMat, 0, 0.3, 0));
  armR.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), skin, 0, 0.66, 0));
  if (kind === 'batik') armR.rotation.z = -1.1; // kedua tangan terangkat kaget
  else armR.rotation.z = -0.6;
  armR.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.18, 8), skin, 0, 0.82, 0.02));
  armR.rotation.x = -0.25;
  armR.userData.baseZ = armR.rotation.z;
  g.add(armR);
  g.userData.armR = armR;
  g.userData.head = head;
  return g;
}

// ---------- koki ----------
function makeChef() {
  const g = new THREE.Group();
  const skin = std(0xf0c297);
  const jacket = mesh(new THREE.CapsuleGeometry(0.4, 0.55, 6, 14), std(0xf8fafc), 0, 0.85, 0);
  jacket.scale.z = 0.7;
  g.add(jacket);
  // celemek + syal merah
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.7, 0.06), std(0xdc2626), 0, 0.8, 0.3));
  g.add(mesh(new THREE.TorusGeometry(0.17, 0.05, 8, 18), std(0xdc2626), 0, 1.32, 0.2));
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.26, 12), skin, 0, 1.44, 0));
  // kepala BESAR + muka jelas
  const head = mesh(new THREE.SphereGeometry(0.45, 20, 16), skin, 0, 1.84, 0);
  head.scale.set(0.95, 1.05, 0.92);
  g.add(head);
  const face = makeFace(skin, { s: 1.0, expr: 'happy' });
  face.position.set(0, 1.84, 0);
  g.add(face);
  // topi koki
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.22, 16), std(0xffffff), 0, 2.18, 0));
  const puff = mesh(new THREE.SphereGeometry(0.44, 16, 12), std(0xffffff), 0, 2.38, 0);
  puff.scale.set(1, 0.7, 1); g.add(puff);
  // kumis
  const m = mesh(new THREE.TorusGeometry(0.11, 0.03, 8, 14, Math.PI), std(0x3f2d20), 0, 1.72, 0.4);
  m.rotation.z = Math.PI; g.add(m);
  // lengan + spatula
  const armR = new THREE.Group();
  armR.position.set(0.45, 1.15, 0.1);
  armR.add(mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 10), std(0xf8fafc), 0, 0.2, 0));
  const spat = new THREE.Group();
  spat.position.set(0, 0.45, 0.05);
  spat.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), std(0x78350f), 0, 0, 0));
  spat.add(mesh(new THREE.BoxGeometry(0.16, 0.22, 0.02), std(0xcbd5e1, { metalness: 0.7, roughness: 0.3 }), 0, 0.3, 0));
  armR.add(spat);
  armR.rotation.z = -0.9;
  g.add(armR);
  const armL = mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 10), std(0xf8fafc), -0.45, 1.0, 0.05);
  armL.rotation.z = 0.5; g.add(armL);
  g.userData.armR = armR;
  return g;
}

// ---------- makanan 3D di piring ----------
export function makeFood(dishId) {
  const g = new THREE.Group();
  const white = std(0xfff8ee);
  if (dishId === 'nasiGoreng') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.14, 18), std(0x92400e), 0, 0.07, 0));
    const rice = mesh(new THREE.SphereGeometry(0.26, 16, 12), std(0xf59e0b), 0, 0.16, 0);
    rice.scale.set(1, 0.5, 1); g.add(rice);
    const egg = mesh(new THREE.SphereGeometry(0.12, 12, 10), std(0xfff7d6), 0.1, 0.26, 0.05);
    egg.scale.set(1, 0.4, 1); g.add(egg);
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xf59e0b), 0.1, 0.28, 0.05));
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xdc2626), -0.16, 0.24, 0.08));
    g.add(mesh(new THREE.SphereGeometry(0.04, 8, 8), std(0x16a34a), 0.2, 0.24, -0.1));
  } else if (dishId === 'satayPlatter') {
    for (let i = 0; i < 3; i++) {
      const sk = new THREE.Group();
      const stick = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), std(0xd9a066), 0, 0.05, 0);
      stick.rotation.z = Math.PI / 2; sk.add(stick);
      for (let j = 0; j < 3; j++) sk.add(mesh(new THREE.BoxGeometry(0.12, 0.1, 0.1), std(0x92400e), -0.16 + j * 0.16, 0.05, 0));
      sk.position.set(0, 0.05, (i - 1) * 0.22);
      sk.rotation.y = (i - 1) * 0.15;
      g.add(sk);
    }
    g.add(mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.1, 12), std(0xb45309), 0.3, 0.05, 0.3));
  } else if (dishId === 'volcanoMee') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.16, 18), std(0x7c2d12), 0, 0.08, 0));
    for (let i = 0; i < 6; i++) {
      const n = mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12), std(0xfbbf24), (Math.random() - 0.5) * 0.3, 0.2, (Math.random() - 0.5) * 0.3);
      n.rotation.x = Math.PI / 2; g.add(n);
    }
    const lava = mesh(new THREE.SphereGeometry(0.14, 12, 10), std(0xdc2626, { emissive: 0x7f1d1d, emissiveIntensity: 0.6 }), 0, 0.26, 0);
    lava.scale.set(1, 0.5, 1); g.add(lava);
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xf59e0b), 0.1, 0.28, 0.05));
  } else if (dishId === 'limeBroth') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.18, 18), std(0x0e7490), 0, 0.09, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 18), std(0xa3e635), 0, 0.17, 0));
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0x16a34a), (i - 1) * 0.12, 0.2, (i % 2 ? 0.08 : -0.06)));
    const lime = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 14), std(0xbef264), 0.16, 0.21, 0.08);
    lime.rotation.x = Math.PI / 2; g.add(lime);
  } else if (dishId === 'chiliGreens') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.14, 18), std(0x166534), 0, 0.07, 0));
    for (let i = 0; i < 5; i++) {
      const leaf = mesh(new THREE.SphereGeometry(0.09, 8, 8), std(0x22c55e), (Math.random() - 0.5) * 0.3, 0.18, (Math.random() - 0.5) * 0.3);
      leaf.scale.set(1.4, 0.4, 0.8); g.add(leaf);
    }
    for (let i = 0; i < 3; i++) {
      const ch = mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.16, 8), std(0xdc2626), (i - 1) * 0.14, 0.22, 0.1);
      ch.rotation.z = (i - 1) * 0.4; g.add(ch);
    }
  } else if (dishId === 'soyNoodles') {
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.14, 18), std(0x451a03), 0, 0.07, 0));
    for (let i = 0; i < 7; i++) {
      const n = mesh(new THREE.TorusGeometry(0.08, 0.022, 6, 12), std(0xd97706), (Math.random() - 0.5) * 0.32, 0.18, (Math.random() - 0.5) * 0.32);
      n.rotation.x = Math.PI / 2; g.add(n);
    }
    const egg = mesh(new THREE.SphereGeometry(0.11, 12, 10), std(0xfff7d6), -0.1, 0.22, 0.05);
    egg.scale.set(1, 0.4, 1); g.add(egg);
    g.add(mesh(new THREE.SphereGeometry(0.045, 8, 8), std(0xf59e0b), -0.1, 0.24, 0.05));
  } else if (dishId === 'emberLaksa') {
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.18, 18), std(0x9a3412), 0, 0.09, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 18), std(0xea580c), 0, 0.17, 0));
    for (let i = 0; i < 4; i++) {
      const n = mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), std(0xfde68a), (Math.random() - 0.5) * 0.3, 0.2, (Math.random() - 0.5) * 0.3);
      n.rotation.x = Math.PI / 2; g.add(n);
    }
    g.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), std(0x92400e), 0.14, 0.22, -0.06));
  } else if (dishId === 'sultanFeast') {
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.1, 20), std(0xb45309, { metalness: 0.5, roughness: 0.4 }), 0, 0.05, 0));
    const rice = mesh(new THREE.SphereGeometry(0.2, 14, 10), std(0xf59e0b), -0.1, 0.14, 0.05);
    rice.scale.set(1, 0.5, 1); g.add(rice);
    for (let j = 0; j < 2; j++) g.add(mesh(new THREE.BoxGeometry(0.12, 0.1, 0.1), std(0x92400e), 0.14, 0.16, -0.08 + j * 0.18));
    const egg = mesh(new THREE.SphereGeometry(0.09, 12, 10), std(0xfff7d6), 0.14, 0.2, 0.12);
    egg.scale.set(1, 0.4, 1); g.add(egg);
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0x16a34a), -0.22, 0.18, -0.12));
  }
  // glossy: turunkan roughness semua bahan + titik kilau putih
  g.traverse((o) => {
    if (o.isMesh && o.material && 'roughness' in o.material) o.material.roughness = Math.min(o.material.roughness, 0.35);
  });
  const glossMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.15 });
  g.add(mesh(new THREE.SphereGeometry(0.035, 8, 8), glossMat, 0.16, 0.3, 0.14));
  g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), glossMat, -0.2, 0.26, 0.1));
  return g;
}

// ---------- sprite label stasiun (teks di atas stasiun) ----------
function makeLabelSprite(text, sub) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(30,16,8,0.88)';
  g.beginPath(); g.roundRect(4, 4, 248, 88, 18); g.fill();
  g.strokeStyle = '#fbbf24'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#fde68a'; g.font = 'bold 34px Georgia, serif';
  g.textAlign = 'center'; g.fillText(text, 128, 42);
  g.fillStyle = '#fca5a5'; g.font = 'bold 24px sans-serif';
  g.fillText(sub, 128, 74);
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(1.9, 0.71, 1);
  return spr;
}

// ---------- stasiun ----------
function makeStation(st) {
  const g = new THREE.Group();
  g.position.set(st.x, 0, st.z);
  // meja kayu stan
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.18, 1.9), std(0x8a5a33), 0, 1.0, 0));
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.9, 1.8), std(0x6b4423), 0, 0.5, 0));
  const top = new THREE.Group();
  top.position.y = 1.1;
  if (st.id === 'mortar') {
    top.add(mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.4, 18), std(0x57534e), 0, 0.2, 0));
    top.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18), std(0xdc2626), 0, 0.4, 0));
    for (let i = 0; i < 4; i++) top.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), std(0xb91c1c), (Math.random() - 0.5) * 0.4, 0.44, (Math.random() - 0.5) * 0.4));
    const pestle = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 10), std(0x78716c), 0.25, 0.55, 0.1);
    pestle.rotation.z = -0.5; top.add(pestle);
    top.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.35), std(0x16a34a), -0.75, 0.05, 0.4));
    for (let i = 0; i < 3; i++) top.add(mesh(new THREE.SphereGeometry(0.07, 8, 8), std(0xdc2626), -0.85 + i * 0.14, 0.1, 0.4));
  } else if (st.id === 'wok') {
    const burner = mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.25, 18), std(0x1f2937), 0, 0.12, 0);
    top.add(burner);
    const pan = mesh(new THREE.CylinderGeometry(0.68, 0.45, 0.22, 20), std(0x111827, { metalness: 0.6, roughness: 0.4 }), 0, 0.32, 0);
    top.add(pan);
    top.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 20), std(0x92400e), 0, 0.42, 0));
    // isi wajan kelihatan: tumpukan mie + telur + sayur (glossy)
    for (let i = 0; i < 5; i++) {
      const n = mesh(new THREE.TorusGeometry(0.11, 0.032, 6, 12), std(0xfbbf24, { roughness: 0.35 }), (Math.random() - 0.5) * 0.5, 0.46, (Math.random() - 0.5) * 0.5);
      n.rotation.x = Math.PI / 2; top.add(n);
    }
    const wokEgg = mesh(new THREE.SphereGeometry(0.13, 12, 10), std(0xfff7d6, { roughness: 0.3 }), 0.12, 0.5, 0.08);
    wokEgg.scale.set(1, 0.4, 1); top.add(wokEgg);
    top.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xf59e0b, { roughness: 0.3 }), 0.12, 0.53, 0.08));
    top.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), std(0x16a34a, { roughness: 0.35 }), -0.2, 0.48, -0.12));
    top.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xdc2626, { roughness: 0.35 }), 0.28, 0.48, -0.18));
    const handle = mesh(new THREE.BoxGeometry(0.7, 0.06, 0.1), std(0x111827), 0.9, 0.36, 0);
    top.add(handle);
    // api: kerucut menyala di sekeliling wajan (kelihatan dari depan)
    const flames = new THREE.Group();
    const fc = [0xf97316, 0xfbbf24, 0xef4444, 0xf97316, 0xfbbf24];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const cone = mesh(new THREE.ConeGeometry(0.2, 0.85, 8),
        new THREE.MeshStandardMaterial({ color: fc[i], emissive: fc[i], emissiveIntensity: 2.4, transparent: true, opacity: 0.95 }),
        Math.cos(a) * 0.52, 0.55, Math.sin(a) * 0.42);
      cone.castShadow = false;
      flames.add(cone);
    }
    // pijar api di bawah wajan
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: canvasTex(128, 128, (c) => {
        const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62);
        gr.addColorStop(0, 'rgba(255,120,20,0.9)');
        gr.addColorStop(1, 'rgba(255,120,20,0)');
        c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
      }), transparent: true, depthWrite: false,
    }));
    glow.scale.set(2.2, 1.4, 1);
    glow.position.set(0, 0.45, 0);
    flames.add(glow);
    flames.position.y = 0.1;
    top.add(flames);
    g.userData.flames = flames;
  } else if (st.id === 'pot') {
    top.add(mesh(new THREE.CylinderGeometry(0.55, 0.48, 0.5, 20), std(0x9aa5b1, { metalness: 0.75, roughness: 0.3 }), 0, 0.25, 0));
    top.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 20), std(0xfde68a), 0, 0.5, 0));
    const egg = mesh(new THREE.SphereGeometry(0.14, 12, 10), std(0xfff7d6), 0.1, 0.54, 0.05);
    egg.scale.set(1, 0.35, 1); top.add(egg);
    g.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), std(0xf59e0b), 0.1, 0.56, 0.05));
    const lid = mesh(new THREE.SphereGeometry(0.45, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x9aa5b1, { metalness: 0.75, roughness: 0.3 }), 0.7, 0.08, 0.3);
    lid.rotation.z = -0.6; top.add(lid);
  } else if (st.id === 'grill') {
    top.add(mesh(new THREE.BoxGeometry(1.5, 0.35, 0.9), std(0x1f2937), 0, 0.18, 0));
    for (let i = 0; i < 6; i++) top.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), std(0x6b7280, { metalness: 0.7 }), -0.6 + i * 0.24, 0.38, 0));
    for (let i = 0; i < 4; i++) {
      const sk = new THREE.Group();
      for (let j = 0; j < 3; j++) sk.add(mesh(new THREE.BoxGeometry(0.13, 0.09, 0.11), std(0x92400e, { roughness: 0.35 }), 0, 0.05, -0.14 + j * 0.14));
      const stick = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), std(0xd9a066), 0, 0.05, 0);
      stick.rotation.x = Math.PI / 2; sk.add(stick);
      sk.position.set(-0.55 + i * 0.36, 0.4, 0);
      top.add(sk);
    }
    // mangkuk sambal + kecap di sisi grill
    top.add(mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.12, 12), std(0x7c2d12), -0.85, 0.06, 0.55));
    top.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 12), std(0xdc2626, { roughness: 0.3 }), -0.85, 0.12, 0.55));
    top.add(mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.14, 12), std(0x451a03), 0.85, 0.07, 0.55));
    top.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12), std(0x78350f, { roughness: 0.3 }), 0.85, 0.14, 0.55));
    // bara menyala
    const coals = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      coals.add(mesh(new THREE.BoxGeometry(0.16, 0.08, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.2 }),
        (Math.random() - 0.5) * 1.2, 0.36, (Math.random() - 0.5) * 0.5));
    }
    top.add(coals);
    g.userData.coals = coals;
  }
  g.add(top);
  // nameplate kayu di depan meja stasiun (bukan melayang — tidak menutupi muka pelanggan)
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.52), new THREE.MeshStandardMaterial({ map: (() => canvasTex(340, 104, (c, w, h) => {
    c.fillStyle = '#451a03'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fbbf24'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#fde68a'; c.font = 'bold 40px Georgia, serif'; c.textAlign = 'center';
    c.fillText(st.label, w / 2, 46);
    c.fillStyle = '#fca5a5'; c.font = 'bold 26px sans-serif';
    c.fillText(st.sub, w / 2, 84);
  }))(), roughness: 0.7 }));
  plate.position.set(0, 0.55, 0.92);
  g.add(plate);
  g.userData.stationId = st.id;
  g.userData.top = top;
  g.traverse((o) => { o.userData.stationId = st.id; });
  return g;
}

// ---------- lampion ----------
function makeLantern(x, y, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const cord = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), std(0x1f2937), 0, 0.45, 0);
  cord.castShadow = false;
  g.add(cord);
  const body = mesh(new THREE.SphereGeometry(0.34, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.8, roughness: 0.5 }), 0, 0, 0);
  body.scale.y = 0.85;
  g.add(body);
  for (const ry of [-0.18, 0, 0.18]) {
    const ring = mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 20), std(0xdc2626), 0, ry, 0);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), std(0xfbbf24, { metalness: 0.6 }), 0, 0.32, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), std(0xfbbf24, { metalness: 0.6 }), 0, -0.34, 0));
  const tassel = mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.22, 8), std(0xdc2626), 0, -0.5, 0);
  g.add(tassel);
  // halo cahaya
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: canvasTex(128, 128, (c) => {
      const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(251,146,60,0.85)');
      gr.addColorStop(1, 'rgba(251,146,60,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false,
  }));
  halo.scale.set(2.4, 2.4, 1);
  g.add(halo);
  g.userData.phase = Math.random() * Math.PI * 2;
  return g;
}

// ---------- awning merah-putih ----------
function makeAwning() {
  const g = new THREE.Group();
  g.position.set(0, 5.6, -2.6);
  g.rotation.x = 0.42;
  const n = 16, w = 16.5 / n;
  for (let i = 0; i < n; i++) {
    const panel = mesh(new THREE.BoxGeometry(w + 0.02, 0.08, 3.4), std(i % 2 ? 0xf8fafc : 0xdc2626, { roughness: 0.9 }), -8.25 + w / 2 + i * w, 0, 0);
    g.add(panel);
  }
  // pinggir bergerigi (scallop)
  for (let i = 0; i < n; i++) {
    const sc = mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.08, 12, 1, false, 0, Math.PI), std(i % 2 ? 0xf8fafc : 0xdc2626), -8.25 + w / 2 + i * w, 0, 1.7);
    sc.rotation.x = Math.PI / 2;
    sc.rotation.z = Math.PI;
    g.add(sc);
  }
  // tiang penyangga
  for (const sx of [-7.8, 7.8]) {
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 5.8, 10), std(0x78350f), sx, -2.4, -1.2));
  }
  return g;
}

// ---------- dunia ----------
export function buildWorld(scene) {
  const refs = { customers: [], stations: {}, plates: [], lanterns: [], flames: [], coals: [], chef: null, steam: [] };

  // langit malam pekat + bintang
  scene.background = new THREE.Color(0x071224);
  scene.fog = new THREE.Fog(0x071224, 24, 42);
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 380; i++) starPos.push((Math.random() - 0.5) * 60, 6 + Math.random() * 14, -14 - Math.random() * 10);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.95 })));
  // bulan + halo
  const moon = mesh(new THREE.SphereGeometry(0.9, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfde68a, emissiveIntensity: 0.7 }), -10, 9.5, -13);
  moon.castShadow = false;
  scene.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: canvasTex(128, 128, (c) => {
      const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(253,230,138,0.5)');
      gr.addColorStop(1, 'rgba(253,230,138,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false,
  }));
  moonHalo.scale.set(5, 5, 1);
  moonHalo.position.set(-10, 9.5, -13);
  scene.add(moonHalo);

  // lantai ubin kotak
  const floorTex = checkerTexture();
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(5, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 20), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // dinding belakang stan (kayu gelap) + tanaman
  const backWall = mesh(new THREE.BoxGeometry(20, 3.4, 0.3), std(0x3f2d20), 0, 1.7, -6.2);
  scene.add(backWall);
  for (const x of [-9.5, -7.5, 9.5, 7.5]) {
    const bush = new THREE.Group();
    bush.position.set(x, 0, -5.6);
    bush.add(mesh(new THREE.SphereGeometry(0.8, 12, 10), std(0x166534), 0, 0.6, 0));
    bush.add(mesh(new THREE.SphereGeometry(0.55, 12, 10), std(0x22c55e), 0.5, 0.5, 0.15));
    scene.add(bush);
  }
  // pot tanaman di sisi
  for (const sx of [-1, 1]) {
    const pot = new THREE.Group();
    pot.position.set(sx * 8.6, 0, -2.5);
    pot.add(mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.6, 14), std(0xc96f3b), 0, 0.3, 0));
    pot.add(mesh(new THREE.SphereGeometry(0.55, 12, 10), std(0x16a34a), 0, 0.9, 0));
    pot.add(mesh(new THREE.SphereGeometry(0.4, 12, 10), std(0x22c55e), 0.3, 0.75, 0.1));
    scene.add(pot);
    // peti kayu
    const crate = new THREE.Group();
    crate.position.set(sx * 8.6, 0, 1.8);
    crate.add(mesh(new THREE.BoxGeometry(1.1, 0.7, 1.1), std(0x8a5a33), 0, 0.35, 0));
    crate.add(mesh(new THREE.BoxGeometry(1.0, 0.5, 1.0), std(0xd97706), 0, 0.9, 0));
    scene.add(crate);
  }

  // awning + lampion gantung (awning tidak melempar bayangan ke muka pelanggan)
  const awn = makeAwning();
  awn.traverse((o) => { o.castShadow = false; });
  scene.add(awn);
  const lanternXs = [-6.8, -4.2, -1.4, 1.4, 4.2, 6.8];
  for (const x of lanternXs) {
    const l = makeLantern(x, 3.85, -2.7, 1.15);
    scene.add(l);
    refs.lanterns.push(l);
  }
  // lampu string di bawah awning
  const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 2.4 });
  for (let i = 0; i <= 24; i++) {
    const x = -8 + i * (16 / 24);
    const y = 4.15 - Math.sin((i / 24) * Math.PI) * 0.35;
    const b = new THREE.Mesh(bulbGeo, bulbMat);
    b.position.set(x, y, -3.0);
    scene.add(b);
  }

  // pelanggan
  for (const c of CUSTOMERS) {
    const cust = makeCustomer(c.kind);
    cust.position.set(c.x, 0, c.z);
    cust.scale.setScalar(1.25);
    cust.userData.slot = c.slot;
    scene.add(cust);
    refs.customers.push(cust);
    cust.traverse((o) => { o.userData.customerSlot = c.slot; });
  }

  // meja stan panjang (counter kayu)
  const stall = new THREE.Group();
  stall.position.set(0, 0, -1.6);
  stall.add(mesh(new THREE.BoxGeometry(15.5, 1.0, 2.0), std(0x8a5a33), 0, 0.55, 0));
  stall.add(mesh(new THREE.BoxGeometry(15.8, 0.14, 2.2), std(0xa9743f), 0, 1.1, 0));
  // papan nama stan
  const signTex = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#451a03'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fbbf24'; g.font = 'bold 64px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('★  LENTERA RASA  ★', w / 2, h / 2);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.65), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }));
  sign.position.set(0, 0.55, 1.02);
  stall.add(sign);
  scene.add(stall);

  // stasiun
  for (const st of STATIONS) {
    const s = makeStation(st);
    scene.add(s);
    refs.stations[st.id] = s;
    if (s.userData.flames) refs.flames.push(s.userData.flames);
    if (s.userData.coals) refs.coals.push(s.userData.coals);
  }
  // properti kecil di atas counter antar stasiun (mangkuk jeruk, tumpukan piring, mangkuk saus)
  const stallProps = [
    { x: -3.65, build: (g) => { g.add(mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.2, 14), std(0x166534), 0, 0.1, 0)); for (let i = 0; i < 4; i++) g.add(mesh(new THREE.SphereGeometry(0.11, 10, 8), std(0x84cc16), (Math.random() - 0.5) * 0.35, 0.24, (Math.random() - 0.5) * 0.3)); } },
    { x: 0, build: (g) => { for (let i = 0; i < 4; i++) g.add(mesh(new THREE.CylinderGeometry(0.32 - i * 0.02, 0.32 - i * 0.02, 0.05, 18), std(0xffffff, { roughness: 0.3 }), 0, 0.03 + i * 0.055, 0)); } },
    { x: 3.65, build: (g) => { g.add(mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.18, 14), std(0x7c2d12), 0, 0.09, 0)); g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 14), std(0xdc2626), 0, 0.18, 0)); g.add(mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.18, 14), std(0x166534), 0.55, 0.09, 0.1)); g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 14), std(0x16a34a), 0.55, 0.18, 0.1)); } },
  ];
  for (const p of stallProps) {
    const g = new THREE.Group();
    g.position.set(p.x, 1.18, -1.6);
    p.build(g);
    scene.add(g);
  }

  // meja plating rendah di depan + 2 piring
  const ptable = new THREE.Group();
  ptable.position.set(0, 0, 1.7);
  ptable.add(mesh(new THREE.BoxGeometry(4.4, 0.14, 1.6), std(0x8a5a33), 0, 0.85, 0));
  ptable.add(mesh(new THREE.BoxGeometry(4.2, 0.75, 1.4), std(0x6b4423), 0, 0.42, 0));
  scene.add(ptable);
  for (const p of PLATING_SLOTS) {
    const plate = new THREE.Group();
    plate.position.set(p.x, 0.95, p.z);
    plate.add(mesh(new THREE.CylinderGeometry(0.5, 0.36, 0.07, 22), std(0xffffff, { roughness: 0.3 }), 0, 0.035, 0));
    const rim = mesh(new THREE.TorusGeometry(0.45, 0.03, 8, 22), std(0xfbbf24, { metalness: 0.6, roughness: 0.35 }), 0, 0.07, 0);
    rim.rotation.x = Math.PI / 2;
    plate.add(rim);
    plate.userData.plateId = p.id;
    plate.traverse((o) => { o.userData.plateId = p.id; });
    scene.add(plate);
    refs.plates.push(plate);
  }

  // koki
  refs.chef = makeChef();
  refs.chef.position.set(0, 0, 0.6);
  scene.add(refs.chef);

  // nampan bahan depan (dekorasi 3D): mangkuk nasi, mie, sate, sayur
  const frontProps = [
    { x: -6.4, build: (t) => { t.add(mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.3, 16), std(0x2f6fb2), 0, 0.95, 0)); const r = mesh(new THREE.SphereGeometry(0.42, 14, 10), std(0xfff8ee), 0, 1.0, 0); r.scale.set(1, 0.45, 1); t.add(r); } },
    { x: -3.8, build: (t) => { t.add(mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.3, 16), std(0x7c2d12), 0, 0.95, 0)); for (let i = 0; i < 4; i++) { const n = mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), std(0xfbbf24), (Math.random() - 0.5) * 0.4, 1.05, (Math.random() - 0.5) * 0.3); n.rotation.x = Math.PI / 2; t.add(n); } } },
    { x: 3.8, build: (t) => { for (let i = 0; i < 3; i++) t.add(mesh(new THREE.BoxGeometry(0.4, 0.2, 0.28), std(0x92400e), (i - 1) * 0.4, 0.9, (i % 2 ? 0.12 : -0.08))); } },
    { x: 6.4, build: (t) => { for (let i = 0; i < 4; i++) t.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), std(0x16a34a), (Math.random() - 0.5) * 0.8, 0.92, (Math.random() - 0.5) * 0.4)); } },
  ];
  for (const f of frontProps) {
    const tray = new THREE.Group();
    tray.position.set(f.x, 0, 3.6);
    tray.add(mesh(new THREE.BoxGeometry(1.7, 0.1, 1.1), std(0xf5e6c8), 0, 0.75, 0));
    tray.add(mesh(new THREE.BoxGeometry(1.6, 0.6, 1.0), std(0x8a5a33), 0, 0.4, 0));
    f.build(tray);
    scene.add(tray);
  }

  return refs;
}
