#version 300 es

out vec2 vPos;

const vec2 pos[4] = vec2[](vec2(-1, -1), vec2(1, -1), vec2(-1, 1), vec2(1, 1));

void main(void) {
  vPos = pos[gl_VertexID];
  gl_Position = vec4(vPos, 0.0, 1.0);
}
