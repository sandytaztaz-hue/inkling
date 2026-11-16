// INKLING — procedural WebAudio sounds. No audio files: every effect is
// synthesized from oscillators and filtered noise at play time. Chapter 4
// adds the fountain's golden chime and the Eraser King's roar.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.master = null;
    this.swishNoise = null;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, duration, type, volume, slideTo) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration, volume, filterFreq) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
  }

  jump() {
    this.tone(280, 0.16, 'sine', 0.22, 620);
  }

  land() {
    this.noise(0.08, 0.12, 500);
  }

  paint() {
    this.noise(0.09, 0.07, 2400);
  }

  orb() {
    this.tone(880, 0.12, 'sine', 0.22, 1320);
    this.tone(1320, 0.1, 'sine', 0.1, 1760);
  }

  key() {
    this.tone(1175, 0.12, 'triangle', 0.22, 1568);
    this.tone(1568, 0.14, 'triangle', 0.16, 2093);
  }

  unlock() {
    const notes = [659, 784, 988, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.18, 'triangle', 0.2), i * 80);
    });
  }

  crumble() {
    this.noise(0.25, 0.16, 900);
  }

  bounce() {
    this.tone(180, 0.2, 'triangle', 0.25, 720);
  }

  hurt() {
    this.tone(220, 0.3, 'sawtooth', 0.22, 55);
    this.noise(0.2, 0.15, 700);
  }

  erase() {
    this.noise(0.18, 0.14, 1600);
  }

  levelClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.22, 'triangle', 0.22), i * 95);
    });
  }

  win() {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.3, 'triangle', 0.22), i * 110);
    });
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.3, 'sawtooth', 0.14), i * 140);
    });
  }

  /** A soft golden chime: one tick of drinking at an ink fountain. */
  fountain() {
    this.tone(1047, 0.14, 'sine', 0.16, 1568);
    this.tone(1568, 0.12, 'sine', 0.08, 2093);
  }

  /** The Eraser King's roar: a low sawtooth growl when a chase begins. */
  kingRoar() {
    this.tone(110, 0.5, 'sawtooth', 0.22, 55);
    this.noise(0.35, 0.14, 500);
  }

  /** The King's grumble when Pip slips away: a short low note. */
  kingGrumble() {
    this.tone(165, 0.22, 'sawtooth', 0.12, 110);
  }
}
