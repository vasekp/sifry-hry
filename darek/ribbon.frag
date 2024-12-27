#version 300 es

precision mediump float;

in vec2 vTexPos;
in vec3 vNormal;
out vec4 fragColor;
uniform mediump usampler2D uTexture;

const vec3 source1 = normalize(vec3(0.5, 1.0, 2.0));
const vec3 source2 = normalize(vec3(-1.5, 1.5, 0.5));
const float ambient = 0.4;

const vec3 colors[7] = vec3[](
    vec3(0.5, 0.5, 0.5),
    vec3(1.0, 0.0, 0.0),
    vec3(1.0, 0.5, 0.0),
    vec3(1.0, 1.0, 0.0),
    vec3(0.5, 1.0, 0.0),
    vec3(0.5, 0.0, 1.0),
    vec3(1.0, 0.5, 1.0)
  );

vec4 lighting(vec3 color, vec3 normal, vec3 source) {
  float diff = max(0.0, dot(normal, source) * (gl_FrontFacing ? 1.0 : -1.0));
  float spec = pow(max(0.0, dot(reflect(source, normal), vec3(0, 0, -1))), 3.0);
  return vec4(mix(diff, 1.0, ambient) * color + 0.8 * spec * vec3(1.0), 1.0);
}

void main(void) {
  float phase = fract(vTexPos.x - vTexPos.y + 0.25);
  uint ix = texture(uTexture, vec2(fract(phase + 0.5), 0.0)).r;
  vec3 color = colors[ix];
  vec3 normal = normalize(vNormal);
  fragColor = mix(lighting(color, normal, source1), lighting(color, normal, source2), 0.5);
}
