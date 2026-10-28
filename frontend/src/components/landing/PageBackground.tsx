import React from 'react';

/**
 * PageBackground — fixed, full-viewport, animated layer.
 * - Pure #080808 black base (set on #landing-root)
 * - Animated drifting grid — dark gray lines drift diagonally
 * - Single soft warm glow — very restrained, top-left
 * - pointer-events: none, aria-hidden, z-index: 0
 */
const PageBackground: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
  >
    {/* Animated drifting grid — moves diagonally, stays dark */}
    <div className="ld-bg-animated-grid" />

    {/* Single restrained warm glow — top-left only */}
    <div
      style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '50vw',
        height: '65vh',
        background:
          'radial-gradient(ellipse at 25% 25%, rgba(201,154,107,.055) 0%, transparent 60%)',
        pointerEvents: 'none',
      }}
    />
  </div>
);

export default PageBackground;
