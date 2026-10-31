/* =========================================================
   ONE SMALL CHOICE — 因果関係シミュレーションエンジン
   ---------------------------------------------------------
   ・シナリオデータ（scenarios/*.js）を登録・検証する
   ・プレイヤーの選択（answers）から、時系列のイベント列を計算する
   ・ランダム要素はなし。同じ選択なら必ず同じ未来になる
   ========================================================= */
(function (root) {
  'use strict';

  var OSC = (root.OSC = root.OSC || {});

  /* ---------- 定数 ---------- */
  var CATEGORIES = {
    PERSONAL:    { ja: '個人', en: 'PERSONAL' },
    SOCIAL:      { ja: '社会', en: 'SOCIAL' },
    ECONOMY:     { ja: '経済', en: 'ECONOMY' },
    ENVIRONMENT: { ja: '環境', en: 'ENVIRONMENT' },
    TECHNOLOGY:  { ja: '技術', en: 'TECHNOLOGY' },
    CULTURE:     { ja: '文化', en: 'CULTURE' },
    GLOBAL:      { ja: '地球', en: 'GLOBAL' }
  };
  var SCOPES = ['', '個人', '周囲', '地域', '国', '世界'];
  var DEFAULT_SCOPE = { PERSONAL: 1, SOCIAL: 3, ECONOMY: 3, ENVIRONMENT: 3, TECHNOLOGY: 3, CULTURE: 3, GLOBAL: 5 };
  /* すべてのシナリオ共通の「世界の状態」。未来の比較に使う（架空の値） */
  var BASE_VARS = { society: 50, economy: 50, environment: 50, life: 50 };
  var RESERVED = { flags: 1, unflags: 1 };

  /* =========================================================
     条件式の小さな言語
     例: "reuse>=3 && #curious && !@b5 && d2:AB"
       name>=3   … 変数の比較（>= <= > < == !=）
       name      … 変数が 0 より大きい
       #flag     … フラグが立っている
       @eventId  … そのイベントがすでに起きた
       d1:B      … 選択 d1 で B を選んだ（d1:AB なら A か B）
       ! && || ( )
     ========================================================= */
  function tokenize(src) {
    var re = /\s*(>=|<=|==|!=|&&|\|\||[()!<>]|[#@]?[A-Za-z_][\w-]*(?::[A-Za-z]+)?|-?\d+(?:\.\d+)?)/y;
    var out = [];
    var s = String(src).trim();
    re.lastIndex = 0;
    while (re.lastIndex < s.length) {
      var m = re.exec(s);
      if (!m) throw new Error('条件式を読めません: "' + src + '" (位置 ' + re.lastIndex + ')');
      out.push(m[1]);
      if (/^\s*$/.test(s.slice(re.lastIndex))) break;
    }
    return out;
  }

  function compileCondition(src) {
    if (typeof src === 'function') return src;
    if (src == null || src === '' || src === true) return function () { return true; };
    var toks = tokenize(src);
    var i = 0;
    function peek() { return toks[i]; }
    function next() { return toks[i++]; }
    function expect(t) { if (next() !== t) throw new Error('条件式の書き方が違います: "' + src + '"'); }

    function parseOr() {
      var left = parseAnd();
      while (peek() === '||') { next(); var r = parseAnd(); left = (function (a, b) { return function (st) { return a(st) || b(st); }; })(left, r); }
      return left;
    }
    function parseAnd() {
      var left = parseUnary();
      while (peek() === '&&') { next(); var r = parseUnary(); left = (function (a, b) { return function (st) { return a(st) && b(st); }; })(left, r); }
      return left;
    }
    function parseUnary() {
      if (peek() === '!') { next(); var inner = parseUnary(); return function (st) { return !inner(st); }; }
      if (peek() === '(') { next(); var e = parseOr(); expect(')'); return e; }
      return parseAtom();
    }
    function parseAtom() {
      var t = next();
      if (t == null) throw new Error('条件式が途中で終わっています: "' + src + '"');
      if (t[0] === '#') { var f = t.slice(1); return function (st) { return st.flags.has(f); }; }
      if (t[0] === '@') { var ev = t.slice(1); return function (st) { return st.fired.has(ev); }; }
      if (t.indexOf(':') > 0) {
        var parts = t.split(':'); var dId = parts[0]; var opts = parts[1].split('');
        return function (st) { return opts.indexOf(st.answers[dId]) >= 0; };
      }
      var name = t;
      var op = peek();
      if (op === '>=' || op === '<=' || op === '>' || op === '<' || op === '==' || op === '!=') {
        next();
        var num = parseFloat(next());
        if (isNaN(num)) throw new Error('条件式の数値が読めません: "' + src + '"');
        return function (st) {
          var v = st.vars[name] || 0;
          switch (op) {
            case '>=': return v >= num; case '<=': return v <= num;
            case '>': return v > num; case '<': return v < num;
            case '==': return v === num; default: return v !== num;
          }
        };
      }
      return function (st) { return (st.vars[name] || 0) > 0; };
    }
    var fn = parseOr();
    if (i < toks.length) throw new Error('条件式の余分な記号: "' + src + '"');
    fn.source = src;
    return fn;
  }

  /* ---------- 効果の適用 ---------- */
  function applyEffects(fx, st) {
    if (!fx) return;
    Object.keys(fx).forEach(function (k) {
      if (RESERVED[k]) return;
      st.vars[k] = (st.vars[k] || 0) + fx[k];
    });
    (fx.flags || []).forEach(function (f) { st.flags.add(f); });
    (fx.unflags || []).forEach(function (f) { st.flags.delete(f); });
  }

  /* ---------- 時間の表示 ---------- */
  function formatTime(days) {
    if (days <= 0) return 'その場で';
    if (days < 1) return '当日';
    if (days < 30) return Math.round(days) + '日後';
    if (days < 365) return Math.max(1, Math.round(days / 30)) + 'か月後';
    var y = days / 365;
    if (y < 10 && Math.abs(y - Math.round(y)) > 0.3) return Math.floor(y) + '年半後';
    return Math.round(y) + '年後';
  }

  /* =========================================================
     シナリオの登録
     ========================================================= */
  OSC.scenarios = OSC.scenarios || [];

  function prepare(scn) {
    scn.vars = scn.vars || {};
    scn._index = {};
    scn.events.forEach(function (ev, i) {
      ev._order = i;
      ev.scope = ev.scope || DEFAULT_SCOPE[ev.impactCategory] || 3;
      ev.nextEvents = ev.nextEvents || [];
      ev._cond = compileCondition(ev.conditions);
      scn._index[ev.eventId] = ev;
    });
    scn.decisions.forEach(function (d) {
      d._cond = compileCondition(d.conditions);
      d.options.forEach(function (o) { o.next = o.next || []; });
    });
    scn.futures.forEach(function (f) { f._cond = compileCondition(f.conditions); });
    return scn;
  }

  OSC.registerScenario = function (scn) {
    try {
      prepare(scn);
      var problems = validate(scn);
      if (problems.length && root.console) root.console.warn('[ONE SMALL CHOICE] ' + scn.id + ': ' + problems.join(' / '));
      OSC.scenarios.push(scn);
      OSC.scenarios.sort(function (a, b) { return a.number < b.number ? -1 : 1; });
    } catch (e) {
      if (root.console) root.console.warn('[ONE SMALL CHOICE] シナリオを登録できません: ' + (scn && scn.id), e);
    }
  };

  OSC.getScenario = function (id) {
    for (var i = 0; i < OSC.scenarios.length; i++) if (OSC.scenarios[i].id === id) return OSC.scenarios[i];
    return null;
  };

  /* ---------- データの検証（テストでも使う） ---------- */
  function validate(scn) {
    var p = [];
    var idx = scn._index;
    ['id', 'number', 'title', 'decisions', 'events', 'futures'].forEach(function (k) { if (!scn[k]) p.push('項目がありません: ' + k); });
    scn.events.forEach(function (ev) {
      if (!CATEGORIES[ev.impactCategory]) p.push(ev.eventId + ': impactCategory が不正');
      ev.nextEvents.forEach(function (n) {
        if (!idx[n]) p.push(ev.eventId + ' → ' + n + ' が存在しない');
        else if (idx[n].time < ev.time) p.push(ev.eventId + ' → ' + n + ' が過去に戻っている');
      });
    });
    scn.decisions.forEach(function (d) {
      d.options.forEach(function (o) {
        o.next.forEach(function (n) {
          if (!idx[n]) p.push(d.id + '/' + o.id + ' → ' + n + ' が存在しない');
          else if (idx[n].time < d.time) p.push(d.id + '/' + o.id + ' → ' + n + ' が過去に戻っている');
        });
      });
    });
    if (!scn.futures.length || scn.futures[scn.futures.length - 1].conditions) p.push('最後の未来は条件なし（予備）にしてください');
    return p;
  }

  /* =========================================================
     シミュレーション本体
     run(scenario, answers, { auto })
       answers: { d1: 'B', d2b: 'A', ... }
       auto:    未回答の選択を自動で決める（比較用の未来計算）
     戻り値:
       steps    … 起きた出来事と選択（時系列）
       pending  … まだ答えていない選択（あれば）
       future   … 最終的な未来（pending が無いとき）
     ========================================================= */
  function run(scn, answers, opts) {
    answers = answers || {};
    opts = opts || {};
    var st = {
      vars: Object.assign({}, BASE_VARS, scn.vars),
      flags: new Set(),
      fired: new Set(),
      answers: {}
    };
    var steps = [];
    var stepById = {};
    var pool = new Map();
    var rejected = new Set();
    var resolved = new Set();
    var decisions = scn.decisions.slice().sort(function (a, b) { return a.time - b.time; });
    var pending = null;
    var guard = 0;

    function enqueue(ids, parentId) {
      ids.forEach(function (id) {
        var ev = scn._index[id];
        if (!ev || st.fired.has(id) || rejected.has(id)) return;
        var c = pool.get(id);
        if (c) { if (c.parents.indexOf(parentId) < 0) c.parents.push(parentId); }
        else pool.set(id, { ev: ev, parents: [parentId] });
      });
    }
    function nextCandidate() {
      var best = null;
      pool.forEach(function (c) {
        if (!best || c.ev.time < best.ev.time || (c.ev.time === best.ev.time && c.ev._order < best.ev._order)) best = c;
      });
      return best;
    }
    function push(step) { steps.push(step); stepById[step.id] = step; }

    while (guard++ < 2000) {
      var cand = nextCandidate();
      var candTime = cand ? cand.ev.time : Infinity;

      /* 1) この時点までに来る「あなたの選択」 */
      var due = null;
      for (var k = 0; k < decisions.length; k++) {
        var d = decisions[k];
        if (resolved.has(d.id)) continue;
        if (d.time > candTime) break;
        if (!d._cond(st)) { resolved.add(d.id); continue; }
        due = d; break;
      }
      if (due) {
        var opt = null;
        for (var j = 0; j < due.options.length; j++) if (due.options[j].id === answers[due.id]) opt = due.options[j];
        if (!opt && opts.auto) {
          opt = due.options.filter(function (o) { return o['default']; })[0] || due.options[0];
        }
        if (!opt) { pending = due; break; }
        resolved.add(due.id);
        st.answers[due.id] = opt.id;
        applyEffects(opt.effects, st);
        var prev = steps.length ? [steps[steps.length - 1].id] : [];
        push({ type: 'decision', id: due.id, time: due.time, decision: due, option: opt, parents: prev, scope: 1, category: 'PERSONAL' });
        enqueue(opt.next, due.id);
        continue;
      }

      /* 2) 次に起こりうる出来事 */
      if (!cand) break;
      pool.delete(cand.ev.eventId);
      if (cand.ev._cond(st)) {
        applyEffects(cand.ev.effects, st);
        st.fired.add(cand.ev.eventId);
        push({
          type: 'event', id: cand.ev.eventId, time: cand.ev.time, event: cand.ev,
          parents: cand.parents.filter(function (pid) { return stepById[pid]; }),
          scope: cand.ev.scope, category: cand.ev.impactCategory
        });
        enqueue(cand.ev.nextEvents, cand.ev.eventId);
      } else {
        rejected.add(cand.ev.eventId);
      }
    }

    var result = { scenario: scn, steps: steps, state: st, pending: pending, answers: Object.assign({}, st.answers) };
    if (!pending) {
      var fut = null;
      for (var f = 0; f < scn.futures.length; f++) if (scn.futures[f]._cond(st)) { fut = scn.futures[f]; break; }
      result.future = fut || scn.futures[scn.futures.length - 1];
      var maxT = steps.reduce(function (m, s) { return Math.max(m, s.time); }, 0);
      result.years = Math.max(1, Math.round(maxT / 365));
      result.metrics = metrics(st, result.years);
      result.year = (scn.baseYear || 2026) + result.years;
      result.chain = chain(steps, stepById);
    }
    return result;
  }

  /* 架空のシミュレーション値（0〜100）
     ・50 が物語の始まりの水準
     ・何もしなくても環境は少しずつ悪くなる（年 0.3 ずつ）という前提を置く */
  function metrics(st, years) {
    years = years || 0;
    function c(v) { return Math.max(3, Math.min(98, Math.round(50 + (v - 50) * 2.2))); }
    var v = st.vars;
    var env = v.environment - years * 0.3;
    var m = { society: c(v.society), economy: c(v.economy), environment: c(env), life: c(v.life) };
    m.planet = c(env * 0.55 + (v.society + v.economy + v.life) / 3 * 0.45);
    return m;
  }

  /* 最初の選択から最後の出来事までの因果のつながりをたどる */
  function chain(steps, stepById) {
    var last = null;
    for (var i = steps.length - 1; i >= 0; i--) {
      if (steps[i].type === 'event' && steps[i].scope >= 5) { last = steps[i]; break; }
    }
    if (!last) last = steps[steps.length - 1];
    var out = [];
    var cur = last;
    var seen = {};
    while (cur && !seen[cur.id]) {
      seen[cur.id] = 1;
      out.unshift(cur);
      cur = cur.parents && cur.parents.length ? stepById[cur.parents[0]] : null;
    }
    return out;
  }

  /* 選ばなかった最初の選択肢ごとの未来（比較用） */
  function alternatives(scn, answers) {
    var d1 = scn.decisions[0];
    return d1.options.filter(function (o) { return o.id !== answers[d1.id]; }).map(function (o) {
      var a = Object.assign({}, answers); a[d1.id] = o.id;
      var r = run(scn, a, { auto: true });
      r.firstOption = o;
      return r;
    });
  }

  /* 全組み合わせを列挙（テスト・図鑑用） */
  function enumerate(scn) {
    var results = [];
    function walk(ans) {
      var r = run(scn, ans);
      if (!r.pending) { results.push(r); return; }
      r.pending.options.forEach(function (o) {
        var a = Object.assign({}, ans); a[r.pending.id] = o.id; walk(a);
      });
    }
    walk({});
    return results;
  }

  OSC.engine = {
    CATEGORIES: CATEGORIES, SCOPES: SCOPES, BASE_VARS: BASE_VARS,
    compileCondition: compileCondition, run: run, alternatives: alternatives,
    enumerate: enumerate, validate: validate, formatTime: formatTime, metrics: metrics
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = OSC;
})(typeof window !== 'undefined' ? window : globalThis);
