(function(){
  "use strict";
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var DUR = 400;

  var labels = [].slice.call(document.querySelectorAll('.t'));
  labels.forEach(function(el){ el.dataset.text = el.textContent; });

  function reserve(){
    var w = [];
    labels.forEach(function(el){ el.style.width = ''; });
    labels.forEach(function(el){ w.push(el.getBoundingClientRect().width); });
    labels.forEach(function(el,i){ el.style.width = (Math.ceil(w[i]*100)/100) + 'px'; });
  }

  function settle(el){
    if (el._raf){ cancelAnimationFrame(el._raf); el._raf = 0; }
    if (el._t){ clearTimeout(el._t); el._t = 0; }
    el.textContent = el.dataset.text;
  }

  function decode(el, dur){
    var text = el.dataset.text, n = text.length;
    if (RM){ settle(el); return; }
    settle(el);
    var D = dur || DUR;
    var t0 = performance.now(), lastRoll = 0;
    var rand = new Array(n);
    function roll(){ for (var i=0;i<n;i++) rand[i] = CH.charAt((Math.random()*26)|0); }
    roll();
    function step(now){
      var p = Math.min(1, (now - t0) / D), front = p * n, out = '', i;
      if (now - lastRoll > 45){ roll(); lastRoll = now; }
      for (i = 0; i < n; i++){
        var c = text.charAt(i);
        if (i < front) out += c;
        else if (i < front + 3.6) out += (c === ' ' ? ' ' : rand[i]);
        else break;
      }
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(step); else settle(el);
    }
    el._raf = requestAnimationFrame(step);
    el._t = setTimeout(function(){ settle(el); }, D + 500);
  }

  [].forEach.call(document.querySelectorAll('a, button'), function(el){
    var t = el.querySelector('.t');
    if (!t) return;
    el.addEventListener('pointerenter', function(){ decode(t); });
  });

  var bg = document.querySelector('.bg');
  var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

  function tick(){
    cx += (tx - cx) * 0.045;
    cy += (ty - cy) * 0.045;
    var w = innerWidth, h = innerHeight;
    var dx = -cx * w * 0.0156, dy = -cy * h * 0.015;
    var cover = 2 * Math.max(Math.abs(dx) / w, Math.abs(dy) / h);
    var sc = 1 + cover + 0.014 * Math.max(0, cy);
    if(bg) bg.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0) scale(' + sc.toFixed(4) + ')';
    if (Math.abs(tx - cx) < 0.0004 && Math.abs(ty - cy) < 0.0004){ running = false; return; }
    requestAnimationFrame(tick);
  }
  function wake(){ if (!running && !RM && bg){ running = true; requestAnimationFrame(tick); } }

  window.addEventListener('pointermove', function(e){
    if (e.pointerType === 'touch') return;
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
    wake();
  }, {passive:true});
  document.addEventListener('pointerleave', function(){ tx = 0; ty = 0; wake(); });

  var audio = document.querySelector('.audio');
  if(audio) {
    audio.addEventListener('click', function(){
      var on = audio.getAttribute('aria-pressed') === 'true';
      audio.setAttribute('aria-pressed', String(!on));
      audio.classList.toggle('muted', on);
      var t = audio.querySelector('.t');
      t.dataset.text = on ? 'AUDIO OFF' : 'AUDIO ON';
      decode(t);
    });
  }

  var menu = document.querySelector('.menu');
  var navset = document.getElementById('navset');
  var menuLabel = menu ? menu.querySelector('.t') : null;
  var root = document.documentElement;

  function setMenu(open){
    if(!menu || !navset) return;
    root.classList.toggle('nav-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menuLabel.dataset.text = open ? 'CLOSE' : 'MENU';
    decode(menuLabel);
    if (open) requestAnimationFrame(function(){
      var first = navset.querySelector('a');
      if (first) try { first.focus(); } catch(err){}
    });
  }
  if(menu) {
    menu.addEventListener('click', function(e){
      e.stopPropagation();
      setMenu(!root.classList.contains('nav-open'));
    });
  }
  if(navset) {
    navset.addEventListener('click', function(e){
      if (e.target.closest('a')) setMenu(false);
    });
  }
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && root.classList.contains('nav-open')){ setMenu(false); menu.focus(); }
  });
  document.addEventListener('click', function(e){
    if (root.classList.contains('nav-open') && !navset.contains(e.target) && e.target !== menu)
      setMenu(false);
  });
  addEventListener('resize', function(){
    if (innerWidth > 830 && root.classList.contains('nav-open')) setMenu(false);
  });

  function boot(){
    reserve();
    if (RM) return;
    function at(sel, t0, step){
      [].slice.call(document.querySelectorAll(sel)).forEach(function(el, i){
        setTimeout(function(){ decode(el); }, t0 + i * (step || 0));
      });
    }
    at('.enter .t', 330);
    at('.menu .t', 390);
    at('.links a .t', 360, 45);
    at('.index li.on .t', 660);
    at('.index li:not(.on) .t', 720, 55);
    at('.cta .t', 900);
    at('.dock .t', 1000, 60);
    setTimeout(function(){ document.documentElement.classList.remove('anim'); }, 2200);
    setTimeout(function(){ labels.forEach(settle); }, 2600);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else addEventListener('load', boot);

  var rt;
  addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(reserve, 160); });

  // Highlight active nav links based on current path
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.links a').forEach(function(link) {
      if(link.getAttribute('href') === path) {
          link.classList.add('active');
      }
  });

})();
