import React, { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ParticleHeart } from './ParticleHeart';

/**
 * ResponsiveCamera dynamically adjusts camera distance so the 3D heart
 * is beautifully framed within mobile screens without spilling outside the viewport.
 */
function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const fovRad = (camera.fov * Math.PI) / 180;
    const tanHalfFov = Math.tan(fovRad / 2);

    // Heart is ~5.6 units wide, ~5.2 units high.
    // On mobile portrait (aspect < 0.85), heart should occupy max 72% of screen width.
    const targetWidthRatio = aspect < 0.85 ? 0.72 : 0.85;
    const requiredVisibleWidth = 5.6 / targetWidthRatio;
    const zForWidth = requiredVisibleWidth / (2 * tanHalfFov * aspect);

    // Ensure vertical fit (heart occupies max 66% of vertical screen)
    const requiredVisibleHeight = 5.2 / 0.66;
    const zForHeight = requiredVisibleHeight / (2 * tanHalfFov);

    const targetZ = Math.max(zForWidth, zForHeight, 8.5);

    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

export function CanvasScene({ onDisperse }) {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const aspect   = windowDimensions.width / windowDimensions.height;
  const isMobile = aspect < 0.85 || windowDimensions.width < 768;

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'transparent' }}
      className="webgl-canvas"
    >
      <ResponsiveCamera />
      <ParticleHeart onDisperse={onDisperse} isMobile={isMobile} />
    </Canvas>
  );
}
