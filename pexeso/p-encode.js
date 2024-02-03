const levels = [
  "upkfabcdinmlkpu",
  "vwxstojidcbgfkpqv",
  "upkfafklmnotytoje",
  "upklmnonmlkfgbcdijoty",
  "uvwxstojidcbafkpu",
  "upkfafklmhidihmrsx",
  "upkfgbcdijonmlklmnoty"
];

// Stream:
// "dvctdrdxutgrgryowblwleoccyljsgdt".ords(abc):add(-1).fold(#1*23+#2,#1+#2,17):add(1):chrm(abc.first(25)).cat

const enc = [];
const dec = [];

function chr(x) {
  return String.fromCharCode(97 + x);
}

function ord(x) {
  return x.charCodeAt(0) - 97;
}

let q1 = 17;
for(const seq of levels) {
  let q2 = q1;
  let out = '';
  for(const s of seq) {
//  console.log([q1, q2]);
    let dc = (((ord(s) - q2) % 25) + 25) % 25;
    out += chr(dc);
    q2 = (q2 * 23 + dc) % 25;
  }
  console.log(out);
  enc.push(out);
  q1 = q2;
}

console.log('');

q1 = 17;
for(const seq of enc) {
  let q2 = q1;
  let out = '';
  for(const s of seq) {
    console.log([q1, q2]);
    let dc = (ord(s) + q2) % 25;
    out += chr(dc);
    q2 = (q2 * 23 + ord(s)) % 25;
  }
  console.log(out);
  dec.push(out);
  q1 = q2;
}

console.log(dec.length == levels.length);
for(let i = 0; i < dec.length; i++)
  console.log(levels[i] == dec[i]);
