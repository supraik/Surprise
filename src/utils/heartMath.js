import * as THREE from 'three';

/**
 * Rose Atelier — Procedural 3D Sculptural Heart Generator
 * 
 * Generates ~30,000 tightly arranged particles forming a dense, solid,
 * sculptural 3D heart with rich ruby-red shading and lighting normals.
 * 
 * Color Palette:
 * - Heart Focal Point: Rich Ruby Red #B82035
 * - Shadow Depth: Deep Crimson #6B121E / #8C1828
 * - Highlights: Soft Rose Ruby #C93247 / #E8556D
 */
export function generateHeartParticles(count = 30000) {
  const positions = new Float32Array(count * 3);
  const homePositions = new Float32Array(count * 3);
  const shatterTargets = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count * 4); // [twinkleSpeed, phase, shatterDelay, mass]

  // Ruby palette with controlled depth
  const cDeepShadow = new THREE.Color('#6B121E');
  const cShadow = new THREE.Color('#8C1828');
  const cRuby = new THREE.Color('#B82035');       // Exact user ruby red
  const cHighlight = new THREE.Color('#C93247');
  const cTopHighlight = new THREE.Color('#E8556D');
  const cChampagne = new THREE.Color('#F7DDE2');   // Subtle specular gleam

  const scale = 0.17; // Fitted scale for balanced negative space
  const shellCount = Math.floor(count * 0.78); // 78% dense surface shell
  const volumeCount = Math.floor(count * 0.18); // 18% interior solidifying core
  const haloCount = count - shellCount - volumeCount; // 4% subtle ambient motes

  let idx = 0;

  // 1. DENSE SCULPTURAL SHELL PARTICLES
  for (let i = 0; i < shellCount; i++) {
    const t = (Math.random() * 2 - 1) * Math.PI;

    // Mathematical heart curve
    const xBase = 16 * Math.pow(Math.sin(t), 3);
    const yBase = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    // Anatomical thickness: fuller at top lobes, tapered at bottom cleft
    const normY = (yBase + 17) / 30; // 0 (bottom) to 1 (top)
    const lobeBulge = Math.sin(Math.PI * Math.min(1.0, normY * 1.1));
    const widthTaper = Math.max(0.05, 1 - Math.abs(xBase) / 21);
    const thickness = lobeBulge * widthTaper * 8.5;

    // Angular distribution for uniform surface shell
    const phi = Math.random() * Math.PI * 2;
    const rZ = Math.cos(phi) * thickness * (0.88 + Math.random() * 0.22);

    // Dense packing with minimal jitter for solid appearance
    const jitter = (Math.random() - 0.5) * 0.22;
    const x = (xBase + jitter) * scale;
    const y = (yBase + jitter + 1.2) * scale;
    const z = rZ * scale * 0.82;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    homePositions[idx * 3] = x;
    homePositions[idx * 3 + 1] = y;
    homePositions[idx * 3 + 2] = z;

    // Approximate surface normal for 3D directional shading
    const nx = x;
    const ny = y * 0.7;
    const nz = z * 1.5;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    normals[idx * 3] = nx / nLen;
    normals[idx * 3 + 1] = ny / nLen;
    normals[idx * 3 + 2] = nz / nLen;

    // Lighting gradient: directional light from top-left front
    const lightDot = (normals[idx * 3] * 0.35 + normals[idx * 3 + 1] * 0.6 + normals[idx * 3 + 2] * 0.7);
    let pColor = new THREE.Color();
    if (lightDot > 0.5) {
      pColor.lerpColors(cRuby, cTopHighlight, (lightDot - 0.5) * 1.8);
      if (Math.random() < 0.04) pColor.lerp(cChampagne, 0.4); // Specular gleam
    } else if (lightDot > 0.0) {
      pColor.lerpColors(cShadow, cRuby, lightDot * 2.0);
    } else {
      pColor.lerpColors(cDeepShadow, cShadow, lightDot + 1.0);
    }

    colors[idx * 3] = pColor.r;
    colors[idx * 3 + 1] = pColor.g;
    colors[idx * 3 + 2] = pColor.b;

    sizes[idx] = 2.2 + Math.random() * 1.6;

    // Shatter trajectory: radial outward explosion + drift halo
    const sAngle = Math.atan2(y, x) + (Math.random() - 0.5) * 0.6;
    const sRadius = 4.0 + Math.random() * 4.5;
    const sZ = (Math.random() - 0.5) * 3.5;
    shatterTargets[idx * 3] = Math.cos(sAngle) * sRadius;
    shatterTargets[idx * 3 + 1] = Math.sin(sAngle) * sRadius * 0.85;
    shatterTargets[idx * 3 + 2] = sZ;

    randoms[idx * 4] = 0.8 + Math.random() * 2.0;       // Twinkle speed
    randoms[idx * 4 + 1] = Math.random() * Math.PI * 2; // Phase
    randoms[idx * 4 + 2] = Math.random() * 0.25;        // Shatter stagger delay
    randoms[idx * 4 + 3] = 0.85 + Math.random() * 0.3;  // Inertia weight

    idx++;
  }

  // 2. INTERIOR SOLIDIFYING VOLUME PARTICLES
  for (let i = 0; i < volumeCount; i++) {
    const t = (Math.random() * 2 - 1) * Math.PI;
    const xBase = 16 * Math.pow(Math.sin(t), 3);
    const yBase = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const normY = (yBase + 17) / 30;
    const lobeBulge = Math.sin(Math.PI * Math.min(1.0, normY * 1.1));
    const widthTaper = Math.max(0.05, 1 - Math.abs(xBase) / 21);
    const thickness = lobeBulge * widthTaper * 7.5;

    const volScale = Math.pow(Math.random(), 0.55);
    const zDist = (Math.random() * 2 - 1) * thickness * volScale * 0.7;

    const x = (xBase * volScale) * scale;
    const y = (yBase * volScale + 1.2) * scale;
    const z = zDist * scale;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    homePositions[idx * 3] = x;
    homePositions[idx * 3 + 1] = y;
    homePositions[idx * 3 + 2] = z;

    normals[idx * 3] = 0;
    normals[idx * 3 + 1] = 0.3;
    normals[idx * 3 + 2] = 0.9;

    // Interior has deep velvety ruby tones
    const pColor = new THREE.Color().lerpColors(cDeepShadow, cRuby, Math.random() * 0.8 + 0.2);
    colors[idx * 3] = pColor.r;
    colors[idx * 3 + 1] = pColor.g;
    colors[idx * 3 + 2] = pColor.b;

    sizes[idx] = 1.8 + Math.random() * 1.5;

    const sAngle = Math.random() * Math.PI * 2;
    const sRadius = 3.5 + Math.random() * 4.0;
    shatterTargets[idx * 3] = Math.cos(sAngle) * sRadius;
    shatterTargets[idx * 3 + 1] = Math.sin(sAngle) * sRadius * 0.8;
    shatterTargets[idx * 3 + 2] = (Math.random() - 0.5) * 3.0;

    randoms[idx * 4] = 0.6 + Math.random() * 1.8;
    randoms[idx * 4 + 1] = Math.random() * Math.PI * 2;
    randoms[idx * 4 + 2] = Math.random() * 0.3;
    randoms[idx * 4 + 3] = 0.9 + Math.random() * 0.2;

    idx++;
  }

  // 3. SUBTLE AMBIENT MOTES
  for (let i = 0; i < haloCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3.2 + Math.random() * 3.0;
    const height = (Math.random() - 0.5) * 5.0;
    const depth = (Math.random() - 0.5) * 2.5;

    const x = Math.cos(angle) * radius;
    const y = height;
    const z = depth;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    homePositions[idx * 3] = x;
    homePositions[idx * 3 + 1] = y;
    homePositions[idx * 3 + 2] = z;

    normals[idx * 3] = 0;
    normals[idx * 3 + 1] = 0;
    normals[idx * 3 + 2] = 1;

    const pColor = Math.random() > 0.5 ? cHighlight : cRuby;
    colors[idx * 3] = pColor.r;
    colors[idx * 3 + 1] = pColor.g;
    colors[idx * 3 + 2] = pColor.b;

    sizes[idx] = 1.2 + Math.random() * 1.4;

    shatterTargets[idx * 3] = x * 1.4;
    shatterTargets[idx * 3 + 1] = y * 1.3;
    shatterTargets[idx * 3 + 2] = z;

    randoms[idx * 4] = 1.0 + Math.random() * 2.0;
    randoms[idx * 4 + 1] = Math.random() * Math.PI * 2;
    randoms[idx * 4 + 2] = Math.random() * 0.2;
    randoms[idx * 4 + 3] = 0.6 + Math.random() * 0.4;

    idx++;
  }

  return {
    count,
    positions,
    homePositions,
    shatterTargets,
    normals,
    colors,
    sizes,
    randoms,
  };
}
