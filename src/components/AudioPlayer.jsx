import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

/**
 * Rose Atelier — Minimal Audio Player
 * 
 * Styled in muted wine #6B3343 and blush pink #F3DDE2.
 */
export function AudioPlayer() {
  const [audioState, setAudioState] = useState({
    isPlaying: romanticAudio.isPlaying,
    isMuted: romanticAudio.isMuted,
    isUsingSynth: romanticAudio.isUsingSynth,
  });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const unsubscribe = romanticAudio.subscribe((state) => {
      setAudioState(state);
    });
    return unsubscribe;
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!audioState.isPlaying) {
      romanticAudio.initAndPlay();
    } else {
      romanticAudio.toggleMute();
    }
  };

  return (
    <div className="rose-audio-container">
      <button
        id="audio-toggle-btn"
        className={`rose-audio-btn ${audioState.isPlaying && !audioState.isMuted ? 'active' : ''}`}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={audioState.isMuted ? 'Unmute audio' : 'Toggle audio'}
      >
        {audioState.isPlaying && !audioState.isMuted ? (
          <div className="rose-soundwave">
            <span className="sw-bar sw-1"></span>
            <span className="sw-bar sw-2"></span>
            <span className="sw-bar sw-3"></span>
          </div>
        ) : (
          <VolumeX size={17} className="rose-audio-icon muted" />
        )}
      </button>

      {/* Subtle tooltip */}
      {showTooltip && (
        <div className="rose-audio-tooltip">
          <Music size={12} className="rose-tooltip-icon" />
          <span>
            {audioState.isUsingSynth
              ? 'Ambient Harmony (Place true-beauty-theme.mp3 in public/audio/ for OST)'
              : 'True Beauty Theme OST'}
          </span>
        </div>
      )}
    </div>
  );
}
