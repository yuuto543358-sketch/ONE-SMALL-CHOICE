/* すべてのシナリオ・すべての選択の組み合わせを自動でテストする
   使い方: node tests/run-tests.js */
const fs = require('fs');
const path = require('path');
global.window = undefined;
const OSC = require('../js/engine.js');
global.OSC = OSC;
const dir = path.join(__dirname, '..', 'scenarios');
fs.readdirSync(dir).filter(f => /^\d{3}_.*\.js$/.test(f)).sort().forEach(f => require(path.join(dir, f)));

const verbose = process.argv.includes('-v');
let fail = 0;
const warn = (s, m) => { fail++; console.log('  ✗ ' + s + ': ' + m); };
console.log('シナリオ数: ' + OSC.scenarios.length);
const titles = new Set();
OSC.scenarios.forEach(scn => {
  const probs = OSC.engine.validate(scn);
  probs.forEach(p => warn(scn.id, p));
  const runs = OSC.engine.enumerate(scn);
  const futures = new Set();
  const usedEvents = new Set();
  let minEv = 99, maxEv = 0, minDec = 99, maxDec = 0;
  runs.forEach(r => {
    const evs = r.steps.filter(s => s.type === 'event');
    const decs = r.steps.filter(s => s.type === 'decision');
    evs.forEach(e => usedEvents.add(e.id));
    minEv = Math.min(minEv, evs.length); maxEv = Math.max(maxEv, evs.length);
    minDec = Math.min(minDec, decs.length); maxDec = Math.max(maxDec, decs.length);
    futures.add(r.future.id);
    const key = JSON.stringify(r.answers);
    if (r.future.id === 'default') warn(scn.id, '予備の未来に到達 ' + key);
    if (!evs.some(e => e.scope >= 5)) warn(scn.id, '世界規模の出来事がない ' + key);
    if (decs.length < 3 || decs.length > 4) warn(scn.id, '選択回数 ' + decs.length + ' ' + key);
    if (evs.length < 8) warn(scn.id, 'イベントが少ない(' + evs.length + ') ' + key);
    if (r.future.impacts.length < 3) warn(scn.id, '地球規模の影響が3つ未満 ' + r.future.id);
    const alts = OSC.engine.alternatives(scn, r.answers);
    if (alts.length < 2) warn(scn.id, '比較できる未来が2つ未満');
    alts.forEach(a => { if (a.pending) warn(scn.id, '比較用の未来が未完了'); });
    if (verbose) console.log('    ' + key + ' → ' + r.future.id + ' (' + evs.length + '件, ' + r.year + '年)');
  });
  scn.events.forEach(e => { if (!usedEvents.has(e.eventId)) warn(scn.id, '一度も起きないイベント: ' + e.eventId); });
  scn.futures.forEach(f => { if (f.id !== 'default' && !futures.has(f.id)) warn(scn.id, '到達できない未来: ' + f.id); });
  if (titles.has(scn.title)) warn(scn.id, 'タイトル重複');
  titles.add(scn.title);
  console.log(`${scn.number} ${scn.title}: 全${runs.length}通り / イベント総数${scn.events.length} / 1プレイ${minEv}〜${maxEv}件 / 選択${minDec}〜${maxDec}回 / 未来${futures.size}種`);
});
console.log(fail ? `\n${fail} 件の問題があります` : '\nすべてのテストに合格しました');
process.exit(fail ? 1 : 0);
