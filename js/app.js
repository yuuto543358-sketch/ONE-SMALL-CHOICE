/* =========================================================
   ONE SMALL CHOICE — 画面管理と各画面の描画
   HOME → SCENARIO → CHOICE → SIMULATION → FUTURE → COMPARISON
   ========================================================= */
(function (root) {
  'use strict';
  var OSC = root.OSC;
  var ui = OSC.ui, E = OSC.engine, store = OSC.store, art = OSC.art, esc = ui.esc;

  var S = { scn: null, answers: {}, result: null, alts: null, altIndex: 0, another: false, lastFirst: null, recorded: false, from: 'home' };
  var STEP_SCREENS = { scenario: 1, choice: 1, sim: 1, future: 1, compare: 1 };
  var ASPECTS = [
    ['society', '社会', 'SOCIETY'], ['economy', '経済', 'ECONOMY'], ['environment', '環境', 'ENVIRONMENT'],
    ['life', '人々の生活', 'LIFE'], ['planet', '地球の状態', 'PLANET']
  ];
  var current = null;

  /* ---------- 画面の切り替え（フェード） ---------- */
  function show(name) {
    var next = ui.$('#screen-' + name);
    if (name !== 'sim') OSC.Sim.stop();
    if (current && current !== next) current.classList.remove('is-active');
    next.scrollTop = 0;
    var tb = next.querySelector('.topbar');
    if (tb) tb.classList.remove('is-scrolled');
    void next.offsetWidth;
    next.classList.add('is-active');
    current = next;
    if (S.scn && STEP_SCREENS[name]) {
      store.setSession({ scenarioId: S.scn.id, answers: S.answers, screen: name, recorded: S.recorded, another: S.another, lastFirst: S.lastFirst });
    }
  }

  function setTitles() {
    var t = S.scn ? '<b>' + esc(S.scn.number) + '</b>' + esc(S.scn.title) : '';
    ui.$$('[data-title]').forEach(function (n) { n.innerHTML = t; });
  }

  function totalFutures(scn) { return scn.futures.filter(function (f) { return f.id !== 'default'; }).length; }
  function allFutures() { return OSC.scenarios.reduce(function (n, s) { return n + totalFutures(s); }, 0); }

  /* =========================================================
     ① HOME
     ========================================================= */
  function renderHome() {
    var g = ui.$('#home-globe');
    if (!g.firstChild) g.innerHTML = art.globe({ orbit: true });
    var found = store.totalDiscovered();
    ui.$('#home-record').textContent = found ? '発見した未来　' + found + ' / ' + allFutures() : OSC.scenarios.length + ' SCENARIOS · ' + allFutures() + ' FUTURES';
    var ses = store.session;
    var c = ui.$('#btn-continue');
    var scn = ses && OSC.getScenario(ses.scenarioId);
    if (scn && STEP_SCREENS[ses.screen] && ses.screen !== 'scenario') {
      c.hidden = false;
      c.textContent = 'CONTINUE · ' + scn.number;
    } else c.hidden = true;
  }

  function nextUnplayed() {
    for (var i = 0; i < OSC.scenarios.length; i++) if (!store.playedCount(OSC.scenarios[i].id)) return OSC.scenarios[i];
    return OSC.scenarios[0];
  }

  /* =========================================================
     SCENARIO COLLECTION
     ========================================================= */
  function renderCollection() {
    var found = store.totalDiscovered(), total = allFutures();
    var cards = OSC.scenarios.map(function (s) {
      var got = store.discovered(s.id);
      var dots = s.futures.filter(function (f) { return f.id !== 'default'; }).map(function (f) {
        return '<i class="' + (got.indexOf(f.id) >= 0 ? 'on' : '') + '"></i>';
      }).join('');
      var played = store.playedCount(s.id);
      return '<button class="scn-card" data-act="open-scenario" data-id="' + s.id + '">' +
        '<span class="scn-thumb">' + art.illustration(s.illustration, 'ill-static') + '</span>' +
        '<span class="scn-body"><span class="num">' + esc(s.number) + '</span><h3>' + esc(s.title) + '</h3><span class="theme">' + esc(s.theme) + '</span></span>' +
        (played ? '<span class="scn-dots" aria-label="発見した未来 ' + got.length + '/' + totalFutures(s) + '">' + dots + '</span>' : '<span class="scn-new">NEW</span>') +
        '</button>';
    }).join('');
    var hist = store.history().slice(0, 6).map(function (h) {
      var s = OSC.getScenario(h.scenarioId);
      if (!s) return '';
      return '<li><span class="y">' + h.year + '</span><span class="t"><b>' + esc(s.number + ' ' + s.title) + '</b>　「' + esc(h.first) + '」→ ' + esc(h.futureTitle) + '</span></li>';
    }).join('');
    ui.$('#collection-body').innerHTML =
      '<div class="page-head"><div class="eyebrow">Collection</div><h1>SCENARIOS</h1>' +
      '<p>8つの日常のひとコマ。選び方しだいで、たどり着く未来が変わります。</p>' +
      '<div class="found-bar"><span>発見した未来</span><span class="track"><i style="width:' + (total ? found / total * 100 : 0) + '%"></i></span><span>' + found + ' / ' + total + '</span></div></div>' +
      '<div class="scn-list">' + cards + '</div>' +
      (hist ? '<div class="history"><h2>RECENT FUTURES</h2><ol>' + hist + '</ol></div>' : '');
  }

  /* =========================================================
     ② SCENARIO
     ========================================================= */
  function openScenario(id, from) {
    S.scn = OSC.getScenario(id);
    S.answers = {}; S.result = null; S.alts = null; S.another = false; S.lastFirst = null; S.recorded = false;
    if (from) S.from = from;
    renderScenario();
    show('scenario');
  }

  function renderScenario() {
    var s = S.scn;
    setTitles();
    ui.$('#scenario-body').innerHTML =
      '<div class="scn-intro">' +
      '<div class="eyebrow">Scenario <span class="num">' + esc(s.number) + '</span></div>' +
      '<h1>' + esc(s.title) + '</h1>' +
      '<div class="chips">' + s.theme.split('・').map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="illus">' + art.illustration(s.illustration) + '</div>' +
      '<div class="intro-lines">' + s.intro.map(function (l, i) { return '<span style="--i:' + i + '">' + esc(l) + '</span>'; }).join('') + '</div>' +
      '<p class="setting">' + esc(s.setting) + '</p>' +
      '<button class="btn block" data-act="to-choice">NEXT' + art.icon('arrow') + '</button>' +
      '</div>';
  }

  /* =========================================================
     ③ CHOICE
     ========================================================= */
  function renderChoice() {
    var s = S.scn, d = s.decisions[0];
    var tried = store.triedFirst(s.id);
    setTitles();
    ui.$('#choice-body').innerHTML =
      '<div class="choice-head">' +
      '<div class="eyebrow">Choice <span class="num">· 1</span></div>' +
      '<p class="ctx">' + esc(s.intro.join('')) + '</p>' +
      '<h1>' + esc(d.prompt) + '</h1>' +
      (S.another ? '<p class="choice-note">最初の選択を変えると、その先の因果はすべて計算し直されます。</p>' : '') +
      '</div>' +
      '<div class="options" id="first-options">' + d.options.map(function (o, i) {
        var tag = S.another && S.lastFirst === o.id ? '前回の選択' : (tried[o.id] ? '体験済み' : '');
        return '<button class="option" data-act="pick-first" data-opt="' + o.id + '" style="--i:' + i + '">' +
          '<span class="key">' + o.id + '</span><span class="lbl"><b>' + esc(o.label) + '</b>' +
          (o.note ? '<small>' + esc(o.note) + '</small>' : '') + '</span>' +
          (tag ? '<span class="seen">' + tag + '</span>' : '') + '</button>';
      }).join('') + '</div>';
  }

  function pickFirst(btn) {
    var box = ui.$('#first-options');
    if (box.classList.contains('is-done')) return;
    btn.classList.add('is-picked');
    box.classList.add('is-done');
    S.answers = { d1: btn.dataset.opt };
    S.result = null; S.alts = null; S.recorded = false;
    setTimeout(function () { startSim(false); }, 700);
  }

  /* =========================================================
     ④ SIMULATION
     ========================================================= */
  function startSim(restore) {
    setTitles();
    show('sim');
    OSC.Sim.start(S.scn, S.answers, restore);
  }

  /* =========================================================
     ⑤ FUTURE
     ========================================================= */
  function openFuture() {
    var r = S.result || E.run(S.scn, S.answers);
    if (r.pending) { startSim(true); return; }
    S.result = r;
    S.alts = null;
    var isNew = false;
    if (!S.recorded) { isNew = store.recordFuture(S.scn, r); S.recorded = true; }
    renderFuture(r);
    show('future');
    var body = ui.$('#future-body');
    setTimeout(function () { var g = body.querySelector('.globe'); if (g) g.classList.add('spreading'); }, 450);
    OSC.anim.fillMeters(body, 900);
    if (isNew) {
      var n = store.discovered(S.scn.id).length;
      setTimeout(function () { ui.toast('新しい未来を発見しました　' + n + ' / ' + totalFutures(S.scn)); }, 1600);
    }
  }

  function chainItemText(step) {
    if (step.type === 'decision') return 'あなたは「' + step.option.label + '」を選んだ';
    return step.event.title;
  }

  function renderFuture(r) {
    var f = r.future, m = r.metrics, s = S.scn;
    var first = r.steps[0] && r.steps[0].option;
    var body = ui.$('#future-body');
    body.className = 'wrap tone-' + (f.tone || 'blue');
    setTitles();
    var aspects = ASPECTS.slice(0, 4).map(function (a) {
      return '<div class="aspect"><div class="h"><b>' + a[1] + '</b><span>' + m[a[0]] + '</span></div>' +
        '<div class="meter"><i data-w="' + m[a[0]] + '"></i></div>' +
        '<p>' + esc(f[a[0]]) + '</p></div>';
    }).join('');
    var recap = r.chain.map(function (st) {
      var cls = st.type === 'decision' ? ' class="you"' : ' style="--cat:var(--c-' + st.category + ')"';
      return '<li' + cls + '><span class="t">' + E.formatTime(st.time) + '</span><span class="x">' + esc(chainItemText(st)) + '</span></li>';
    }).join('');
    body.innerHTML =
      '<div class="future-hero">' +
        '<div class="eyebrow">Future <span class="num">· ' + r.years + '年後</span></div>' +
        '<div class="future-globe">' + art.globe({ spread: true }) + '</div>' +
        '<div class="year-big">' + r.year + '</div>' +
        '<h1>' + esc(f.title) + '</h1>' +
        '<p class="summary">' + esc(f.summary) + '</p>' +
      '</div>' +
      '<div class="span-line"><div class="end"><b>' + (s.baseYear || 2026) + '</b><span>' + esc(first ? first.label : '') + '</span></div>' +
        '<div class="bar"></div><div class="end r"><b>' + r.year + '</b><span>' + esc(f.title) + '</span></div></div>' +
      '<p class="twist">' + esc(f.twist) + '</p>' +
      '<section class="sec"><div class="sec-h"><h2>World Events</h2><span>世界で起こったこと</span></div><ul class="impacts">' +
        f.impacts.map(function (im) {
          return '<li style="--cat:var(--c-' + im.cat + ')"><span class="k">' + E.CATEGORIES[im.cat].ja + '</span><span>' + esc(im.text) + '</span></li>';
        }).join('') + '</ul></section>' +
      '<section class="sec"><div class="sec-h"><h2>Impact</h2><span>社会・経済・環境・生活</span></div>' +
        '<div class="aspects">' + aspects + '</div>' +
        '<p class="note">※ 数値はゲーム内の架空のシミュレーション値です（50 = 物語が始まった' + (s.baseYear || 2026) + '年の水準）。</p></section>' +
      '<section class="sec"><div class="sec-h"><h2>Causal Chain</h2><span>因果の振り返り</span></div><ol class="recap">' + recap + '</ol></section>' +
      '<div class="future-cta"><button class="btn block" data-act="compare">選ばなかった未来と比べる' + art.icon('arrow') + '</button></div>';
  }

  /* =========================================================
     ⑥ COMPARISON
     ========================================================= */
  function openCompare() {
    if (!S.result) S.result = E.run(S.scn, S.answers);
    if (S.result.pending) { startSim(true); return; }
    if (!S.alts) { S.alts = E.alternatives(S.scn, S.answers); S.altIndex = 0; }
    renderCompare();
    show('compare');
  }

  function renderCompare() {
    var first = S.result.steps[0].option;
    setTitles();
    ui.$('#compare-body').innerHTML =
      '<div class="cmp-head"><div class="eyebrow">Comparison</div><h1>選ばなかった未来</h1>' +
      '<p class="muted">最初の選択だけを変えて、因果関係をもう一度計算しました。あなたは「' + esc(first.label) + '」を選びました。</p></div>' +
      '<div class="cmp-tabs" role="tablist">' + S.alts.map(function (a, i) {
        return '<button class="cmp-tab" role="tab" data-act="alt" data-i="' + i + '" aria-selected="' + (i === S.altIndex) + '">もし「' + esc(a.firstOption.label) + '」なら</button>';
      }).join('') + '</div>' +
      '<div id="cmp-slot"></div>' +
      '<div class="cmp-actions">' +
        '<button class="btn block" data-act="another">ANOTHER FUTURE</button>' +
        '<div class="row"><button class="btn ghost" data-act="next-scenario">NEXT SCENARIO</button><button class="btn ghost" data-act="home">HOME</button></div>' +
      '</div>';
    renderCompareGrid();
  }

  function renderCompareGrid() {
    var mine = S.result, alt = S.alts[S.altIndex];
    function head(r, who, label) {
      return '<div class="cmp-col-h tone-' + (r.future.tone || 'blue') + '"><span class="who">' + who + '</span>' +
        '<div class="mini">' + art.globe({ spread: true, cls: 'spreading' }) + '</div>' +
        '<span class="pick">「' + esc(label) + '」</span><h3>' + esc(r.future.title) + '</h3><span class="yr">' + r.year + '年</span></div>';
    }
    var rows = ASPECTS.map(function (a) {
      var k = a[0], v1 = mine.metrics[k], v2 = alt.metrics[k];
      var diff = v2 > v1 + 2 ? ' diff-up' : (v2 < v1 - 2 ? ' diff-down' : '');
      function cell(r, v, extra) {
        return '<div class="cmp-cell tone-' + (r.future.tone || 'blue') + extra + '"><div class="v"><div class="meter"><i data-w="' + v + '"></i></div><span>' + v + '</span></div>' +
          '<p>' + esc(r.future[k]) + '</p></div>';
      }
      return '<div class="cmp-row-label"><b>' + a[1] + '</b>' + a[2] + '</div>' + cell(mine, v1, '') + cell(alt, v2, diff);
    }).join('');
    var path = alt.chain.map(function (st) {
      return '<li>' + esc(st.type === 'decision' ? '「' + st.option.label + '」' : st.event.title) + '</li>';
    }).join('');
    var slot = ui.$('#cmp-slot');
    slot.innerHTML =
      '<div class="cmp-grid">' + head(mine, 'YOUR FUTURE', mine.steps[0].option.label) + head(alt, 'ANOTHER FUTURE', alt.firstOption.label) + rows + '</div>' +
      '<div class="cmp-path"><div class="sec-h"><h2>Another Chain</h2><span>もうひとつの因果</span></div><ol>' + path + '</ol>' +
      '<p class="note">※ 数値はゲーム内の架空のシミュレーション値です。2回目以降の選択は、あなたと同じ選択（できない場合はいちばん自然な行動）で計算しています。</p></div>';
    OSC.anim.fillMeters(slot, 250);
  }

  /* =========================================================
     HOW TO PLAY
     ========================================================= */
  function openHowto() {
    var steps = [
      ['eye', '日常の出来事に出会う', 'コンビニ、駅、公園。どこにでもある、ありふれた場面です。'],
      ['hand', '自分の行動を選ぶ', '選べるのは「あなたの行動」だけ。正解も不正解もありません。'],
      ['branch', '世界が自動で動きだす', '出来事が線でつながり、周りの人、地域、国、世界へと広がっていきます。途中で何度か、また選択の場面が来ます。'],
      ['compare', '選ばなかった未来と比べる', '最初の選択を変えると、因果はすべて計算し直されます。']
    ];
    ui.$('#howto-card').innerHTML =
      '<div class="head"><h2 id="howto-title">HOW TO PLAY</h2><button class="icon-btn" data-act="close-howto" aria-label="閉じる">' + art.icon('close') + '</button></div>' +
      '<ol class="howto-steps">' + steps.map(function (s) {
        return '<li><span class="ic">' + art.icon(s[0]) + '</span><span><b>' + s[1] + '</b><span>' + s[2] + '</span></span></li>';
      }).join('') + '</ol>' +
      '<div class="howto-tips"><div>シミュレーション中は、画面をタップすると次の出来事へ進みます。</div><div>下のボタンで表示の速さ（0.5× / 1× / 2×）を変えたり、SKIPで一気に進めたりできます。</div><div>1回のプレイは約5分。記録はこの端末のブラウザに保存されます。</div></div>' +
      '<div id="reset-zone"><button class="link-danger" data-act="reset-ask">記録をすべて消す</button></div>' +
      '<button class="btn block" data-act="close-howto">OK</button>';
    var m = ui.$('#howto');
    m.classList.add('open');
    store.markHowto();
    setTimeout(function () { var b = m.querySelector('.icon-btn'); if (b) b.focus({ preventScroll: true }); }, 300);
  }
  function closeHowto() { ui.$('#howto').classList.remove('open'); }

  /* =========================================================
     操作（ボタン）の受付
     ========================================================= */
  var ACTIONS = {
    start: function () { openScenario(nextUnplayed().id, 'home'); },
    'continue': function () { restore(store.session); },
    collection: function () { renderCollection(); show('collection'); },
    howto: openHowto,
    'close-howto': closeHowto,
    home: function () { renderHome(); show('home'); },
    'open-scenario': function (b) { openScenario(b.dataset.id, 'collection'); },
    'back-scenario': function () { if (S.from === 'collection') ACTIONS.collection(); else ACTIONS.home(); },
    'to-choice': function () { renderChoice(); show('choice'); },
    'back-choice': function () { renderScenario(); show('scenario'); },
    'pick-first': pickFirst,
    compare: openCompare,
    'back-compare': function () { renderFuture(S.result); show('future'); OSC.anim.fillMeters(ui.$('#future-body'), 400); var g = ui.$('#future-body .globe'); if (g) g.classList.add('spreading'); },
    alt: function (b) {
      S.altIndex = +b.dataset.i;
      ui.$$('.cmp-tab').forEach(function (t) { t.setAttribute('aria-selected', String(t === b)); });
      renderCompareGrid();
    },
    another: function () {
      S.lastFirst = S.answers.d1;
      S.another = true;
      S.answers = {}; S.result = null; S.alts = null; S.recorded = false;
      renderChoice();
      show('choice');
    },
    'next-scenario': function () {
      var i = OSC.scenarios.indexOf(S.scn);
      openScenario(OSC.scenarios[(i + 1) % OSC.scenarios.length].id, S.from);
    },
    'reset-ask': function () {
      ui.$('#reset-zone').innerHTML = '<div class="confirm-row">発見した未来と履歴を消しますか？<button data-act="reset-yes">消す</button><button data-act="reset-no">やめる</button></div>';
    },
    'reset-yes': function () { store.reset(); closeHowto(); renderHome(); show('home'); ui.toast('記録を消しました'); },
    'reset-no': function () { ui.$('#reset-zone').innerHTML = '<button class="link-danger" data-act="reset-ask">記録をすべて消す</button>'; }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) {
      if (e.target.id === 'howto') closeHowto();
      return;
    }
    var fn = ACTIONS[b.dataset.act];
    if (fn) fn(b);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeHowto();
  });

  /* ---------- 途中から再開 ---------- */
  function restore(ses) {
    var scn = ses && OSC.getScenario(ses.scenarioId);
    if (!scn || !STEP_SCREENS[ses.screen]) { renderHome(); show('home'); return; }
    S.scn = scn;
    S.answers = ses.answers || {};
    S.recorded = !!ses.recorded;
    S.another = !!ses.another;
    S.lastFirst = ses.lastFirst || null;
    S.result = null; S.alts = null;
    if (ses.screen === 'scenario') { renderScenario(); show('scenario'); return; }
    if (ses.screen === 'choice' || !S.answers.d1) { renderChoice(); show('choice'); return; }
    var r = E.run(scn, S.answers);
    if (r.pending || ses.screen === 'sim') { startSim(true); return; }
    S.result = r;
    if (ses.screen === 'compare') { S.recorded = true; openCompare(); return; }
    openFuture();
  }

  /* ---------- 起動 ---------- */
  function boot() {
    ui.$$('.icon-btn[data-act]').forEach(function (b) {
      if (!b.innerHTML.trim()) b.innerHTML = art.icon(b.dataset.act === 'home' ? 'home' : 'back');
    });
    ui.$$('.progress[data-progress]').forEach(function (p) {
      var n = +p.dataset.progress;
      var labels = ['導入', '選択', '連鎖', '未来', '比較'];
      p.setAttribute('aria-label', '進行状況：' + labels[n] + '（' + (n + 1) + '/5）');
      p.innerHTML = labels.map(function (l, i) { return '<i class="' + (i < n ? 'on' : i === n ? 'now' : '') + '"></i>'; }).join('');
    });
    ui.$$('.screen').forEach(function (sc) {
      var tb = sc.querySelector('.topbar');
      if (!tb) return;
      sc.addEventListener('scroll', function () { tb.classList.toggle('is-scrolled', sc.scrollTop > 4); }, { passive: true });
    });
    OSC.Sim.init({
      onAnswer: function (answers) { S.answers = answers; store.setSession({ scenarioId: S.scn.id, answers: answers, screen: 'sim', recorded: false, another: S.another, lastFirst: S.lastFirst }); },
      onFuture: function (r) { S.result = r; openFuture(); },
      onDone: function (r) { S.result = r; }
    });
    renderHome();
    var ses = store.session;
    if (ses && OSC.getScenario(ses.scenarioId) && STEP_SCREENS[ses.screen]) restore(ses);
    else show('home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
