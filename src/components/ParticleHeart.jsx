import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generateHeartParticles } from '../utils/heartMath';
import { particleVertexShader, particleFragmentShader } from '../shaders/particleShaders';

/**
 * Rose Atelier — 3D Sculptural Ruby Particle Heart
 *
 * Interaction:
 *  • Idle   — gentle heartbeat pulse + slow breathing rotation.
 *  • Swipe  — cursor/touch repels nearby particles with strong radial force.
 *             Particles scatter far enough to expose the DOM message behind.
 *  • Release — elastic spring recovery with controlled damping (smooth, not snappy).
 *
 * onDisperse(amount 0→1) is called via ref each frame — no React setState overhead.
 */
export function ParticleHeart({ onDisperse, isMobile = false }) {
  const pointsRef   = useRef();
  const materialRef = useRef();
  const { camera, size } = useThree();

  const particleCount = isMobile ? 20000 : 26000;

  const particleData = useMemo(() => generateHeartParticles(particleCount), [particleCount]);

  // Per-particle velocity stored in a ref — never causes re-renders
  const velocities = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);

  // Build geometry once; position array is mutated in-place each frame
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleData.positions); // mutable copy
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(particleData.colors,  3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(particleData.sizes,   1));
    geo.setAttribute('aRandom',  new THREE.BufferAttribute(particleData.randoms, 4));
    return geo;
  }, [particleData]);

  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uHeartBeat:  { value: 1.0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) * (isMobile ? 1.6 : 1.0) },
  }), [isMobile]);

  // Cursor world position (ref — zero re-renders)
  const cursorWorld     = useRef(new THREE.Vector3(99999, 99999, 0));
  const pointerIsActive = useRef(false);
  // Track if cursor recently moved, to sustain dispersion while dragging
  const lastMoveTime    = useRef(0);

  /* ── Project screen XY → 3D world at Z = 0 ──────────────────────────── */
  const projectToWorld = (clientX, clientY) => {
    const ndcX =  (clientX / size.width)  * 2 - 1;
    const ndcY = -(clientY / size.height) * 2 + 1;
    const ray  = new THREE.Vector3(ndcX, ndcY, 0.5);
    ray.unproject(camera);
    ray.sub(camera.position).normalize();
    // Intersect with plane z=0 (the heart sits at z=0 world space)
    const t = -camera.position.z / ray.z;
    cursorWorld.current
      .copy(camera.position)
      .addScaledVector(ray, t);
    // Offset for the points group Y translation (-0.38 world units)
    cursorWorld.current.y += 0.38;
  };

  /* ── Event listeners ─────────────────────────────────────────────────── */
  useEffect(() => {
    const onMove = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x == null) return;
      projectToWorld(x, y);
      lastMoveTime.current = performance.now();
    };

    const onDown = (e) => {
      pointerIsActive.current = true;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x != null) projectToWorld(x, y);
      lastMoveTime.current = performance.now();
    };

    const onUp = () => {
      pointerIsActive.current = false;
      // Move cursor off-screen → spring recovery starts immediately
      cursorWorld.current.set(99999, 99999, 0);
    };

    window.addEventListener('pointermove',  onMove);
    window.addEventListener('pointerdown',  onDown);
    window.addEventListener('pointerup',    onUp);
    window.addEventListener('pointercancel',onUp);
    window.addEventListener('touchmove',    onMove, { passive: true });
    window.addEventListener('touchstart',   onDown, { passive: true });
    window.addEventListener('touchend',     onUp);

    return () => {
      window.removeEventListener('pointermove',  onMove);
      window.removeEventListener('pointerdown',  onDown);
      window.removeEventListener('pointerup',    onUp);
      window.removeEventListener('pointercancel',onUp);
      window.removeEventListener('touchmove',    onMove);
      window.removeEventListener('touchstart',   onDown);
      window.removeEventListener('touchend',     onUp);
    };
  }, [camera, size]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Per-frame physics ───────────────────────────────────────────────── */
  useFrame(({ clock }) => {
    if (!pointsRef.current || !materialRef.current) return;

    const t      = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = t;

    const posArr = pointsRef.current.geometry.attributes.position.array;
    const home   = particleData.homePositions;
    const vels   = velocities;
    const rand   = particleData.randoms;

    const cx = cursorWorld.current.x;
    const cy = cursorWorld.current.y;

    // ── Physics constants ────────────────────────────────────────────────
    // Repulsion: larger radius + stronger force so particles scatter visibly
    const WIPE_R     = isMobile ? 2.4  : 2.2;
    const WIPE_R_SQ  = WIPE_R * WIPE_R;
    const WIPE_FORCE = isMobile ? 0.14 : 0.14; // much stronger than before

    // Spring: weaker spring → particles go further before returning
    const SPRING  = 0.018;   // was 0.042 — now much softer
    const DAMPING = 0.875;   // was 0.900 — slightly more dissipation

    let totalDispSq = 0;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      const px = posArr[i3];
      const py = posArr[i3 + 1];
      const pz = posArr[i3 + 2];

      const hx = home[i3];
      const hy = home[i3 + 1];
      const hz = home[i3 + 2];

      const mass = rand[i * 4 + 3]; // individual inertia weight 0.85–1.15

      /* 1. Repulsion from cursor / touch ─────────────────────────────── */
      const dx     = px - cx;
      const dy     = py - cy;
      const distSq = dx * dx + dy * dy;

      if (distSq < WIPE_R_SQ && distSq > 1e-8) {
        const dist     = Math.sqrt(distSq);
        const falloff  = 1.0 - dist / WIPE_R;           // linear, 1 at centre
        const force    = falloff * falloff * WIPE_FORCE * mass;

        // Radial push + gentle random swirl
        const angle = Math.atan2(dy, dx) + (rand[i * 4 + 2] - 1.0) * 0.5;
        vels[i3]     += Math.cos(angle) * force;
        vels[i3 + 1] += Math.sin(angle) * force;
        // Depth scatter — gives a 3D "flying apart" feel
        vels[i3 + 2] += (Math.random() - 0.5) * force * 0.55;
      }

      /* 2. Elastic spring back to home ───────────────────────────────── */
      vels[i3]     = (vels[i3]     + (hx - px) * SPRING * mass) * DAMPING;
      vels[i3 + 1] = (vels[i3 + 1] + (hy - py) * SPRING * mass) * DAMPING;
      vels[i3 + 2] = (vels[i3 + 2] + (hz - pz) * SPRING * mass) * DAMPING;

      /* 3. Integrate ──────────────────────────────────────────────────── */
      posArr[i3]     += vels[i3];
      posArr[i3 + 1] += vels[i3 + 1];
      posArr[i3 + 2] += vels[i3 + 2];

      // Accumulate displacement² from home (XY only, Z doesn't count for reveal)
      const rdx = posArr[i3]     - hx;
      const rdy = posArr[i3 + 1] - hy;
      totalDispSq += rdx * rdx + rdy * rdy;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    /* ── Heartbeat uniform ──────────────────────────────────────────── */
    const avgDispSq  = totalDispSq / particleCount;
    const targetBeat = Math.max(0, 1.0 - avgDispSq * 12);
    materialRef.current.uniforms.uHeartBeat.value +=
      (targetBeat - materialRef.current.uniforms.uHeartBeat.value) * 0.07;

    /* ── Tell parent how open the heart is (0 = intact, 1 = wide open) ─ */
    // Normalise: at avgDispSq ≈ 0.08 the reveal is "full"
    if (onDisperse) onDisperse(Math.min(1, avgDispSq / 0.07));

    /* ── Idle breathing rotation ────────────────────────────────────── */
    const calm = materialRef.current.uniforms.uHeartBeat.value;
    pointsRef.current.rotation.y = Math.sin(t * 0.55) * 0.07 * calm;
    pointsRef.current.rotation.x = Math.sin(t * 0.38) * 0.035 * calm;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      position={[0, -0.38, 0]}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}   // ← KEY FIX: don't write depth so the DOM message
        depthTest={false}    //   behind the transparent canvas can always show
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
