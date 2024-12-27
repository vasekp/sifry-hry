'use strict';

const model = {
  tilt: 0.24,
  angle: -0.4
};

const wordlist = fetch('slova.txt')
  .then(r => r.text()
   .then(t => t.split('\n').map(s => s.toLowerCase())));

const wasmP = fetch('wasm.wasm')
  .then(async r => {
    const w = await WebAssembly.instantiate(await r.arrayBuffer(), {env: {sqrt: Math.sqrt, cos: Math.cos}});
    return w.instance.exports
  });

const patt = 'áčďéěíňóřšťúůýž';
const repl = 'acdeeinorstuuyz';
const nmap = {};
for(let i = 0; i < patt.length; i++)
  nmap[patt[i]] = repl[i];

async function processInput(text) {
  const wasm = await wasmP;
  const membuf = wasm.memory.buffer;

  const maxLen = 20;
  const iBuf = wasm.input.value;
  const iArr = new Uint8Array(membuf, iBuf, maxLen);
  const enc = new TextEncoder();
  const ntext = text.replace(/[^ -~]/g, c => nmap[c] || c);
  enc.encodeInto(ntext + '\0', iArr);
  wasm.process();

  const oSize = 4 * 4 * 4;
  const oBuf = wasm.uniforms.value;
  const uArr = new Uint8Array(membuf, oBuf, oSize);
  const fArr = new Float32Array(membuf, oBuf, oSize / 4);
  uArr[14] = ntext !== text ? 1 : 0;
  model.count = fArr[2];
  model.data = uArr;

  const tBuf = wasm.texture.value;
  model.tex = new Uint8Array(membuf, tBuf, wasm.get_texlen());
}

async function initGL(gl) {
  const fnames = [
    'background.vert',
    'background.frag',
    'box.vert',
    'box.frag',
    'ribbon.vert',
    'ribbon.frag',
    'bow.vert'];
  const files = {};
  const get = async fn => files[fn] = await fetch(fn).then(r => r.text());
  await Promise.all(fnames.map(get));

  gl.progs = {};
  gl.progs.bkg = createProgram(gl, files['background.vert'], files['background.frag']);
  gl.progs.box = createProgram(gl, files['box.vert'], files['box.frag']);
  gl.progs.ribbon = createProgram(gl, files['ribbon.vert'], files['ribbon.frag']);
  gl.progs.bow = createProgram(gl, files['bow.vert'], files['ribbon.frag']);

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  const ubuff = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, ubuff);
  gl.bufferData(gl.UNIFORM_BUFFER, 4 * 4 * 5, gl.DYNAMIC_DRAW);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubuff);
}

function draw(gl) {
  const progs = gl.progs;
  document.getElementById('overlay').hidden = true;

  gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array(calcQView()));
  gl.bufferSubData(gl.UNIFORM_BUFFER, 16, model.data);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI,
    model.tex.length, 1, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE,
    model.tex, 0);

  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(progs.bkg.program);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.useProgram(progs.box.program);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 6);

  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(progs.ribbon.program);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 8);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(progs.bow.program);
  const divs = 10;
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (2*model.count + 1) * divs, 2);
}

