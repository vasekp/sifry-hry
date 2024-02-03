'use strict';

const dirs = {
  unset: 0,
  left: -1,
  right: 1,
  up: -2,
  down: 2
};

const dirV = {
  [dirs.left]: [-1, 0],
  [dirs.right]: [1, 0],
  [dirs.up]: [0, -1],
  [dirs.down]: [0, 1],
  [dirs.unset]: [0, 0]
};

class Pacman {
  constructor(obj, nodeCB, edgeCB) {
    this.obj = obj;
    this.dir = dirs.unset;
    this.nextDir = dirs.unset;
    this.nodeCB = nodeCB;
    this.edgeCB = edgeCB;
    this.stopped = false;
    this.trans = false;
    this.obj.addEventListener('transitionstart', () => {
      this.trans = true;
    });
    this.obj.addEventListener('transitionend', () => {
      this.nodeCB([this.x, this.y]);
      this.dir = this.nextDir;
      this.trans = false;
    });
  }

  set x(x) {
    this.obj.style.setProperty('--x', x);
  }

  set y(y) {
    this.obj.style.setProperty('--y', y);
  }

  get x() {
    return +this.obj.style.getPropertyValue('--x');
  }

  get y() {
    return +this.obj.style.getPropertyValue('--y');
  }

  reset(x, y) {
    this.obj.classList.add('notrans');
    this.x = x;
    this.y = y;
    this.stopped = false;
    this.obj.dataset.dir = dirs.right;
    this.obj.offsetWidth;
    this.obj.classList.remove('notrans');
  }

  set dir(dir) {
    const [dx, dy] = dirV[dir];
    let newX = this.x + dx;
    let newY = this.y + dy;
    if(newX < 0 || newX > 4 || newY < 0 || newY > 4) {
      if(this.dir == dir)
        this.dir = dirs.unset;
      else
        this.dir = this.next = this.dir;
      return;
    }
    this._dir = dir;
    if(dir != dirs.unset) {
      this.obj.dataset.dir = dir;
      this.edgeCB([this.x, this.y], [newX, newY]);
      this.x = newX;
      this.y = newY;
    }
  }

  get dir() {
    return this._dir;
  }

  set next(dir) {
    if(this.stopped)
      return;
    if(dir == -this.dir && !this.trans) {
      window.setTimeout(() => this.next = dir);
      return;
    }
    if(dir == -this.dir || this.dir == dirs.unset)
      this.nextDir = this.dir = dir;
    else
      this.nextDir = dir;
  }

  stop() {
    this.next = this.dir = dirs.unset;
    this.stopped = true;
  }
};

class Board {
  constructor(cont) {
    const tWall = document.getElementById('wall').content.firstElementChild;
    for(let x = 0; x < 4; x++)
      for(let y = 0; y < 4; y++) {
        const wall = tWall.cloneNode();
        wall.style.setProperty('--x', x);
        wall.style.setProperty('--y', y);
        cont.appendChild(wall);
      }
    this.objs = [];
    {
      const tFood = document.getElementById('jidlo').content.firstElementChild;
      for(let y = 0; y <= 4; y++) {
        const arr = [];
        for(let x = 0; x <= 4; x++) {
          const obj = tFood.cloneNode(true);
          obj.style.setProperty('--x', x);
          obj.style.setProperty('--y', y);
          arr.push(obj);
          container.appendChild(obj);
        }
        this.objs.push(arr);
      }
    }
  }

  set(x, y, v) {
    const obj = this.objs[y][x];
    obj.style.setProperty('--clr-old', obj.style.getPropertyValue('--clr'));
    obj.style.setProperty('--clr', v ? '#000' : '#fff');
    obj.dataset.active = v ? 1 : 0;
    obj.classList.add('blink');
    obj.addEventListener('animationend', () => obj.classList.remove('blink'), {once: true});
  }

  setImm(x, y, v) {
    const obj = this.objs[y][x];
    obj.style.setProperty('--clr', v ? '#000' : '#fff');
    obj.dataset.active = v ? 1 : 0;
  }

  get(x, y) {
    return +this.objs[y][x].dataset.active;
  }
}

const levels = [
  /* Verte mi, rychlejsi je si to zahrat. */
  "dvctdrdxutgrgry",
  "owblwleoccyljsgdt",
  "fpuppkplbjnindsix",
  "jdgnucjovwqckifrnlyam",
  "hptkjdsicntxigcen",
  "vroilwetcawdfickws",
  "mtibnyhlghliosdwsiqyp"
];

function update(id, value) {
  const obj = document.getElementById(id);
  obj.dataset.value = value;
  obj.classList.add('safari-sucks');
  obj.offsetWidth;
  obj.classList.remove('safari-sucks');
}

function chr(x) {
  return String.fromCharCode(97 + x);
}

function ord(x) {
  return x.charCodeAt(0) - 97;
}

