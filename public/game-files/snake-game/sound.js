// Web Audio API Synthesizer for Lumi Snake
// Provides retro-modern neon sound effects without needing external audio assets.

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.boostOsc = null;
    this.boostGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Soft high-pitch bell sound for eating orbs
  playEat(volume = 0.15) {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Small random variation to make it sound organic and musical
    const baseFreq = 523.25; // C5
    const pitchShift = Math.random() * 50 - 25;
    osc.frequency.setValueAtTime(baseFreq + pitchShift, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime((baseFreq + pitchShift) * 1.5, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Interface click sound
  playClick(volume = 0.1) {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Play continuous boost hum
  startBoost(volume = 0.08) {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.boostOsc) return; // Already running

    this.boostOsc = this.ctx.createOscillator();
    this.boostGain = this.ctx.createGain();

    this.boostOsc.type = 'sawtooth';
    this.boostOsc.frequency.setValueAtTime(65, this.ctx.currentTime); // Low C2 frequency

    // Filter to make it a deep rumble rather than harsh sawtooth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.boostGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.2);

    this.boostOsc.connect(filter);
    filter.connect(this.boostGain);
    this.boostGain.connect(this.ctx.destination);

    this.boostOsc.start();
  }

  stopBoost() {
    if (!this.ctx || !this.boostOsc) return;
    
    const osc = this.boostOsc;
    const gain = this.boostGain;
    
    this.boostOsc = null;
    this.boostGain = null;

    try {
      gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      setTimeout(() => {
        try {
          osc.stop();
        } catch(e) {}
      }, 200);
    } catch(e) {
      try {
        osc.stop();
      } catch(err) {}
    }
  }

  // Cybernetic explosion sound for snake deaths
  playCrash(volume = 0.25) {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Noise buffer generator
    const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.38);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    // Deep synth rumble to overlay on noise
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.3);
    
    oscGain.gain.setValueAtTime(volume * 1.5, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noiseNode.start();
    osc.start();

    noiseNode.stop(this.ctx.currentTime + 0.4);
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // Neon game over arpeggio (descending synth chords)
  playGameOver(volume = 0.2) {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const notes = [392.00, 329.63, 261.63, 196.00]; // G4, E4, C4, G3
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.15);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, startTime + idx * 0.15);

      gain.gain.setValueAtTime(0, startTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(volume, startTime + idx * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.15 + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime + idx * 0.15);
      osc.stop(startTime + idx * 0.15 + 0.3);
    });
  }

  // Uplifting win fanfare (ascending neon synth arpeggio)
  playWin(volume = 0.2) {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0, startTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(volume, startTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + 0.25);
    });
  }
}

// Export a single global sound manager
const Sound = new SoundSynthesizer();
