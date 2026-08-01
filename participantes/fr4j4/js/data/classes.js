// ===== CLASES =====
// Datos estructurados de las 5 clases jugables

const CLASSES = [
  {
    id: 'mago',
    name: 'Mago',
    icon: '🧙',
    color: 0x9fcafd,
    colorHex: '#9fcafd',
    hp: 25,
    armor: 0,
    style: 'Control / Burst',
    resource: 'Maná cap 7',
    heroPower: {
      name: 'Bola de Fuego',
      cost: 1,
      desc: '2 de daño directo',
      effects: [{ type: 'damage', target: 'enemy_hero', amount: 2 }]
    }
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    icon: '💀',
    color: 0xb388ff,
    colorHex: '#b388ff',
    hp: 30,
    armor: 0,
    style: 'Swarm / Desgaste',
    resource: 'Sangre',
    heroPower: {
      name: 'Invocar Esqueleto',
      cost: 1,
      desc: 'Invoca 1/1',
      effects: [{ type: 'summon', atk: 1, hp: 1 }]
    }
  },
  {
    id: 'guerrero',
    name: 'Guerrero',
    icon: '⚔️',
    color: 0xfaba72,
    colorHex: '#faba72',
    hp: 35,
    armor: 2,
    style: 'Tank / Control',
    resource: 'Armadura',
    heroPower: {
      name: 'Golpe de Armadura',
      cost: 1,
      desc: '1 daño a criatura + 1 armadura',
      effects: [
        { type: 'damage', target: 'enemy_creature', amount: 1 },
        { type: 'armor', target: 'self', amount: 1 }
      ]
    }
  },
  {
    id: 'asesino',
    name: 'Asesino',
    icon: '🗡️',
    color: 0xff6b6b,
    colorHex: '#ff6b6b',
    hp: 28,
    armor: 0,
    style: 'Aggro / Burst',
    resource: 'Veneno',
    heroPower: {
      name: 'Navaja',
      cost: 1,
      desc: '1 daño directo (2 si veneno)',
      effects: [{ type: 'damage_conditional', target: 'enemy_hero', base: 1, bonus: 1, condition: 'enemy_venom' }]
    }
  },
  {
    id: 'bardo',
    name: 'Bardo',
    icon: '🎭',
    color: 0xbdcd9c,
    colorHex: '#bdcd9c',
    hp: 30,
    armor: 0,
    style: 'Disrupción / Combo',
    resource: 'Inspiración',
    heroPower: {
      name: 'Nota Molesta',
      cost: 1,
      desc: '1 de daño directo',
      effects: [{ type: 'damage', target: 'enemy_hero', amount: 1 }]
    }
  }
];

window.CLASSES = CLASSES;

function getStarterDeck(classId) {
  const cards = ALL_CARDS[classId] || [];
  const maxTotal = cards.reduce((s, c) => s + (c.maxCopies || 2), 0);
  const target = Math.min(20, maxTotal);
  const result = {};
  let total = 0;
  for (const c of cards) {
    if (total >= target) break;
    const copies = Math.min(c.maxCopies || 2, 2);
    result[c.id] = copies;
    total += copies;
  }
  if (total < target) {
    const sorted = [...cards].sort((a, b) => (a.cost || 0) - (b.cost || 0));
    for (const c of sorted) {
      if (total >= target) break;
      const room = (c.maxCopies || 2) - (result[c.id] || 0);
      if (room <= 0) continue;
      const add = Math.min(room, target - total);
      result[c.id] = (result[c.id] || 0) + add;
      total += add;
    }
  }
  return { cards: result };
}

function ensureStarterDecks() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem('deckstiny_decks') || '{}') || {}; } catch (e) { raw = {}; }
  let changed = false;
  for (const cls of CLASSES) {
    if (!raw[cls.id] || !Array.isArray(raw[cls.id]) || raw[cls.id].length === 0) {
      raw[cls.id] = [{ name: 'INICIAL', cards: getStarterDeck(cls.id).cards }];
      changed = true;
    }
  }
  if (changed) localStorage.setItem('deckstiny_decks', JSON.stringify(raw));
  return raw;
}

window.getStarterDeck = getStarterDeck;
window.ensureStarterDecks = ensureStarterDecks;