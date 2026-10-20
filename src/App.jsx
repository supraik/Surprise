import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasScene } from './components/CanvasScene';
import { OverlayUI } from './components/OverlayUI';
import { AudioPlayer } from './components/AudioPlayer';
import { romanticAudio } from './utils/audioSynth';

export default function App() {
  // We track disperse amount via a ref so ParticleHeart can update the
  // DOM element directly each frame WITHOUT triggering React re-renders.
  const revealElRef  = useRef(null); // ref to the reveal <div> in the DOM
  const audioFiredRef = useRef(false);

  // OverlayUI instruction opacity still uses state (low frequency, ~1fps effective)
  const [instructionVisible, setInstructionVisible] = useState(true);

  // This callback is called at 60fps from useFrame — uses refs only, no setState
  const handleDisperse = useCallback((amount) => {
    // Drive message opacity directly via DOM style (zero React overhead)
    if (revealElRef.current) {
      // Fully visible when amount > 0.35, invisible at 0
      const opacity = Math.min(1, Math.max(0, (amount - 0.05) / 0.4));
      revealElRef.current.style.opacity = opacity;
    }

    // Fire music once
    if (amount > 0.06 && !audioFiredRef.current) {
      audioFiredRef.current = true;
      romanticAudio.initAndPlay();
    }

    // Dim the instruction at low frequency (every ~30 frames)
    if (amount > 0.08 && instructionVisible) {
      setInstructionVisible(false);
    } else if (amount < 0.02 && !instructionVisible) {
      setInstructionVisible(true);
    }
  }, [instructionVisible]);

  // Keyboard: M = mute toggle
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'KeyM') romanticAudio.toggleMute(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="rose-atelier-container">
      <div className="rose-ambient-bg" />

      {/* ── Reveal message sits in plain DOM, z-index 2 (above bg, below canvas) ── */}
      <div className="reveal-dom-layer">
        <div className="reveal-dom-inner" ref={revealElRef} style={{ opacity: 0 }}>
          <div className="reveal-subtle-aura" />
          <h2 className="reveal-main-text">I LOVE YOU ANUSHREE</h2>
          <div className="reveal-accent-mark">
            <span className="accent-line" />
            <span className="accent-symbol">❤️</span>
            <span className="accent-line" />
          </div>
        </div>
      </div>

      {/* ── 3D Canvas sits on top (z-index 3) with a transparent background ── */}
      <CanvasScene onDisperse={handleDisperse} />

      {/* ── UI overlay above everything (z-index 5) ── */}
      <OverlayUI instructionVisible={instructionVisible} />

      <AudioPlayer />
    </main>
  );
}
