import React from 'react';

/**
 * Rose Atelier — Editorial Overlay UI
 *
 * The heading "A little something for you" is always visible.
 * The instruction "Touch my heart" fades when the user starts interacting.
 */
export function OverlayUI({ instructionVisible = true }) {
  return (
    <div className="rose-overlay-container">
      {/* Always-visible editorial heading */}
      <header className="rose-top-header">
        <h1 className="rose-main-heading">A little something for you</h1>
        <div className="rose-heading-divider" />
      </header>

      {/* Bottom instruction — hidden after first swipe */}
      <footer className="rose-bottom-area">
        <div
          className="rose-instruction-badge"
          style={{
            opacity: instructionVisible ? 1 : 0,
            transition: 'opacity 0.7s ease',
            pointerEvents: 'none',
          }}
        >
          <span className="rose-instruction-dot" />
          <span className="rose-instruction-text">Swipe across my heart</span>
        </div>
      </footer>
    </div>
  );
}
