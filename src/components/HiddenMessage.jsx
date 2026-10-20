import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * Rose Atelier — Final Reveal Message
 *
 * "I LOVE YOU ANUSHREE" sits directly behind the ruby heart.
 * As the particles disperse (disperseAmount 0→1) the container
 * transitions from nearly transparent to fully visible.
 */
export function HiddenMessage({ disperseAmount = 0, isMobile = false }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle vertical float
    groupRef.current.position.y = -0.38 + Math.sin(t * 1.05) * 0.05;
  });

  // The message is partially visible even at rest so wiping gives a sense
  // of uncovering. Full opacity reached at ~60 % dispersion.
  const opacity = 0.12 + Math.min(1, disperseAmount * 1.7) * 0.88;

  return (
    <group ref={groupRef} position={[0, -0.38, -0.55]}>
      <Html
        center
        distanceFactor={isMobile ? 12 : 9.5}
        style={{ pointerEvents: 'none', userSelect: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}
      >
        <div
          className="rose-reveal-container"
          style={{ opacity, transition: 'opacity 0.25s ease' }}
        >
          <div className="reveal-subtle-aura" />
          <h2 className="reveal-main-text">I LOVE YOU ANUSHREE</h2>
          <div className="reveal-accent-mark">
            <span className="accent-line" />
            <span className="accent-symbol">❤️</span>
            <span className="accent-line" />
          </div>
        </div>
      </Html>
    </group>
  );
}
