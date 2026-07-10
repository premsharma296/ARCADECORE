// ==========================================
// NEON ARCHITECT - PROCEDURAL WEB AUDIO SYNTH
// ==========================================

let audioCtx = null;
let mainGainNode = null;
let synthInterval = null;

export function initAudio() {
  if (audioCtx) return;

  // Standard constructor with fallbacks
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  window.audioCtx = audioCtx;

  mainGainNode = audioCtx.createGain();
  mainGainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
  mainGainNode.connect(audioCtx.destination);

  // Start the background ambient cyberpunk chord drone
  startAmbientDrone();
}

function startAmbientDrone() {
  if (!audioCtx) return;

  // 1. Ambient Pad Synth
  const chords = [
    [73.42, 110.0, 146.83, 164.81], // D minor 7 modal
    [65.41, 98.0, 130.81, 164.81],  // C major / A minor
    [55.0, 82.41, 110.0, 138.61],   // A minor
    [73.42, 110.0, 146.83, 220.0]    // D suspension
  ];
  let chordIndex = 0;

  const oscNodes = [];
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(320, audioCtx.currentTime);
  padFilter.Q.setValueAtTime(1.0, audioCtx.currentTime);
  padFilter.connect(mainGainNode);

  for (let i = 0; i < 4; i++) {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(chords[chordIndex][i], audioCtx.currentTime);
    oscGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    osc.connect(oscGain);
    oscGain.connect(padFilter);
    osc.start();
    oscNodes.push(osc);
  }

  // LFO filter sweep for pad
  setInterval(() => {
    if (window.isAudioMuted) return;
    const now = audioCtx.currentTime;
    const cutoff = 300 + Math.sin(now * 0.4) * 80;
    padFilter.frequency.setValueAtTime(cutoff, now);
  }, 100);

  // 2. Clock-scheduled drum machine, bassline, and arpeggiator
  let currentStep = 0;
  let nextNoteTime = audioCtx.currentTime;
  const tempo = 100.0; // BPM
  const secondsPerStep = 60.0 / tempo / 4.0; // 16th notes

  // Noise buffer for hi-hats
  const bufferSize = audioCtx.sampleRate * 0.05;
  const hatBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const hatData = hatBuffer.getChannelData(0);
  for (let j = 0; j < bufferSize; j++) hatData[j] = Math.random() * 2 - 1;

  function playSynthwaveKick(time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    
    // Pitch sweep
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    
    // Volume sweep
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    
    osc.connect(gain);
    gain.connect(mainGainNode);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  function playSynthwaveHat(time) {
    const source = audioCtx.createBufferSource();
    source.buffer = hatBuffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(mainGainNode);
    source.start(time);
    source.stop(time + 0.04);
  }

  function playPulsingBass(time, freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq / 2, time); // sub bass

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(mainGainNode);
    osc.start(time);
    osc.stop(time + 0.24);
  }

  function playBubblyArp(time, chordNotes) {
    // Pick random note from current chord octave-shifted up
    const baseFreq = chordNotes[Math.floor(Math.random() * chordNotes.length)];
    const freq = baseFreq * (Math.random() < 0.65 ? 2.0 : 4.0);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(8.0, time);
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(2800, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.14);

    gain.gain.setValueAtTime(0.07, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(mainGainNode);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  function scheduleNextNote(step, time) {
    if (window.isAudioMuted) return;

    const currentChord = chords[chordIndex];
    const root = currentChord[0];

    // Four-on-the-floor kick beat
    if (step % 4 === 0) {
      playSynthwaveKick(time);
    }

    // Off-beat hi-hats
    if (step % 4 === 2) {
      playSynthwaveHat(time);
    }

    // Pulsing synth bass rhythm
    if (step % 2 === 0) {
      playPulsingBass(time, root);
    }

    // Syncopated bubbly arpeggios
    const arpSteps = [0, 3, 6, 8, 11, 14];
    if (arpSteps.includes(step % 16) && Math.random() < 0.8) {
      playBubblyArp(time, currentChord);
    }
  }

  // Music sequence scheduler loop
  setInterval(() => {
    if (window.isAudioMuted) return;
    
    // Look ahead 100ms
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
      scheduleNextNote(currentStep, nextNoteTime);
      nextNoteTime += secondsPerStep;
      currentStep++;

      // Change chords every 64 steps (4 beats x 4 bars)
      if (currentStep % 64 === 0) {
        chordIndex = (chordIndex + 1) % chords.length;
        const now = audioCtx.currentTime;
        // Glide pad oscillators to new frequencies
        for (let i = 0; i < 4; i++) {
          oscNodes[i].frequency.exponentialRampToValueAtTime(chords[chordIndex][i], now + 2.0);
        }
      }
    }
  }, 25);
}

// Interface sound effects
export function playSound(type) {
  if (!audioCtx || window.isAudioMuted) return;

  const now = audioCtx.currentTime;

  switch (type) {
    case 'select': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      
      osc.connect(gain);
      gain.connect(mainGainNode);
      osc.start();
      osc.stop(now + 0.08);
      break;
    }

    case 'confirm': {
      // Rising major chime
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(mainGainNode);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
      break;
    }

    case 'error': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      
      osc.connect(gain);
      gain.connect(mainGainNode);
      osc.start();
      osc.stop(now + 0.25);
      break;
    }

    case 'build': {
      // Grid printing sweep: noise combined with low synth frequency
      const bufferSize = audioCtx.sampleRate * 0.35; // 0.35s
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
      filter.Q.setValueAtTime(4.0, now);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(mainGainNode);
      
      noise.start();
      noise.stop(now + 0.35);

      // Low frequency layer
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

      subGain.gain.setValueAtTime(0.15, now);
      subGain.gain.linearRampToValueAtTime(0.01, now + 0.3);

      subOsc.connect(subGain);
      subGain.connect(mainGainNode);
      subOsc.start();
      subOsc.stop(now + 0.3);
      break;
    }

    case 'hack': {
      // Alarm sirens
      for (let i = 0; i < 2; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + i * 200, now);
        
        // Modulate frequency to wobble like a siren
        osc.frequency.linearRampToValueAtTime(400, now + 0.2);
        osc.frequency.linearRampToValueAtTime(800, now + 0.4);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        
        osc.connect(gain);
        gain.connect(mainGainNode);
        osc.start();
        osc.stop(now + 0.4);
      }
      break;
    }
  }
}
