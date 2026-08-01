// Catálogo de efectos. La escena solo dice QUÉ pasó (`playSfx('hit')`); cómo suena
// y cada cuánto puede repetirse se decide acá.
//
// El throttle no es un detalle menor: con las armas subidas el juego puede pedir un
// impacto 20+ veces por segundo (aura + orbe + ráfaga + onda pegando a la vez). Sin
// límite eso es un estruendo ilegible además de costoso. Los efectos frecuentes van
// con volumen bajo y throttle corto; los raros suenan siempre y más presentes.

import { playNoise, playTone } from './synth.js';

const SFX = {
  // --- Frecuentes: bajos y con throttle ---
  shoot: {
    throttleMs: 90,
    play: () => playTone({ freq: 620, freqTo: 440, type: 'square', duration: 0.05, volume: 0.05, category: 'combat' }),
  },
  hit: {
    throttleMs: 60,
    play: () => playNoise({ duration: 0.05, volume: 0.06, filterFreq: 2200, category: 'combat' }),
  },
  xp: {
    throttleMs: 80,
    play: () => playTone({ freq: 880, freqTo: 1320, type: 'sine', duration: 0.06, volume: 0.05, category: 'combat' }),
  },
  enemyDie: {
    throttleMs: 70,
    play: () => playNoise({ duration: 0.12, volume: 0.09, filterFreq: 900, category: 'combat' }),
  },

  // --- Armas de área: menos frecuentes pero aún repetitivas ---
  nova: {
    throttleMs: 300,
    play: () => playTone({ freq: 300, freqTo: 90, type: 'sawtooth', duration: 0.22, volume: 0.1, category: 'combat' }),
  },
  burst: {
    throttleMs: 200,
    play: () => playTone({ freq: 520, freqTo: 700, type: 'square', duration: 0.07, volume: 0.07, category: 'combat' }),
  },

  // --- Eventos del jugador ---
  playerHurt: {
    throttleMs: 250,
    play: () => {
      playTone({ freq: 260, freqTo: 70, type: 'sawtooth', duration: 0.25, volume: 0.22 });
      playNoise({ duration: 0.15, volume: 0.12, filterFreq: 700 });
    },
  },
  dodge: {
    throttleMs: 200,
    play: () => playTone({ freq: 1100, freqTo: 1800, type: 'sine', duration: 0.1, volume: 0.12 }),
  },

  // --- Hitos: sin throttle real, suenan siempre ---
  levelUp: {
    throttleMs: 0,
    // Arpegio ascendente: la recompensa más repetida del juego, tiene que sentirse bien.
    play: () => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone({ freq, type: 'square', duration: 0.12, volume: 0.16, delay: i * 0.06 });
      });
    },
  },
  upgradePick: {
    throttleMs: 0,
    play: () => playTone({ freq: 900, freqTo: 1400, type: 'square', duration: 0.09, volume: 0.14 }),
  },
  chest: {
    throttleMs: 0,
    play: () => {
      [784, 1047, 1319].forEach((freq, i) => {
        playTone({ freq, type: 'sine', duration: 0.14, volume: 0.16, delay: i * 0.05 });
      });
    },
  },
  bossWarn: {
    throttleMs: 0,
    // Dos golpes graves, como una alarma.
    play: () => {
      [0, 0.35].forEach((delay) => {
        playTone({ freq: 160, freqTo: 110, type: 'sawtooth', duration: 0.3, volume: 0.2, delay });
      });
    },
  },
  bossDie: {
    throttleMs: 0,
    play: () => {
      playNoise({ duration: 0.5, volume: 0.25, filterFreq: 600 });
      playTone({ freq: 400, freqTo: 60, type: 'sawtooth', duration: 0.5, volume: 0.18 });
    },
  },
  stage: {
    throttleMs: 0,
    play: () => {
      [440, 587, 740, 880].forEach((freq, i) => {
        playTone({ freq, type: 'sine', duration: 0.2, volume: 0.16, delay: i * 0.08 });
      });
    },
  },
  gameOver: {
    throttleMs: 0,
    // Melodía descendente.
    play: () => {
      [523, 415, 330, 262].forEach((freq, i) => {
        playTone({ freq, type: 'square', duration: 0.3, volume: 0.18, delay: i * 0.16 });
      });
    },
  },
  victory: {
    throttleMs: 0,
    play: () => {
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        playTone({ freq, type: 'square', duration: 0.25, volume: 0.18, delay: i * 0.13 });
      });
    },
  },
};

// Última vez que sonó cada efecto, para aplicar su throttle.
const lastPlayedAt = {};

export function playSfx(name) {
  const sfx = SFX[name];
  if (!sfx) return false;

  const now = performance.now();
  if (sfx.throttleMs > 0 && now - (lastPlayedAt[name] || -Infinity) < sfx.throttleMs) {
    return false;
  }

  lastPlayedAt[name] = now;
  sfx.play();
  return true;
}
