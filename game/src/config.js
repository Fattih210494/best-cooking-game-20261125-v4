// Lentera Rasa — pasar malam 3D. Config: bahan, hidangan, stasiun, shift.
// Satu hidangan = 3 bahan + 1 stasiun. Masak pakai timing (zona perfect emas).
export const SHIFT_TIME = 150; // 2:30
export const TARGET_SCORE = 1500;
export const TARGET_PLATES = 10;
export const COOK_TIME = 6; // detik, jarum timing menyapu 0..1
export const PERFECT_ZONE = [0.55, 0.8]; // zona emas
export const GOOD_ZONE = [0.3, 0.95];
export const PATIENCE = 40; // detik kesabaran tiap pesanan
export const SAMBAL_BONUS = 50;

export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', key: '1', icon: 'rice' },
  { id: 'noodles', name: 'Noodles', key: '2', icon: 'noodles' },
  { id: 'satay', name: 'Satay', key: '3', icon: 'satay' },
  { id: 'greens', name: 'Greens', key: '4', icon: 'greens' },
  { id: 'egg', name: 'Egg', key: '5', icon: 'egg' },
  { id: 'chili', name: 'Chili', key: '6', icon: 'chili' },
  { id: 'broth', name: 'Broth', key: '7', icon: 'broth' },
  { id: 'lime', name: 'Lime', key: '8', icon: 'lime' },
];

export const STATIONS = [
  { id: 'mortar', label: 'Mortar', sub: 'SAMBAL', x: -5.4, z: -1.6 },
  { id: 'wok', label: 'Wok Api', sub: 'WOK HEI', x: -1.9, z: -1.6 },
  { id: 'pot', label: 'Panci', sub: 'BROTH', x: 1.9, z: -1.6 },
  { id: 'grill', label: 'Grill Arang', sub: 'SEAR', x: 5.4, z: -1.6 },
];

export const DISHES = {
  nasiGoreng: { id: 'nasiGoreng', name: 'Nasi Goreng', price: 180, station: 'wok', needs: ['rice', 'egg', 'chili'], icon: 'nasiGoreng', tag: 'SAMBAL x3' },
  satayPlatter: { id: 'satayPlatter', name: 'Satay Platter', price: 170, station: 'grill', needs: ['satay', 'chili', 'lime'], icon: 'satayPlatter', tag: 'SAMBAL x3' },
  volcanoMee: { id: 'volcanoMee', name: 'Volcano Mee', price: 220, station: 'wok', needs: ['noodles', 'chili', 'egg'], icon: 'volcanoMee', tag: 'SAMBAL x3' },
  limeBroth: { id: 'limeBroth', name: 'Lime Broth', price: 190, station: 'pot', needs: ['broth', 'greens', 'lime'], icon: 'limeBroth', tag: 'VIP 1.5x' },
  chiliGreens: { id: 'chiliGreens', name: 'Chili Greens', price: 150, station: 'pot', needs: ['greens', 'chili', 'lime'], icon: 'chiliGreens', tag: 'SAMBAL x3' },
  soyNoodles: { id: 'soyNoodles', name: 'Soy Noodles', price: 165, station: 'wok', needs: ['noodles', 'egg', 'greens'], icon: 'soyNoodles', tag: 'SAMBAL x3' },
  emberLaksa: { id: 'emberLaksa', name: 'Ember Laksa', price: 260, station: 'pot', needs: ['broth', 'noodles', 'satay'], icon: 'emberLaksa', tag: 'SAMBAL x3' },
  sultanFeast: { id: 'sultanFeast', name: 'Sultan Feast', price: 340, station: 'grill', needs: ['satay', 'rice', 'egg'], icon: 'sultanFeast', tag: 'VIP 1.5x' },
};
export const DISH_LIST = Object.values(DISHES);

// 4 pelanggan di belakang counter (x, z) — karakter pasar malam Indonesia.
export const CUSTOMERS = [
  { slot: 0, x: -5.6, z: -4.0, kind: 'batik' },   // pria batik + topi
  { slot: 1, x: -1.9, z: -4.0, kind: 'hijab' },  // wanita berhijab
  { slot: 2, x: 1.9, z: -4.0, kind: 'peci' },    // bapak berkacamata + peci
  { slot: 3, x: 5.6, z: -4.0, kind: 'ponytail' },// gadis ponytail
];

export const PLATING_SLOTS = [
  { id: 0, x: -1.1, z: 1.7 },
  { id: 1, x: 1.1, z: 1.7 },
];
