// Mini-sintetizador sobre WebAudio, sin dependencias ni archivos de audio.
// Expone dos primitivas (tono y ruido) que alcanzan para todos los efectos del juego:
// los tonos sirven para disparos, avisos y melodías cortas; el ruido para impactos y
// explosiones, que con osciladores solos suenan pobres.
//
// El volumen se controla en tres niveles: uno maestro y dos categorías, para poder
// bajar el ruido constante del combate sin perder los momentos importantes.

const STORAGE_KEY = 'survivorsAudio';

export const CATEGORIES = ['combat', 'events'];

const DEFAULTS = { master: 0.8, combat: 0.7, events: 0.9, muted: false };

let ctx = null;
let masterGain = null;
const categoryGains = {};
const settings = loadSettings();

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Solo aceptamos claves conocidas: si el formato guardado cambió, ignoramos el resto.
    if (saved && typeof saved === 'object') {
      return {
        master: clamp01(saved.master ?? DEFAULTS.master),
        combat: clamp01(saved.combat ?? DEFAULTS.combat),
        events: clamp01(saved.events ?? DEFAULTS.events),
        muted: Boolean(saved.muted),
      };
    }
  } catch {
    // Sin localStorage o con datos corruptos arrancamos con los valores por defecto.
  }
  return { ...DEFAULTS };
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Si no se puede guardar, los ajustes igual valen para esta partida.
  }
}

function clamp01(v) {
  return Math.min(1, Math.max(0, Number(v) || 0));
}

function applyGains() {
  if (masterGain) masterGain.gain.value = settings.muted ? 0 : settings.master;
  CATEGORIES.forEach((cat) => {
    if (categoryGains[cat]) categoryGains[cat].gain.value = settings[cat];
  });
}

// El AudioContext se crea perezosamente: los navegadores lo bloquean hasta que hay
// una interacción del usuario, así que no tiene sentido crearlo antes de tiempo.
function getContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Cada categoría cuelga del maestro, así el volumen general escala a todas.
  CATEGORIES.forEach((cat) => {
    const gain = ctx.createGain();
    gain.connect(masterGain);
    categoryGains[cat] = gain;
  });

  applyGains();
  return ctx;
}

// Se llama con la primera interacción del jugador (el menú), que es cuando el
// navegador permite arrancar el audio.
export function unlockAudio() {
  const context = getContext();
  if (context && context.state === 'suspended') context.resume();
}

export function getAudioSettings() {
  return { ...settings };
}

export function setVolume(key, value) {
  if (key !== 'master' && !CATEGORIES.includes(key)) return;
  settings[key] = clamp01(value);
  applyGains();
  saveSettings();
}

export function isMuted() {
  return settings.muted;
}

export function toggleMute() {
  settings.muted = !settings.muted;
  applyGains();
  saveSettings();
  return settings.muted;
}

// Envelope de ataque y caída, para que ninguna nota arranque o corte de golpe
// (un corte seco produce un "click" audible).
function envelope(gain, startAt, duration, volume) {
  const attack = Math.min(0.01, duration * 0.2);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
}

// Devuelve el nodo al que conectar según la categoría del efecto.
function outputFor(category) {
  return categoryGains[category] || masterGain;
}

// freqTo opcional: la frecuencia barre de `freq` a `freqTo` durante toda la nota,
// que es lo que da los sonidos que suben (level-up) o caen (daño recibido).
export function playTone({ freq, freqTo, type = 'square', duration = 0.1, volume = 0.2, delay = 0, category = 'events' }) {
  if (settings.muted) return;
  const context = getContext();
  if (!context) return;

  const startAt = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (freqTo && freqTo !== freq) {
    osc.frequency.exponentialRampToValueAtTime(freqTo, startAt + duration);
  }

  envelope(gain, startAt, duration, volume);

  osc.connect(gain);
  gain.connect(outputFor(category));
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playNoise({ duration = 0.1, volume = 0.2, filterFreq = 1200, delay = 0, category = 'events' }) {
  if (settings.muted) return;
  const context = getContext();
  if (!context) return;

  const startAt = context.currentTime + delay;
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) data[i] = Math.random() * 2 - 1;

  const source = context.createBufferSource();
  source.buffer = buffer;

  // Filtro pasa-bajos: sin él el ruido blanco suena a estática de TV.
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, startAt);

  const gain = context.createGain();
  envelope(gain, startAt, duration, volume);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(outputFor(category));
  source.start(startAt);
  source.stop(startAt + duration);
}
