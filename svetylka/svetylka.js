'use strict';

window.addEventListener('DOMContentLoaded', function() {
  for(let i = 1; i <= 26; i++)
    if(Math.random() > .5)
      document.getElementById('s' + i).setAttribute('data-on', '');
  const order = 'ofeprtgcgomkdgekbltp';
  let ix = 0;
  window.setInterval(function() {
    let id = order.charCodeAt(ix++) - 'a'.charCodeAt(0);
    let elm = document.getElementById('s' + (++id));
    if(elm.hasAttribute('data-on'))
      elm.removeAttribute('data-on');
    else
      elm.setAttribute('data-on', '');
    if(ix == order.length) ix = 0;
  }, 1500);
});
