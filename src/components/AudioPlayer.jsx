import React, { useState, useEffect } from 'react';
import { VolumeX } from 'lucide-react';
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
        aria-label={audioState.isMuted ? 'Unmute music' : 'Mute music'}
        title={audioState.isMuted ? 'Unmute music' : 'Mute music'}
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
    </div>
  );
}
