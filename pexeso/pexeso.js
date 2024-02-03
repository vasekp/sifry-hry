'use strict';

let stav = {
  _c: 0,
  _hraci: ['clovek', 'pocitac'],
  _otocene: []
};

Object.defineProperty(stav, 'hraje', {
  get: function() {
    return this._c >= 0 ? this._hraci[this._c] : '';
  },
  set: function(kdo) {
    this._c = this._hraci.indexOf(kdo);
    document.documentElement.setAttribute('data-hraje', this.hraje);
    switch(this._c) {
      case 0:
        this.ready = true;
        break;
      case 1:
        this.hrajPoc();
        // fallthrough
      default:
        this.ready = false;
    }
  }
});

Object.defineProperty(stav, 'skore', {
  get: function() {
    return +document.getElementById('skore-clovek').getAttribute('data-skore');
  },
  set: function(skore) {
    document.getElementById('skore-clovek').setAttribute('data-skore', skore);
  }
});

stav.muze = function(karta) {
  return karta.getAttribute('data-stav') === '';
}

stav.otoc = function(karta) {
  if(!this.ready || !this.muze(karta))
    return;
  karta.setAttribute('data-stav', 'otoc');
  this._otocene.push(karta);
  if(this._otocene.length == 2) {
    let k1 = this._otocene[0], k2 = this._otocene[1];
    if(shoda(k1, k2)) {
      setTimeout(function() {
        this.boduj();
        presun(k1, k2);
      }.bind(this), 500);
    } else {
      this.ready = false;
      setTimeout(function() {
        k1.setAttribute('data-stav', '');
        k2.setAttribute('data-stav', '');
        this.hraje = 'pocitac';
      }.bind(this), 1000);
    }
    this._otocene = [];
  }
}

stav.boduj = function() {
  if(++this.skore == 20) {
    this.hraje = '';
    document.getElementById('container').classList.add('done');
    document.getElementById('skore').hidden = true;
  }
}

stav.hrajPoc = function() {
  let active = document.querySelectorAll('[data-stav=""]');
  let k1 = random(active);
  let k2 = k1;
  while(k2 === k1 || shoda(k1, k2))
    k2 = random(active);
  setTimeout(function() { k1.setAttribute('data-stav', 'otoc'); }, 500);
  setTimeout(function() { k2.setAttribute('data-stav', 'otoc'); }, 1000);
  setTimeout(function() {
    k1.setAttribute('data-stav', '');
    k2.setAttribute('data-stav', '');
    if(Math.random() > .5)
      this.hlaska();
    stav.hraje = 'clovek';
  }.bind(this), 2000);
}

stav.hlaska = function() {
  let frustrace = (function(x) {
    if(x < 5) return 0;
    else if(x < 10) return 1;
    else return 2;
  })(this.skore);
  zahlas(random(hlasky[frustrace]));
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shoda(k1, k2) {
  let i1 = +k1.getAttribute('data-id'), i2 = +k2.getAttribute('data-id');
  return (Math.pow(i1, 4) % 1000) === (Math.pow(i2, 4) % 1000);
}

function zahlas(str) {
  let bub = document.getElementById('bublina-pocitac');
  bub.innerText = str;
  bub.classList.remove('show');
  bub.offsetWidth;
  bub.classList.add('show');
}

document.addEventListener('DOMContentLoaded', function() {
  let cont = document.getElementById('container');
  let karty = generuj();
  for(let i = 0; i < 40; i++) {
    let karta = karty[i];
    let node = document.createElement('div');
    node.classList.add('karta');
    node.setAttribute('data-id', karta.id);
    node.setAttribute('data-stav', '');
    let bp = (100 * karta.x / 4) + '% ' + (100 * karta.y / 7) + '%';
    node.style.backgroundPosition = bp;
    node.addEventListener('click', otoc);
    cont.appendChild(node);
  }
  stav.hraje = 'clovek';
  document.getElementById('hlava-pocitac').addEventListener('click',
    function() { zahlas(random(hlasky_klik)); });
  let img = document.createElement('img');
  img.src = 'images/pexeso-obrazky.jpg';
  img.addEventListener('load', function() {
    document.documentElement.removeAttribute('data-wait');
  });
});

function otoc(e) {
  stav.otoc(e.currentTarget);
}

function presun(k1, k2) {
  k1.setAttribute('data-stav', 'pryc');
  k2.setAttribute('data-stav', 'pryc');
  let div = document.createElement('div');
  k1 = k1.cloneNode();
  k2 = k2.cloneNode();
  if(+k1.getAttribute('data-id') % 8 === 1) {
    div.appendChild(k1);
    div.appendChild(k2);
  } else {
    div.appendChild(k2);
    div.appendChild(k1);
  }
  document.getElementById('collection').appendChild(div);
  div.offsetWidth;
  k1.setAttribute('data-stav', 'otoc');
  k2.setAttribute('data-stav', 'otoc');
}

function generuj() {
  let ids = [];
  let j = 841;
  for(let i = 0; i < 20; i++) {
    j = (j * 129) % 1000;
    ids.push(j);
    ids.push((j * 443) % 1000);
  }
  let ids_sort = ids.slice().sort();
  for(let i = 39; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    if(j == i)
      continue;
    let t = ids[i];
    ids[i] = ids[j];
    ids[j] = t;
  }
  let karty = [];
  for(let i = 0; i < 40; i++) {
    let id = ids[i];
    let index = ids_sort.indexOf(id);
    karty.push({ id: id, x: index % 5, y: Math.floor(index / 5)});
  }
  return karty;
}

let hlasky = [
  [
    'Cože?',
    'Jak to, že tam není?',
    'No to snad né.',
    'Fakt ne?',
    'Příště dám tři za sebou.',
    'Jen ti nechávám náskok.',
    'Těsně vedle.',
    'A ty k sobě copak nepatří?',
    'Tak to možná bylo vpravo?',
    'Jejda, teď jsem ti napověděl.',
    'Tady ještě včera dvojice ležela.',
  ], [
    'Zase nic??',
    'Kdo to míchal?',
    'Mrška jedna.',
    'Ale já to cvičil!',
    'Tam jsem ji nedával!',
    'Tam ještě před chvílí nebyla!',
    'Dvojice! ...Vlastně ne.',
    'Tam snad nejsou žádné dvě stejné!',
    'Tak zas nic.',
    'Ale to už...',
    'Já se přece nepletu!',
    'Štěstí ve hře, neštěstí v lásce.',
    'Jé, mně ujela ruka, můžu znovu?',
    'Jsem se nesoustředil.',
  ], [
    'Ty podvádíš!',
    'I ty to spleteš.',
    'Mě to už neba!',
    'S tebou už nehraju.',
    'Jen si hraj, však ti to jde.',
    'Příště chci hrát proti počítači.',
    'Ty s tím hýbeš, když se nedívám.',
    'Vždyť mi to tak šlo!',
    'Krucipísek!',
    'Ach joooo',
    'Příště!',
    'Jen počkej na odvetu.',
    'Jindy v tomhle válím.',
    'Přece mě neporazí člověk!',
    'Zavolám domů, oni mě opraví.',
    'Víš co, sežer si to.',
    'Potřebuješ mě tu ještě vůbec?',
  ]
];

let hlasky_klik = [
  'Nesahat!',
  'Ťukej si na svoji hlavu!',
  'Nech si ty své prsty.',
  'Myslíš, že ti dám nápovědu nebo co?',
  'To lechtá!',
  'Moje plechová, tvoje dutá.',
  'Abych tě taky neťuk\'.',
  'Nech si toho a hraj.',
];