function coords(s, q) {
  if(s === undefined)
    return [-1, -1];
  else {
    let z = (ord(s) + q) % 25;
    return [z % 5, Math.floor(z / 5)];
  }
}

function coords2(s, q) {
  let q2 = (q * 23 + ord(s)) % 25;
  return [coords(s[0], q), coords(s[1], q2)];
}

class Game {
  constructor(cont) {
    this.q1 = 17;
    this.board = new Board(cont);
    this.pras = cont.querySelector('#prasatko');
    this.pacman = new Pacman(cont.querySelector('#pacman'), this.nodeCB.bind(this), this.edgeCB.bind(this));
    this.banner = cont.querySelector('#banner');
    this.level = 0;
    cont.offsetWidth;
  }

  set level(level) {
    this.q2 = this.q1;
    this._level = level;
    this.seq = levels[level];
    this.pras.hidden = true;
    this.banner.hidden = true;
    document.body.style.setProperty('--speed', level);
    update('level', level + 1);
    this.score = 0;
    let [[sx, sy], [nx, ny]] = coords2(this.seq, this.q2);
    this.pacman.reset(sx, sy);
    for(let x = 0; x <= 4; x++)
      for(let y = 0; y <= 4; y++)
        if(Math.abs(x - sx) + Math.abs(y - sy) == 1)
          this.board.setImm(x, y, !(x == nx && y == ny));
        else
          this.board.setImm(x, y, Math.random() < 0.3);
    this.board.setImm(sx, sy, false);
  }

  get level() {
    return this._level;
  }

  advance() {
    this.q1 = this.q2;
    this.level++;
  }

  reset() {
    this.level = this._level;
  }

  restart() {
    this.q1 = 17;
    this.level = 0;
  }

  set score(score) {
    this._score = score;
    update('score', score);
  }

  get score() {
    return this._score;
  }

  cmd(dir) {
    this.pacman.next = dir;
  }

  nodeCB(pos) {
    const [x, y] = pos;
    if(this.board.get(x, y)) {
      this.seq = '';
      this.board.setImm(x, y, false);
      this.incScore();
      this.pras.hidden = true;
    }
    const [sx, sy] = coords(this.seq[0], this.q2);
    if(this.seq.length == 1 && x == sx && y == sy) {
      this.q2 = (this.q2 * 23 + ord(this.seq)) % 25;
      this.pacman.stop();
      this.banner.dataset.which = this.level < levels.length - 1 ? 'level' : 'win';
      this.banner.hidden = false;
    }
  }

  edgeCB(opos, npos) {
    const [ox, oy] = opos;
    const [nx, ny] = npos;
    let [s1, s2] = coords2(this.seq, this.q2);
    if(ox == s1[0] && oy == s1[1] && nx == s2[0] && ny == s2[1]) {
      this.q2 = (this.q2 * 23 + ord(this.seq)) % 25;
      this.seq = this.seq.substring(1);
      [s1, s2] = coords2(this.seq, this.q2);
      if(this.seq.length == 1) {
        this.pras.style.setProperty('--x', s1[0]);
        this.pras.style.setProperty('--y', s1[1]);
        this.pras.hidden = false;
      }
    }
    const nAct = this.board.get(nx, ny);
    for(let x = 0; x <= 4; x++)
      for(let y = 0; y <= 4; y++) {
        if(x == ox && y == oy) continue;
        if(x == nx && y == ny) continue;
        if(x == s1[0] && y == s1[1]) continue;
        if(!nAct && (Math.abs(x - nx) + Math.abs(y - ny) == 1))
          this.board.set(x, y, !(x == s2[0] && y == s2[1]));
        else if(!(x == s2[0] && y == s2[1]))
          if(Math.random() < 0.2)
            this.board.set(x, y, Math.random() < 0.3);
      }
  }

  incScore() {
    if(++this.score >= 10) {
      this.pacman.stop();
      this.banner.dataset.which = 'retry';
      this.banner.hidden = false;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game(document.getElementById('container'));

  document.addEventListener('keydown', e => {
    switch(e.code) {
      case 'ArrowRight':
      case 'KeyD':
        game.cmd(dirs.right);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        game.cmd(dirs.left);
        break;
      case 'ArrowUp':
      case 'KeyW':
        game.cmd(dirs.up);
        break;
      case 'ArrowDown':
      case 'KeyS':
        game.cmd(dirs.down);
        break;
    }
  });

  document.getElementById('controls').addEventListener('pointerdown', e => {
    const w = e.currentTarget.offsetWidth;
    const dx = e.offsetX / w - 1/2;
    const dy = e.offsetY / w - 1/2;
    if(Math.abs(dx) > Math.abs(dy))
      game.cmd(dx > 0 ? dirs.right : dirs.left);
    else
      game.cmd(dy > 0 ? dirs.down : dirs.up);
  });

  document.getElementById('next').addEventListener('click', () => game.advance());
  document.getElementById('retry').addEventListener('click', () => game.reset());
  document.getElementById('restart').addEventListener('click', () => game.restart());
});
