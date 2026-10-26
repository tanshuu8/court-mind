import React from 'react';

/**
 * PageBackground — full-page decorative 3D layer.
 * Absolutely positioned, covers the entire page (not just the hero),
 * pointer-events: none, aria-hidden.
 */
const PageBackground: React.FC = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 overflow-hidden pointer-events-none"
    style={{ zIndex: 0 }}
  >
    {/* Fine grid — 64 px squares, slowly drifts down */}
    <div className="ld-grid-fine" />

    {/* Coarse grid — 256 px squares, 3-D tilt, opposite drift */}
    <div className="ld-grid-coarse" />

    {/* Warm bronze radial glow centered around 70 % x / 35 % y */}
    <div className="ld-glow" />

    {/* Subtle vignette at page edges */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 55%, rgba(11,9,7,.45) 100%)',
      }}
    />
  </div>
);

export default PageBackground;
