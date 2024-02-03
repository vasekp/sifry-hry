const vertText = `#version 300 es

layout(location = 0) in vec3 coords;
layout(location = 1) in vec3 start;

out vec3 tri;

uniform float time;

const mat3 mx = mat3(-.866, -.5, 0, .866, -.5, 0, 0, 1, 0);

const float size = 0.1;

void main() {
  tri = coords;
  gl_Position = vec4(start + mx * coords * size, start.z);
}`;

const fragText = `#version 300 es
precision highp float;

in vec3 tri;

out vec4 color;

void main() {
  float a = step(1.5, length(step(tri, vec3(1, 1, 1) / 2.)));
  float b = step(1.5, length(step(vec3(1, 1, 1) / 6., tri)));
  color = vec4(max(a, b) * vec3(1, 0, 1), 1);
}`;

window.addEventListener('DOMContentLoaded', _ => {
  const c = document.querySelector('canvas');
  const dpr = window.devicePixelRatio;
  c.width = c.clientWidth * dpr;
  c.height = c.clientHeight * dpr;

  const gl = c.getContext('webgl2'); // TODO ResizeObserver
  if(!gl) {
    alert('Váš prohlížeč nepodporuje technologii WebGL2, bez níž nelze tento program spustit.');
    return;
  }

  gl.clearColor(0, 0, 0, 1);

  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, vertText);
  gl.compileShader(vert);
  if(!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    alert(`Nastala chyba při inicializaci. Nahlaste prosím její znění: ${gl.getShaderInfoLog(vert)}`);
    return;
  }

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, fragText);
  gl.compileShader(frag);
  if(!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    alert(`Nastala chyba při inicializaci. Nahlaste prosím její znění: ${gl.getShaderInfoLog(frag)}`);
    return;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    alert(`Nastala chyba při inicializaci. Nahlaste prosím její znění: ${gl.getProgramInfoLog(prog)}`);
    return;
  }
  gl.useProgram(prog);

  const triLoc = 0;
  const triData = new Float32Array([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]);
  const triBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(triLoc);
  gl.vertexAttribPointer(triLoc, 3, gl.FLOAT, false, 0, 0);

  const posLoc = 1;
  const posData = new Float32Array([ -.5, -.5, 1, .5, .5, 1.5 ]);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, posData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(posLoc, 1);

  function draw(tstamp) {
    gl.viewport(0, 0, c.width, c.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 2);
    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
});
