const zMin = 1./3.;
const nFlakes = 5000;
const aspect = 5./3.;
const nSlices = 8;
const fallSpeed = 0.00008;

const vertFlakes = `#version 300 es

layout(location = 0) in vec3 rand;
layout(location = 1) in vec3 axis1;
layout(location = 2) in vec3 axis2;
layout(location = 3) in float angle;

out vec2 tri;
out float bri;
out float depth;

uniform highp sampler3D tex;
uniform float time;
uniform float slice;

const mat3 mx = mat3(-.866, -.5, 0, .866, -.5, 0, 0, 1, 0);

const float size = 0.005;
const float sFall = ${fallSpeed};
const float sRot1 = 0.0005;
const float sRot2 = 0.001;
const vec3 gleamDir = normalize(vec3(1, 1, 1));

vec4 qmul(vec4 a, vec4 b) {
  return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz));
}

vec4 qconj(vec4 q) {
  return vec4(-q.xyz, q.w);
}

vec4 qrot(vec4 v, vec4 q) {
  return qmul(qmul(q, v), qconj(q));
}

vec3 rot(vec3 v, vec4 q1, vec4 q2) {
  return qrot(qrot(vec4(v, 0), q1), q2).xyz;
}

void main() {
  vec3 start;
  vec3 r2 = rand;
  r2.x = (r2.x + slice) / ${nSlices}.;
  start.xy = texture(tex, r2).xy * 2. - 1.;
  start.z = mix(${zMin}, 1., rand.z);
  start.x *= start.z * ${aspect};
  start.y *= -1.;
  vec2 xy = vec2(start.x, mod(start.y + 2. * slice - sFall * time + ${nSlices}., ${2*nSlices}.) - ${nSlices}.);
  float a1 = angle + sRot1 * time;
  float a2 = angle + sRot2 * time;
  vec4 q1 = vec4(sin(a1) * axis1, cos(a1));
  vec4 q2 = vec4(sin(a2) * axis2, cos(a2));
  vec3 c = mx[gl_VertexID % 3] * sign(float(gl_VertexID) - 2.5);
  vec3 d = rot(c, q1, q2);
  vec3 n = rot(vec3(0, 0, 1), q1, q2);
  gl_Position = vec4(xy + size * d.xy, start.z * start.z, start.z) * vec4(1. / ${aspect}, 1, 1, 1);
  tri = c.xy;
  bri = 1. + pow(abs(dot(n, gleamDir)), 10.);
  depth = start.z;
}`;

const fragFlakes = `#version 300 es
precision highp float;

uniform sampler2D flake;

in vec2 tri;
in float bri;
in float depth;

out vec4 color;

void main() {
  float c = texture(flake, (tri + vec2(1., 1.))/ 2.).a;
  color = vec4(bri, bri, bri, 1. - depth) * c;
}`;

const vertFlat = `#version 300 es

layout(location = 0) in vec2 coords;

void main() {
  gl_Position = vec4(coords, 1, 1);
}`;

const fragFlat = `#version 300 es
precision highp float;

out vec4 color;

void main() {
  //color = vec4(0.58, 0.61, 0.67, 1);
  color = vec4(0.10, 0.08, 0.21, 1);
}`;

