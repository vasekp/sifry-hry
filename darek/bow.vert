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

const float thickness = 0.1;
const int divs = 10;

vec4 mulq(vec4 a, vec4 b) {
  return vec4(a.w*b.xyz + b.w*a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz));
}

vec3 rotate(vec3 v, vec4 q) {
  vec3 t = cross(q.xyz, v) + q.w * v;
  return v + 2.0 * cross(q.xyz, t);
}

void main(void) {
  //vec4 qVM = mulq(uQView, uQModel);
  int id = gl_VertexID;
  float y = float((id % 2) * 2 - 1) * thickness;
  float seg = float((id / 2) / divs);
  float p = float((id / 2) % divs) / float(divs - 1);
  float angle = 3.14 / (2.0 * count + 3.0);
  float sgn = float(gl_InstanceID * 2 - 1);
  vec2 v1 = vec2(cos(seg * angle), sin(seg * angle));
  vec2 v2 = vec2(cos((seg + 1.0) * angle), sin((seg + 1.0) * angle));
  vec2 xz = 3.0 * p * (1.0 - p) * (p * v1 + (1.0 - p) * v2);
  vec3 xyz = vec3(sgn * xz.x, y, 1.0 + xz.y);
  vec2 nxz = 3.0 * (1.0 - 2.0 * p) * (p * v1 + (1.0 - p) * v2) + 3.0 * p * (1.0 - p) * (v1 - v2);
  nxz = normalize(nxz);
  vec3 normal = vec3(nxz.y, 0.0, -sgn * nxz.x);
  gl_Position = vec4(rotate(size * sizeUnit * xyz, qView) / 1.5, 1.0);
  gl_Position.z *= -0.5;
  vTexPos = size * vec2(sgn * p, (y + 1.0) / 2.0);
  vNormal = rotate(normal, qView);
}
