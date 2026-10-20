/**
 * Romantic Audio Controller
 * Attempts to play /audio/true-beauty-theme.mp3.
 * If missing, falls back to a warm ambient Web Audio synthesizer that
 * procedural plays a gentle Korean drama style chord progression.
 */

class RomanticAudioManager {
  constructor() {
    this.audioElement = null;
    this.audioContext = null;
    this.synthGain = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.isUsingSynth = false;
    this.synthInterval = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({
        isPlaying: this.isPlaying,
        isMuted: this.isMuted,
        isUsingSynth: this.isUsingSynth,
      });
    }
  }

  initAndPlay() {
    if (this.isPlaying) return;

    // Build candidate paths to handle root domains, GitHub Pages subpaths, with or without trailing slash
    const base = import.meta.env.BASE_URL || './';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const pathname = window.location.pathname.replace(/\/$/, '');

    const candidates = [
      `${window.location.origin}${pathname}/true-beauty-theme.mp3`,
      `${normalizedBase}true-beauty-theme.mp3`,
      'true-beauty-theme.mp3',
      './true-beauty-theme.mp3',
      '/Surprise/true-beauty-theme.mp3',
    ];

    const uniqueCandidates = [...new Set(candidates)];
    let index = 0;

    const tryNext = () => {
      if (index >= uniqueCandidates.length) {
        // Fall back to Web Audio ambient synthesizer if MP3 cannot be loaded
        this.startAmbientSynth();
        return;
      }

      const url = uniqueCandidates[index++];
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = this.isMuted ? 0 : 0.65;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.audioElement = audio;
            this.isPlaying = true;
            this.isUsingSynth = false;
            this.notify();
          })
          .catch(() => {
            tryNext();
          });
      }
    };

    tryNext();
  }

  startAmbientSynth() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.synthGain = this.audioContext.createGain();
      this.synthGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.audioContext.currentTime);

      // Low pass filter for soft, warm, velvety tone
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.audioContext.currentTime);
      filter.Q.setValueAtTime(2.5, this.audioContext.currentTime);

      this.synthGain.connect(filter);
      filter.connect(this.audioContext.destination);

      this.isPlaying = true;
      this.isUsingSynth = true;
      this.notify();

      // Romantic chord progression frequencies (Fmaj9 - Cmaj7 - Dm9 - Am9)
      const chordProgression = [
        [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj7
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
      ];

      let chordIdx = 0;

      const playChord = () => {
        if (!this.isPlaying || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        const chord = chordProgression[chordIdx % chordProgression.length];
        chordIdx++;

        // Play gentle swelling sine pad for each note in the chord
        chord.forEach((freq, i) => {
          const osc = this.audioContext.createOscillator();
          const noteGain = this.audioContext.createGain();

          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          // Subtle detune for shimmer
          osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

          // Warm fade in and fade out envelope
          const attack = 1.6 + i * 0.2;
          const duration = 6.5;
          const release = 2.5;

          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.exponentialRampToValueAtTime(0.07 / chord.length, now + attack);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

          osc.connect(noteGain);
          noteGain.connect(this.synthGain);

          osc.start(now);
          osc.stop(now + duration + release + 0.1);
        });

        // Delicate chime / sparkle note
        const chimeFreq = chord[chord.length - 1] * 2;
        const chimeOsc = this.audioContext.createOscillator();
        const chimeGain = this.audioContext.createGain();

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(chimeFreq, now + 1.2);
        chimeGain.gain.setValueAtTime(0.0001, now + 1.2);
        chimeGain.gain.exponentialRampToValueAtTime(0.025, now + 1.3);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.synthGain);

        chimeOsc.start(now + 1.2);
        chimeOsc.stop(now + 3.9);
      };

      playChord();
      this.synthInterval = setInterval(playChord, 5800);
    } catch {
      // Audio context might fail on restricted environments
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.initAndPlay();
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
    this.isPlaying = false;
    this.notify();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : 0.65;
    }
    if (this.synthGain && this.audioContext) {
      this.synthGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.28,
        this.audioContext.currentTime,
        0.05
      );
    }
    this.notify();
  }
}

export const romanticAudio = new RomanticAudioManager();
