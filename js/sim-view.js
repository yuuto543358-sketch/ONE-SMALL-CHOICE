/* =========================================================
   ONE SMALL CHOICE — ④ SIMULATION 画面
   エンジンが計算した出来事を、1つずつ時系列で表示し、
   因果関係を線でつないでいく
   ========================================================= */
(function (root) {
  'use strict';
  var OSC = root.OSC;
  var ui = OSC.ui, E = OSC.engine;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var SPEEDS = { slow: { base: 2300, per: 80 }, normal: { base: 1400, per: 50 }, fast: { base: 650, per: 22 } };
  var LANES = [14, 29, 44];

  function svgEl(name, attrs) {
    var n = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  var Sim = {
    init: function (hooks) {
      var self = this;
      this.hooks = hooks;
      this.scroller = ui.$('#sim-scroll');
      this.tl = ui.$('#timeline');
      this.svg = ui.$('#links');
      this.dock = ui.$('#sim-dock');
      this.sheet = ui.$('#sheet');
      this.veil = ui.$('#sheet-veil');
      this.wait = ui.$('#sim-wait');
      this.endSlot = ui.$('#sim-end-slot');

      /* 画面をタップすると次の出来事へ */
      this.scroller.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        if (self.done || self.sheetOpen || !self.active) return;
        clearTimeout(self.timer);
        self.advance();
      });
      this.dock.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.speed) { OSC.store.setSetting('speed', b.dataset.speed); self.renderDock(); }
        if (b.dataset.act === 'skip') self.skip();
        if (b.dataset.act === 'future') self.hooks.onFuture(self.result);
      });
      this.sheet.addEventListener('click', function (e) {
        var b = e.target.closest('.option');
        if (!b || self.answering) return;
        self.choose(b.dataset.opt, b);
      });
      var rt;
      root.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (self.active) self.redraw(); }, 150); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (self.active) self.redraw(); });
    },

    start: function (scn, answers, restore) {
      this.stop();
      this.scn = scn;
      this.answers = answers;
      this.shown = 0;
      this.maxScope = 0;
      this.nodes = {};
      this.order = [];
      this.childCount = {};
      this.done = false;
      this.active = true;
      this.answering = false;
      this.tl.querySelectorAll('.step, .scope-divider').forEach(function (n) { n.remove(); });
      this.svg.innerHTML = '';
      this.gLinks = svgEl('g'); this.gNodes = svgEl('g');
      this.svg.appendChild(this.gLinks); this.svg.appendChild(this.gNodes);
      this.endSlot.innerHTML = '';
      this.closeSheet();
      ui.$('#sim-title').innerHTML = '<b>' + ui.esc(scn.number) + '</b>' + ui.esc(scn.title);
      this.renderMeter();
      this.updateClock(0);
      this.renderDock();
      this.scroller.scrollTop = 0;
      this.result = E.run(scn, answers);
      if (restore) { this.revealAll(); }
      else { this.setWaiting(true); this.schedule(700); }
    },

    stop: function () { clearTimeout(this.timer); this.active = false; },

    schedule: function (ms) {
      var self = this;
      clearTimeout(this.timer);
      this.timer = setTimeout(function () { self.advance(); }, ms);
    },

    delayFor: function (step) {
      var sp = SPEEDS[OSC.store.settings.speed] || SPEEDS.normal;
      var text = step.type === 'event' ? step.event.title + step.event.description : step.option.label;
      return sp.base + text.length * sp.per;
    },

    advance: function () {
      if (!this.active || this.sheetOpen) return;
      if (this.shown < this.result.steps.length) {
        var step = this.result.steps[this.shown++];
        this.renderStep(step, true);
        if (this.shown < this.result.steps.length) this.schedule(this.delayFor(step));
        else this.schedule(Math.min(this.delayFor(step), 2600));
      } else {
        this.reachEnd();
      }
    },

    revealAll: function () {
      clearTimeout(this.timer);
      while (this.shown < this.result.steps.length) this.renderStep(this.result.steps[this.shown++], false);
      this.redraw();
      this.scroller.scrollTop = this.scroller.scrollHeight;
      this.reachEnd();
    },

    skip: function () {
      if (this.done || this.sheetOpen) return;
      this.revealAll();
    },

    reachEnd: function () {
      clearTimeout(this.timer);
      if (this.result.pending) this.openSheet(this.result.pending);
      else this.finish();
    },

    /* ---------- 1つの出来事を表示 ---------- */
    assignLane: function (step) {
      var self = this;
      var ps = step.parents.filter(function (p) { return self.nodes[p]; });
      var lane = 1;
      if (ps.length > 1) {
        lane = Math.round(ps.reduce(function (s, p) { return s + self.nodes[p].lane; }, 0) / ps.length);
      } else if (ps.length === 1) {
        var p = ps[0];
        var k = this.childCount[p] || 0;
        this.childCount[p] = k + 1;
        var base = this.nodes[p].lane;
        var offs = [0, 1, -1, 2, -2][k] || 0;
        lane = base + offs;
        if (lane > 2) lane = base - 1;
        if (lane < 0) lane = base + 1;
        lane = Math.max(0, Math.min(2, lane));
      }
      return lane;
    },

    cardHtml: function (step) {
      var cat = step.category;
      var C = E.CATEGORIES[cat];
      var time = E.formatTime(step.time);
      if (step.type === 'decision') {
        var d = step.decision;
        return '<article class="step you" style="--cat:var(--c-PERSONAL)">' +
          '<div class="step-meta"><span class="step-time">' + time + '</span>' +
          '<span class="step-cat">' + OSC.art.icon('hand') + 'YOUR CHOICE</span>' +
          '<span class="step-scope">あなたの選択</span></div>' +
          (d.context ? '<p class="step-desc">' + ui.esc(d.context) + '</p>' : '') +
          '<h3 class="step-title">「' + ui.esc(step.option.label) + '」</h3></article>';
      }
      var ev = step.event;
      var merge = step.parents.length > 1 ? '<div class="step-merge">' + step.parents.length + 'つの流れが合流</div>' : '';
      return '<article class="step' + (step.scope >= 5 ? ' big' : '') + '" style="--cat:var(--c-' + cat + ')">' +
        '<div class="step-meta"><span class="step-time">' + time + '</span>' +
        '<span class="step-cat">' + OSC.art.icon(cat) + C.en + ' · ' + C.ja + '</span>' +
        '<span class="step-scope">' + E.SCOPES[step.scope] + '</span></div>' +
        '<h3 class="step-title">' + ui.esc(ev.title) + '</h3>' +
        '<p class="step-desc">' + ui.esc(ev.description) + '</p>' + merge + '</article>';
    },

    renderStep: function (step, animate) {
      var lane = this.assignLane(step);
      if (step.type === 'event' && step.scope > this.maxScope) {
        if (this.maxScope > 0 && step.scope >= 2) {
          var div = ui.el('<div class="scope-divider">影響が<b>' + E.SCOPES[step.scope] + '</b>へ広がった</div>');
          this.tl.appendChild(div);
        }
        this.maxScope = step.scope;
        this.renderMeter(animate);
      } else if (this.maxScope === 0) {
        this.maxScope = 1; this.renderMeter(false);
      }
      var card = ui.el(this.cardHtml(step));
      if (!animate) card.classList.add('instant');
      this.tl.appendChild(card);
      this.nodes[step.id] = { lane: lane, card: card, step: step };
      this.order.push(step.id);
      this.updateClock(step.time);
      if (animate) {
        this.svg.setAttribute('height', this.tl.scrollHeight);
        this.drawNode(step, true);
        this.scrollTo(card);
      }
    },

    pos: function (id) {
      var n = this.nodes[id];
      return { x: LANES[n.lane], y: n.card.offsetTop + 24 };
    },

    drawNode: function (step, animate) {
      var self = this;
      var b = this.pos(step.id);
      var color = 'var(--c-' + step.category + ')';
      step.parents.forEach(function (pid) {
        if (!self.nodes[pid]) return;
        var a = self.pos(pid);
        var dy = b.y - a.y;
        var path = svgEl('path', {
          d: 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + (a.y + dy * 0.55) + ' ' + b.x + ' ' + (b.y - dy * 0.45) + ' ' + b.x + ' ' + b.y
        });
        path.style.stroke = color;
        self.gLinks.appendChild(path);
        OSC.anim.drawPath(path, animate);
      });
      var isDec = step.type === 'decision';
      var r = isDec ? 4.5 : (2.2 + step.scope * 0.9);
      if (animate && step.scope >= 3 && !isDec) {
        var halo = svgEl('circle', { cx: b.x, cy: b.y, r: 4, 'class': 'halo go' });
        halo.style.stroke = color;
        this.gNodes.appendChild(halo);
        setTimeout(function () { halo.remove(); }, 1500);
      }
      var c = svgEl('circle', { cx: b.x, cy: b.y, r: r, 'class': isDec ? 'dec' : '' });
      if (!isDec) c.style.fill = color;
      this.gNodes.appendChild(c);
    },

    redraw: function () {
      var self = this;
      this.gLinks.innerHTML = ''; this.gNodes.innerHTML = '';
      this.svg.setAttribute('height', this.tl.scrollHeight);
      this.order.forEach(function (id) { self.drawNode(self.nodes[id].step, false); });
    },

    scrollTo: function (card) {
      var sc = this.scroller;
      var r = card.getBoundingClientRect();
      var sr = sc.getBoundingClientRect();
      var overflow = r.bottom - (sr.bottom - 130);
      var maxUp = r.top - sr.top - 12;
      var delta = Math.min(overflow, maxUp);
      if (delta > 0) sc.scrollTop = sc.scrollTop + delta;
    },

    /* ---------- 上部：時間と影響の広がり ---------- */
    updateClock: function (t) {
      var when = ui.$('#sim-when');
      var label = E.formatTime(t);
      if (when.textContent !== label) {
        when.style.opacity = 0;
        setTimeout(function () { when.textContent = label; when.style.opacity = 1; }, 160);
      }
      ui.$('#sim-year').textContent = ((this.scn.baseYear || 2026) + Math.round(t / 365)) + '年';
    },

    renderMeter: function (pulse) {
      var m = this.maxScope;
      ui.$('#scope-meter').innerHTML = [1, 2, 3, 4, 5].map(function (s) {
        var cls = s < m ? 'on' : (s === m ? 'now' + (pulse ? ' pulse' : '') : '');
        return '<div class="' + cls + '"><i></i><span>' + E.SCOPES[s] + '</span></div>';
      }).join('');
    },

    renderDock: function () {
      if (this.done) {
        this.dock.innerHTML = '<button class="btn block" data-act="future">' + this.result.years + '年後の地球を見る' + OSC.art.icon('arrow') + '</button>';
        return;
      }
      var sp = OSC.store.settings.speed || 'normal';
      var opts = [['slow', '0.5×', 'ゆっくり'], ['normal', '1×', 'ふつう'], ['fast', '2×', 'はやい']];
      this.dock.innerHTML =
        '<div class="speed-group" role="group" aria-label="表示の速さ">' + opts.map(function (o) {
          return '<button data-speed="' + o[0] + '" aria-pressed="' + (sp === o[0]) + '" aria-label="' + o[2] + '">' + o[1] + '</button>';
        }).join('') + '</div>' +
        '<span class="hint">タップで次へ</span>' +
        '<button class="skip-btn" data-act="skip">SKIP' + OSC.art.icon('skip') + '</button>';
    },

    setWaiting: function (on) { this.wait.hidden = !on; },

    /* ---------- 途中の「あなたの選択」 ---------- */
    openSheet: function (d) {
      var n = this.result.steps.filter(function (s) { return s.type === 'decision'; }).length + 1;
      this.setWaiting(false);
      ui.$('#sheet-body').innerHTML =
        '<div class="grab"></div>' +
        '<div class="eyebrow">YOUR CHOICE <span class="num">· ' + n + '</span> ／ ' + E.formatTime(d.time) + '</div>' +
        (d.context ? '<p class="ctx">' + ui.esc(d.context) + '</p>' : '') +
        '<h2 id="sheet-title" tabindex="-1">' + ui.esc(d.prompt) + '</h2>' +
        '<div class="options">' + d.options.map(function (o, i) {
          return '<button class="option" data-opt="' + o.id + '" style="--i:' + i + '">' +
            '<span class="key">' + o.id + '</span><span class="lbl"><b>' + ui.esc(o.label) + '</b>' +
            (o.note ? '<small>' + ui.esc(o.note) + '</small>' : '') + '</span></button>';
        }).join('') + '</div>';
      this.pendingDecision = d;
      this.sheetOpen = true;
      this.answering = false;
      var sheet = this.sheet, veil = this.veil;
      requestAnimationFrame(function () { sheet.classList.add('open'); veil.classList.add('open'); });
      this.updateClock(d.time);
      /* 選択肢に偏りが出ないよう、フォーカスは問いかけの見出しに置く */
      setTimeout(function () { var t = sheet.querySelector('#sheet-title'); if (t) t.focus({ preventScroll: true }); }, 500);
    },

    closeSheet: function () {
      this.sheet.classList.remove('open');
      this.veil.classList.remove('open');
      this.sheetOpen = false;
    },

    choose: function (optId, btn) {
      var self = this;
      var d = this.pendingDecision;
      this.answering = true;
      btn.classList.add('is-picked');
      btn.parentNode.classList.add('is-done');
      this.answers[d.id] = optId;
      this.hooks.onAnswer(this.answers);
      setTimeout(function () {
        self.closeSheet();
        self.result = E.run(self.scn, self.answers);
        self.setWaiting(true);
        self.schedule(450);
      }, 520);
    },

    /* ---------- おわり ---------- */
    finish: function () {
      this.done = true;
      this.setWaiting(false);
      this.endSlot.innerHTML =
        '<div class="sim-end"><div class="mini-globe">' + OSC.art.globe({ cls: 'fast' }) + '</div>' +
        '<p>' + this.result.years + '年後。小さな選択から始まった流れは、地球全体に届いた。</p></div>';
      this.renderDock();
      var sc = this.scroller;
      setTimeout(function () { sc.scrollTop = sc.scrollHeight; }, 60);
      this.hooks.onDone && this.hooks.onDone(this.result);
    }
  };

  OSC.Sim = Sim;
})(typeof window !== 'undefined' ? window : globalThis);
