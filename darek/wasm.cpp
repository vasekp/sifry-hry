constexpr unsigned MAX_LEN = 20;
constexpr float TAU = 2.f * 3.14159265f;
constexpr float IGR = 0.618034f;

extern "C" float sqrt(float);
extern "C" float cos(float);

struct vec4 {
  float r;
  float g;
  float b;
  float w;

  static constexpr vec4 hue(float x) {
    return vec4{rcos(x), rcos(x + 1.f/3.f), rcos(x + 2.f/3.f), 1.f};
  }

  static constexpr vec4 hue(unsigned x) {
    return hue(IGR * (float)x);
  }

  static const vec4 GRAY;

private:
  static float rcos(float x) {
    return (1.f + cos(TAU * x)) / 2.f;
  }
};

inline constexpr vec4 vec4::GRAY = vec4{0.5f, 0.5f, 0.5f, 1.0f};

/*****/

extern "C" {

char input[MAX_LEN];

struct {
  float size;
  float sizeUnit;
  float count;
  int pattern;
  vec4 colors[3];
} uniforms;

unsigned char texture[6];
unsigned texlen;

void process() {
  const unsigned size = []() {
    for(unsigned i = 0; i < MAX_LEN; i++)
      if(input[i] == '\0')
        return i;
    __builtin_unreachable();
  }();
  uniforms.size = (float)size;
  uniforms.sizeUnit = 0.3f / sqrt(uniforms.size);

  unsigned freq[26];
  unsigned uniqc = 0;
  unsigned uniq[26];
  unsigned repc = 0;

  for(unsigned i = 0; i < 26; i++)
    freq[i] = 0; // no memset ⇒ no = {0} init

  for(unsigned i = 0; i < size; i++) {
    unsigned ix = input[i] - 'a';
    unsigned f = ++freq[ix];
    if(f == 2)
      repc++;
  }

  texlen = 0;
  constexpr char vw[] = {'a', 'e', 'i', 'o', 'u', 'y'};
  for(int i = 0; i < sizeof(vw); i++) {
    unsigned ix = vw[i] - 'a';
    if(freq[ix] > 0) {
      texture[texlen++] = i + 1;
      freq[ix] = 0;
    }
  }

  if(texlen == 0) {
    texture[texlen++] = 0;
  }

  for(unsigned i = 0; i < 26; i++)
    if(freq[i] > 0)
      uniq[uniqc++] = i;

  uniforms.count = (float)repc;
  switch(uniqc) {
    case 0:
      uniforms.colors[0] = vec4::GRAY;
      uniforms.pattern = 0;
      break;
    case 1:
      uniforms.colors[0] = vec4::hue(uniq[0]);
      uniforms.pattern = 0;
      break;
    case 2:
      if(freq[uniq[0]] < freq[uniq[1]]) {
        uniforms.colors[0] = vec4::hue(uniq[1]);
        uniforms.colors[1] = vec4::hue(uniq[0]);
      } else {
        uniforms.colors[0] = vec4::hue(uniq[0]);
        uniforms.colors[1] = vec4::hue(uniq[1]);
      }
      if(freq[uniq[0]] == freq[uniq[1]])
        uniforms.pattern = 2;
      else
        uniforms.pattern = 1;
      break;
    default:
      uniforms.colors[0] = vec4::hue(uniq[0]);
      uniforms.colors[1] = vec4::hue(uniq[1]);
      uniforms.colors[2] = vec4::hue(uniq[2]);
      uniforms.pattern = uniqc == 3 ? 3 : 4;
      break;
  }
}

unsigned get_texlen() {
  return texlen;
}

}
