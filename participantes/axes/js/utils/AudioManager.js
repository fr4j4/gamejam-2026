/**
 * Sonidos mínimos generados con Web Audio API.
 * No descarga assets y solo crea el AudioContext después de una interacción.
 */
class AudioManager {
  constructor() {
    this.context = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  /** @param {number} frequency @param {number} duration @param {number} delay @param {number} volume */
  playTone(frequency, duration, delay = 0, volume = 0.045) {
    const context = this.ensureContext();
    if (!context) return;

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  playLine() { this.playTone(260, 0.08, 0, 0.035); }

  playBox() {
    this.playTone(520, 0.12, 0, 0.045);
    this.playTone(760, 0.16, 0.07, 0.04);
  }

  playVictory() {
    [392, 494, 587, 784].forEach((frequency, index) => {
      this.playTone(frequency, 0.2, index * 0.1, 0.05);
    });
  }
}
