#version 300 es

precision mediump float;

in vec2 vPos;
out vec4 fragColor;

void main(void) {
  const mat3 clrM = mat3(0.0, 0.0, 0.05, 0.0, -0.05, 0.0, 0.3, 0.3, 0.3);
  fragColor = vec4(clrM * vec3(vPos, 1.0), 1.0);
}
