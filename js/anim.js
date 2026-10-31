/* =========================================================
   ONE SMALL CHOICE — アニメーションと画面部品の小さな道具
   ========================================================= */
(function (root) {
  'use strict';
  var OSC = (root.OSC = root.OSC || {});
  var reduced = false;
  try { reduced = root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* noop */ }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /* 線が伸びてつながる */
  function drawPath(path, animate) {
    var len = 0;
    try { len = path.getTotalLength(); } catch (e) { len = 0; }
    if (!len || !animate || reduced) { path.style.strokeDasharray = 'none'; return; }
    path.style.strokeDasharray = len + ' ' + len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.classList.add('draw');
    requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
    setTimeout(function () { path.style.strokeDasharray = 'none'; path.classList.remove('draw'); }, 1100);
  }

  /* メーター（棒）を伸ばす */
  function fillMeters(ctx, delay) {
    setTimeout(function () {
      $$('.meter i[data-w]', ctx).forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; });
    }, delay || 200);
  }

  /* 数字が増えていく */
  function countUp(node, to, ms) {
    if (reduced) { node.textContent = to; return; }
    var from = parseInt(node.textContent, 10) || 0;
    var t0 = performance.now();
    function tick(t) {
      var p = Math.min(1, (t - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  OSC.ui = { esc: esc, $: $, $$: $$, el: el, toast: toast };
  OSC.anim = { reduced: reduced, drawPath: drawPath, fillMeters: fillMeters, countUp: countUp };
})(typeof window !== 'undefined' ? window : globalThis);
