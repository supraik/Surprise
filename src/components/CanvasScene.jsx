import React, { useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ParticleHeart } from './ParticleHeart';

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

  const cameraZ = useMemo(() => {
    if (aspect < 0.55) return 10.5;
    if (aspect < 0.85) return  9.4;
    if (aspect < 1.2)  return  8.4;
    return 7.4;
  }, [aspect]);

  return (
    <Canvas
      camera={{ position: [0, 0, cameraZ], fov: 45, near: 0.1, far: 100 }}
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
      <ParticleHeart onDisperse={onDisperse} isMobile={isMobile} />
    </Canvas>
  );
}