window.addEventListener('DOMContentLoaded', async _ => {
  const c = document.querySelector('canvas');
  const dpr = window.devicePixelRatio;

  const observer = new ResizeObserver(_ => {
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
  });
  observer.observe(c);

  const gl = c.getContext('webgl2');
  if(!gl) {
    alert('Váš prohlížeč nepodporuje technologii WebGL2, bez níž nelze tento program spustit.');
    return;
  }

  const progFlakes = loadProgram(gl, vertFlakes, fragFlakes);
  const progFlat = loadProgram(gl, vertFlat, fragFlat);

  const timeLoc = gl.getUniformLocation(progFlakes, "time");
  const texLoc = gl.getUniformLocation(progFlakes, "tex");
  const flakeLoc = gl.getUniformLocation(progFlakes, "flake");
  const sliceLoc = gl.getUniformLocation(progFlakes, "slice");

  const vaoFlakes = gl.createVertexArray();
  {
    gl.bindVertexArray(vaoFlakes);

    const flakeArray = [];
    for(let k = 0; k < nSlices; k++) {
      for(let i = 0; i < nFlakes; i++) {
        // Prostě úplně náhodně rozházené, co jste čekali? :-)
        const x = Math.random();
        const y = Math.random();
        const z = Math.random();

        flakeArray.push(x, y, z);
        flakeArray.push(...randvec());
        flakeArray.push(...randvec());
        flakeArray.push(Math.random() * Math.PI);
      }
    }

    const flakeData = new Float32Array(flakeArray);
    const flakeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, flakeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flakeData, gl.STATIC_DRAW);

    const posLoc = 0;
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribDivisor(posLoc, 1);

    const axis1Loc = 1;
    gl.enableVertexAttribArray(axis1Loc);
    gl.vertexAttribPointer(axis1Loc, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribDivisor(axis1Loc, 1);

    const axis2Loc = 2;
    gl.enableVertexAttribArray(axis2Loc);
    gl.vertexAttribPointer(axis2Loc, 3, gl.FLOAT, false, 40, 24);
    gl.vertexAttribDivisor(axis2Loc, 1);

    const angleLoc = 3;
    gl.enableVertexAttribArray(angleLoc);
    gl.vertexAttribPointer(angleLoc, 1, gl.FLOAT, false, 40, 36);
    gl.vertexAttribDivisor(angleLoc, 1);
  }

  const vaoFlat = gl.createVertexArray();
  {
    gl.bindVertexArray(vaoFlat);

    const coordLoc = 0;
    const coordData = new Float32Array([ 1, 1, 1, -1, -1, 1, -1, -1 ]);
    const coordBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coordBuf);
    gl.bufferData(gl.ARRAY_BUFFER, coordData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(coordLoc);
    gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
  }

  {
    const img = new Image();
    img.src = 'tex.png';
    await img.decode();
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, nSlices * 256, 256, img.height / 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.useProgram(progFlakes);
    gl.uniform1i(texLoc, 0);
  }

  {
    const img = new Image();
    img.src = 'vlocka.png';
    await img.decode();
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 128, 128, 0, gl.ALPHA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.useProgram(progFlakes);
    gl.uniform1i(flakeLoc, 1);
  }

  gl.clearColor(0, 0, 0, .5);
  gl.depthRange(zMin, 1);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE, gl.ZERO);

  function draw(tstamp) {
    gl.viewport(0, 0, c.width, c.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    let slice = Math.floor(tstamp * fallSpeed / 2);
    gl.blendEquation(gl.MAX);
    gl.useProgram(progFlakes);
    gl.bindVertexArray(vaoFlakes);
    gl.uniform1f(timeLoc, tstamp);
    gl.uniform1f(sliceLoc, slice % nSlices);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nFlakes);
    gl.uniform1f(sliceLoc, (slice + 1) % nSlices);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nFlakes);

    gl.blendEquation(gl.FUNC_ADD);
    gl.useProgram(progFlat);
    gl.bindVertexArray(vaoFlat);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);

  document.getElementById('play').addEventListener('click', _ => {
    const elm = document.querySelector('audio');
    if(elm.paused)
      elm.play().then(_ => elm.dataset.playing = 1);
    else {
      elm.pause();
      delete elm.dataset.playing;
    }
  });
});

function randvec() {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;
  const z = Math.random() * 2 - 1;
  const l = Math.sqrt(x*x + y*y + z*z);
  return [x/l, y/l, z/l];
}

function loadProgram(gl, vertText, fragText) {
  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, vertText);
  gl.compileShader(vert);
  if(!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    alert(`Nastala chyba při inicializaci. Nahlaste prosím její znění: ${gl.getShaderInfoLog(vert)}`);
    throw null;
  }

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, fragText);
  gl.compileShader(frag);
  if(!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    alert(`Nastala chyba při inicializaci. Nahlaste prosím její znění: ${gl.getShaderInfoLog(frag)}`);
    throw null;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    alert(`Nastala chyba při inicializaci. Nahlaste prosím její znění: ${gl.getProgramInfoLog(prog)}`);
    throw null;
  }

  return prog;
}
