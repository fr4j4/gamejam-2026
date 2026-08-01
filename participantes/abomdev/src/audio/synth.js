// Mini-sintetizador sobre WebAudio, sin dependencias ni archivos de audio.
// Expone dos primitivas (tono y ruido) que alcanzan para todos los efectos del juego:
// los tonos sirven para disparos, avisos y melodías cortas; el ruido para impactos y
// explosiones, que con osciladores solos suenan pobres.

const MUTE_KEY = 'survivorsMuted';

let ctx = null;
let masterGain = null;
let muted = loadMuted();

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    // Sin localStorage (ej. modo privado) arrancamos con sonido.
    return false;
  }
}

// El AudioContext se crea perezosamente: los navegadores lo bloquean hasta que hay
// una interacción del usuario, así que no tiene sentido crearlo antes de tiempo.
function getContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(ctx.destination);
  return ctx;
}

// Se llama con la primera tecla/clic del jugador, que es cuando el navegador
// permite arrancar el audio.
export function unlockAudio() {
  const context = getContext();
  if (context && context.state === 'suspended') context.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Si no se puede guardar, el mute igual funciona en esta partida.
  }
  return muted;
}

// Envelope de ataque y caída, para que ninguna nota arranque o corte de golpe
// (un corte seco produce un "click" audible).
function envelope(gain, startAt, duration, volume) {
  const attack = Math.min(0.01, duration * 0.2);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
}

// freqTo opcional: la frecuencia barre de `freq` a `freqTo` durante toda la nota,
// que es lo que da los sonidos que suben (level-up) o caen (daño recibido).
export function playTone({ freq, freqTo, type = 'square', duration = 0.1, volume = 0.2, delay = 0 }) {
  if (muted) return;
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
  gain.connect(masterGain);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playNoise({ duration = 0.1, volume = 0.2, filterFreq = 1200, delay = 0 }) {
  if (muted) return;
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
  gain.connect(masterGain);
  source.start(startAt);
  source.stop(startAt + duration);
}
