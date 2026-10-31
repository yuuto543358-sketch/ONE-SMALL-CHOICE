/* =========================================================
   ONE SMALL CHOICE — 記録の保存（LocalStorage）
   ・発見した未来、プレイ履歴、設定、途中の進行状況
   ・保存できない環境（プライベートモード等）でも遊べるようにする
   ========================================================= */
(function (root) {
  'use strict';
  var OSC = (root.OSC = root.OSC || {});
  var KEY = 'one-small-choice.v1';
  var data = load();

  function blank() {
    return { settings: { speed: 'normal' }, discovered: {}, played: {}, history: [], session: null, seenHowto: false };
  }
  function load() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(KEY);
      if (!raw) return blank();
      var d = JSON.parse(raw);
      var b = blank();
      Object.keys(b).forEach(function (k) { if (d[k] === undefined) d[k] = b[k]; });
      return d;
    } catch (e) { return blank(); }
  }
  function save() {
    try { root.localStorage && root.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 保存できなくても続行 */ }
  }

  OSC.store = {
    get settings() { return data.settings; },
    setSetting: function (k, v) { data.settings[k] = v; save(); },

    discovered: function (scnId) { return data.discovered[scnId] || []; },
    playedCount: function (scnId) { return data.played[scnId] || 0; },
    totalDiscovered: function () {
      return Object.keys(data.discovered).reduce(function (n, k) { return n + data.discovered[k].length; }, 0);
    },
    /* 未来に到達したときに1回だけ呼ぶ */
    recordFuture: function (scn, result) {
      var list = data.discovered[scn.id] || (data.discovered[scn.id] = []);
      var isNew = list.indexOf(result.future.id) < 0;
      if (isNew) list.push(result.future.id);
      data.played[scn.id] = (data.played[scn.id] || 0) + 1;
      data.history.unshift({
        scenarioId: scn.id, futureId: result.future.id, futureTitle: result.future.title,
        first: result.steps[0] && result.steps[0].option ? result.steps[0].option.label : '',
        answers: result.answers, year: result.year, at: Date.now()
      });
      data.history = data.history.slice(0, 30);
      save();
      return isNew;
    },
    history: function () { return data.history; },
    /* 選択肢ごとに、すでに選んだことがあるか */
    triedFirst: function (scnId) {
      var s = {};
      data.history.forEach(function (h) { if (h.scenarioId === scnId && h.answers) s[h.answers.d1] = (s[h.answers.d1] || 0) + 1; });
      return s;
    },

    /* 途中経過（リロードしても続きから） */
    get session() { return data.session; },
    setSession: function (s) { data.session = s; save(); },
    clearSession: function () { data.session = null; save(); },

    get seenHowto() { return data.seenHowto; },
    markHowto: function () { data.seenHowto = true; save(); },

    reset: function () { data = blank(); save(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
