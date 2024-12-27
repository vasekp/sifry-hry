#version 300 es

precision mediump float;
precision mediump int;

out vec2 vTexPos;
out vec3 vNormal;

layout(std140) uniform block {
  vec4 qView;
  float size;
  float sizeUnit;
  float count;
  int pat_emb;
  mat3x4 colors;
};

const vec3 faces[8] = vec3[](vec3(1, 0, 0), vec3(0, 1, 0), vec3(-1, 0, 0), vec3(0, -1, 0), vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, -1), vec3(0, 0, -1));
const vec3 dirs[8] = vec3[](vec3(0, 0, -1), vec3(0, 0, -1), vec3(0, 0, 1), vec3(0, 0, 1), vec3(1, 0, 0), vec3(0, 1, 0), vec3(-1, 0, 0), vec3(0, -1, 0));
const vec3 coords[4] = vec3[](vec3(1, -1, -1), vec3(1, 1, -1), vec3(1, -1, 1), vec3(1, 1, 1));

const float thickness = 0.06;

vec4 mulq(vec4 a, vec4 b) {
  return vec4(a.w*b.xyz + b.w*a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz));
}

vec3 rotate(vec3 v, vec4 q) {
  vec3 t = cross(q.xyz, v) + q.w * v;
  return v + 2.0 * cross(q.xyz, t);
}

void main(void) {
  //vec4 qVM = mulq(uQView, uQModel);
  vec3 normal = faces[gl_InstanceID];
  vec3 u = dirs[gl_InstanceID];
  vec3 v = cross(normal, u);
  vec3 c = vec3(1.0, 1.0, thickness) * coords[gl_VertexID];
  vec3 pos = c.x * normal + c.y * u + c.z * v;
  gl_Position = vec4(rotate(size * sizeUnit * pos, qView) / 1.5, 1.0);
  gl_Position.z *= -0.5;
  vTexPos = size * (c.yz + vec2(1.0, 1.0)) / 2.0;
  vNormal = rotate(normal, qView);
}
