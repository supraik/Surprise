import * as THREE from 'three';

/**
 * Creates a soft radial glow particle sprite texture using an offscreen canvas.
 * Produces a bright star-like core with a delicate exponential falloff.
 */
export function createGlowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const center = size / 2;
  const gradient = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    center
  );

  // Soft luminous falloff
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.12, 'rgba(255, 230, 245, 0.95)');
  gradient.addColorStop(0.35, 'rgba(255, 110, 180, 0.6)');
  gradient.addColorStop(0.65, 'rgba(192, 132, 252, 0.2)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