window.addEventListener('DOMContentLoaded', _ => {
  const canvas = document.querySelector('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  const gl = canvas.getContext('webgl2');
  if(!gl) {
    alert('Litujeme, Váš prohlížeč nepodporuje technologii WebGL2 potřebnou pro tuto stránku.');
    return;
  }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  const initP = initGL(gl);
  const redraw = _ => initP.then(_ => requestAnimationFrame(_ => draw(gl)));

  const interaction = {};

  function pStart(elm, x, y) {
    interaction.lastX = x;
    interaction.lastY = y;
  }

  function pMove(elm, x, y) {
    model.tilt += (y - interaction.lastY) / elm.clientHeight * 4;
    if(model.tilt > Math.PI / 2)
      model.tilt = Math.PI / 2;
    else if(model.tilt < -Math.PI / 2)
      model.tilt = -Math.PI / 2;
    model.angle += (x - interaction.lastX) / elm.clientWidth * 4;
    interaction.lastX = x;
    interaction.lastY = y;
    redraw();
  }

  addPointerListeners(canvas, pStart, pMove, null);

  const input = document.querySelector('input');
  input.addEventListener('input', _ => {
    input.setCustomValidity('');
  });
  input.addEventListener('change', async _ => {
    const text = input.value.trim().toLowerCase().normalize();
    if(text.length == 0)
      return;
    if(text.includes(' ')) {
      input.setCustomValidity('Zadávejte pouze jedno slovo.');
      return;
    }
    if(!(await wordlist).includes(text)) {
      input.setCustomValidity(`Slovo '${text}' nemám ve slovníku. Zkuste jen podstatná jména v základním tvaru.`);
      return;
    }
    await processInput(text);
    redraw();
  });

  input.value = 'tápání';
  input.dispatchEvent(new Event('change'));
});

function createProgram(gl, vs, fs) {
  function makeShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      throw 'Shader compilation failed.';
    }
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, makeShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw 'Program linking failed.';
  }

  const ret = {program};

  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for(let i = 0; i < numUniforms; i++) {
    let name = gl.getActiveUniform(program, i).name;
    if(name.indexOf('[') > 0)
      name = name.substring(0, name.indexOf('['));
    const loc = gl.getUniformLocation(program, name);
    ret[name] = loc;
  }

  const index = gl.getUniformBlockIndex(program, "block");
  if(index < 10)
    gl.uniformBlockBinding(program, index, 0);

  const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for(let i = 0; i < numAttribs; i++) {
    const name = gl.getActiveAttrib(program, i).name;
    const loc = gl.getAttribLocation(program, name);
    ret[name] = loc;
  }

  return ret;
}

function addPointerListeners(elm, fStart, fMove, fEnd) {
  const rect = elm.getBoundingClientRect();
  const callBack = (ev, func) => {
    if(!func)
      return;
    func(elm, ev.clientX - rect.left, ev.clientY - rect.top, rect);
  }

  let pActive = false;
  let pId;

  elm.addEventListener('pointerdown', ev => {
    if(pActive)
      return;
    pActive = true;
    pId = ev.pointerId;
    elm.setPointerCapture(pId);
    ev.preventDefault();
    callBack(ev, fStart);
  });

  elm.addEventListener('pointermove', ev => {
    if(!pActive || pId !== ev.pointerId)
      return;
    callBack(ev, fMove);
  });

  elm.addEventListener('pointerup', ev => {
    if(!pActive || pId !== ev.pointerId)
      return;
    pActive = false;
    elm.releasePointerCapture(pId);
    callBack(ev, fEnd);
  });

  elm.addEventListener('pointercancel', ev => {
    if(!pActive || pId !== ev.pointerId)
      return;
    pActive = false;
    elm.releasePointerCapture(pId);
    callBack(ev, fEnd);
  });

  elm.addEventListener('touchstart', ev => ev.preventDefault());
  elm.style['touch-action'] = 'none';
}

function qmulq(q1, q2) {
  return [
    q1[3]*q2[0] + q2[3]*q1[0] + q1[1]*q2[2] - q1[2]*q2[1],
    q1[3]*q2[1] + q2[3]*q1[1] + q1[2]*q2[0] - q1[0]*q2[2],
    q1[3]*q2[2] + q2[3]*q1[2] + q1[0]*q2[1] - q1[1]*q2[0],
    q1[3]*q2[3] - q1[0]*q2[0] - q1[1]*q2[1] - q1[2]*q2[2]
  ];
}

function calcQView() {
  return qmulq(
    [Math.sin((model.tilt - Math.PI/2)/2), 0, 0, Math.cos((model.tilt - Math.PI/2)/2)],
    [0, 0, Math.sin(model.angle/2), Math.cos(model.angle/2)]
  );
}
