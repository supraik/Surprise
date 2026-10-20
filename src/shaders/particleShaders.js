export const particleVertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute vec4 aRandom;

  uniform float uTime;
  uniform float uHeartBeat;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    // Gentle twinkle shimmer — very subtle, preserves ruby colour
    float twinkle = sin(uTime * aRandom.x * 1.6 + aRandom.y) * 0.5 + 0.5;

    // Soft breathing heartbeat pulse (only on intact resting state)
    float beat = sin(uTime * 2.8) * 0.5 + 0.5;
    beat = pow(beat, 5.0) * uHeartBeat;

    // Float wave, keeping organic motion minimal
    float floatY = sin(uTime * 1.1 + aRandom.y * 4.0) * 0.025 * uHeartBeat;
    
    vec3 pos = position;
    pos += normalize(pos + vec3(0.0001)) * beat * 0.07;
    pos.y += floatY;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Distance-attenuated size
    float dist = -mvPosition.z;
    float sz = aSize * (1.0 + twinkle * 0.3) * (uPixelRatio * 38.0) / max(dist, 1.0);
    gl_PointSize = clamp(sz, 1.5, 44.0);

    vAlpha = 0.88 + twinkle * 0.12;
  }
`;

export const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float d = length(coord);
    if (d > 0.5) discard;

    // Crisp disc with smooth antialiased edge — no harsh bloom
    float alpha = (1.0 - smoothstep(0.38, 0.5, d)) * vAlpha;

    // Subtle specular hot-spot at the centre of each disc
    float spec = clamp(1.0 - d * 3.2, 0.0, 1.0);
    vec3 col = vColor + vec3(0.07, 0.03, 0.04) * spec;

    gl_FragColor = vec4(col, alpha);
  }
`;
