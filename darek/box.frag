#version 300 es

precision mediump float;
precision mediump int;

in vec2 vTexPos;
in vec3 vNormal;
in vec3 vTan1;
in vec3 vTan2;
out vec4 fragColor;

const vec3 source1 = normalize(vec3(0.5, 1.0, 2.0));
const vec3 source2 = normalize(vec3(-1.5, 1.5, 0.5));
const float ambient = 0.4;

layout(std140) uniform block {
  vec4 qView;
  float size;
  float sizeUnit;
  float count;
  int pat_emb;
  mat3x4 colors;
};

vec4 lighting(vec3 color, vec3 normal, vec3 source) {
  float diff = max(0.0, dot(normal, source));
  float spec = pow(max(0.0, dot(reflect(source, normal), vec3(0, 0, -1))), 2.0);
  return vec4(mix(diff, 1.0, ambient) * color + 0.1 * spec * vec3(1.0), 1.0);
}

void main(void) {
  int pattern = pat_emb & 255;
  bool emboss = pat_emb >= 256;
  vec4 color;
  vec2 coords = clamp(vTexPos, 0.0, size - 0.01);
  if(pattern == 0) {
    color = colors[0];
  } else if(pattern == 1) {
    vec2 dxy = fract(vTexPos) - vec2(0.5, 0.5);
    float d2 = dot(dxy, dxy);
    color = d2 > 0.03 ? colors[0] : colors[1];
  } else if(pattern == 2) {
    vec2 f = step(0.5, fract(coords)) - vec2(0.5, 0.5);
    color = f.x * f.y > 0.0 ? colors[0] : colors[1];
  } else if(pattern == 3) {
    ivec2 q = ivec2(floor(coords));
    int ix = int(floor(fract(((q.x + q.y) % 2 == 0 ? coords.x : coords.y)) * 3.0));
    color = colors[ix];
  } else if(pattern == 4) {
    ivec2 q = ivec2(floor(coords));
    vec2 fr = fract(coords);
    const mat3 m1 = mat3(0, -2, 2, 2, -1, -1, 0, 3, 1) / 4.0;
    const mat3 m2 = mat3(0, 2, -2, -2, 1, 1, 2, 0, 2) / 4.0;
    vec3 ccoords = ((q.x + q.y) % 2 == 0 ? m1 : m2) * vec3(fr, 1.0);
    color = colors * ccoords;
  }

  vec2 nadj = -0.1 * sin(12.56 * fract(vTexPos)).yx;
  //vec2 nadj = 0.1 * sign(fract(vTexPos) - vec2(0.5, 0.5));
  vec3 normal = emboss ? normalize(vNormal + nadj.x * vTan1 + nadj.y * vTan2) : vNormal;

  fragColor = mix(lighting(color.xyz, normal, source1), lighting(color.xyz, normal, source2), 0.5);
}
