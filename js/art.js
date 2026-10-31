/* =========================================================
   ONE SMALL CHOICE — イラスト（SVG）
   地球・シナリオの挿絵・アイコンをすべてコードで描く
   ========================================================= */
(function (root) {
  'use strict';
  var OSC = (root.OSC = root.OSC || {});
  var uid = 0;

  /* ---------- 地球 ---------- */
  var LAND = [
    'M30 50C45 38 75 40 88 52C95 60 85 70 78 76C70 84 66 96 58 100C52 92 44 86 38 78C30 70 24 58 30 50Z',
    'M70 108C80 104 90 112 88 124C86 138 78 152 72 160C68 150 64 136 64 124C64 116 66 110 70 108Z',
    'M96 34C104 30 114 32 116 38C117 44 108 46 102 45C96 44 92 38 96 34Z',
    'M140 52C150 46 166 48 170 56C172 62 164 66 158 66C150 68 146 62 140 60Z',
    'M146 78C160 72 178 78 182 92C184 106 176 118 170 132C166 142 158 144 154 134C150 122 146 112 142 100C140 90 140 82 146 78Z',
    'M176 44C196 34 232 36 256 46C270 52 272 64 260 72C248 80 232 78 220 86C210 92 200 88 194 80C188 72 178 66 174 58C172 52 172 48 176 44Z',
    'M222 94C228 92 234 96 232 102C230 106 224 106 222 102Z',
    'M248 120C258 114 274 116 278 126C280 134 270 140 260 138C250 136 244 128 248 120Z',
    'M280 60C284 56 289 59 287 65C285 71 281 76 278 72C277 68 278 63 280 60Z'
  ];
  var SPREAD = [[100, 96], [72, 72], [128, 62], [142, 112], [88, 128], [58, 104], [116, 140], [150, 86], [104, 46], [76, 150], [46, 84], [160, 128]];

  function globe(opts) {
    opts = opts || {};
    var id = 'g' + (++uid);
    var land = LAND.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    var spread = '';
    if (opts.spread) {
      spread = '<g class="g-spread">' + SPREAD.map(function (p, i) {
        var delay = (0.5 + i * 0.28).toFixed(2) + 's';
        return '<circle class="g-ring" cx="' + p[0] + '" cy="' + p[1] + '" r="6" style="stroke:var(--tone);animation-delay:' + delay + '"/>' +
               '<circle class="g-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" style="fill:var(--tone);animation-delay:' + delay + '"/>';
      }).join('') + '</g>';
    }
    var orbit = '';
    if (opts.orbit) {
      var op = 'M10 118 A92 34 -14 1 1 190 82 A92 34 -14 1 1 10 118';
      orbit = '<path class="g-orbit" d="' + op + '"/>' +
              '<circle class="g-sat" r="2.6"><animateMotion dur="16s" repeatCount="indefinite" path="' + op + '"/></circle>';
    }
    return '<svg class="globe' + (opts.cls ? ' ' + opts.cls : '') + '" viewBox="0 0 200 200" aria-hidden="true">' +
      '<defs><clipPath id="' + id + 'c"><circle cx="100" cy="100" r="80"/></clipPath>' +
      '<radialGradient id="' + id + 's" cx="38%" cy="32%" r="75%">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>' +
        '<stop offset=".55" stop-color="#ffffff" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#23313A" stop-opacity=".10"/></radialGradient></defs>' +
      (opts.orbit ? '<g class="g-back">' + orbit.split('<circle')[0] + '</g>' : '') +
      '<circle class="g-ocean" cx="100" cy="100" r="80"/>' +
      '<g clip-path="url(#' + id + 'c)">' +
        '<g class="g-land"><g class="g-land-move" transform="translate(0,0)">' +
          '<g transform="translate(-20,0)">' + land + '</g><g transform="translate(300,0)">' + land + '</g>' +
        '</g></g>' +
        '<ellipse class="g-lat" cx="100" cy="100" rx="80" ry="26"/>' +
        '<ellipse class="g-lat" cx="100" cy="100" rx="80" ry="58"/>' +
        '<ellipse class="g-lat" cx="100" cy="100" rx="30" ry="80"/>' +
        '<line class="g-lat" x1="20" y1="100" x2="180" y2="100"/>' +
        (opts.spread ? '<circle class="g-tint" cx="100" cy="100" r="80" style="fill:var(--tone-soft)"/>' : '') +
        spread +
      '</g>' +
      '<circle cx="100" cy="100" r="80" fill="url(#' + id + 's)"/>' +
      '<circle class="g-rim" cx="100" cy="100" r="80"/>' +
      (opts.orbit ? '<circle class="g-sat" r="2.6"><animateMotion dur="16s" repeatCount="indefinite" path="M10 118 A92 34 -14 1 1 190 82 A92 34 -14 1 1 10 118"/></circle>' : '') +
      '</svg>';
  }

  /* ---------- アイコン ---------- */
  var ICONS = {
    PERSONAL: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
    SOCIAL: '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c.8-3.4 3.2-5 6-5s5.2 1.6 6 5"/><path d="M15.5 14.2c2.6-.3 4.7 1 5.5 4.3"/>',
    ECONOMY: '<path d="M4 20h16"/><path d="M6 17v-4"/><path d="M10.5 17V9"/><path d="M15 17v-6"/><path d="M19.5 17V5"/>',
    ENVIRONMENT: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
    TECHNOLOGY: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    CULTURE: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    GLOBAL: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    skip: '<path d="M5 6l6 6-6 6"/><path d="M12 6l6 6-6 6"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M6 13c0-3 4-4 10-4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 013 0V11"/><path d="M11 10.5V4.5a1.5 1.5 0 013 0V11"/><path d="M14 10.5V6a1.5 1.5 0 013 0v7c0 4-2.5 7-6 7-3 0-4.5-1.5-6-4l-2-3.5a1.5 1.5 0 012.6-1.5L8 13"/>',
    compare: '<rect x="3" y="5" width="7" height="14" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- 挿絵 ---------- */
  function P(i, inner, extra) { return '<g class="ill-part' + (extra ? ' ' + extra : '') + '" style="--i:' + i + '">' + inner + '</g>'; }
  function person(x, y, s, cls) {
    s = s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<circle cx="0" cy="-34" r="9" class="' + (cls || 'fill-card') + '"/>' +
      '<path d="M-14 6 C-14 -12 -8 -22 0 -22 C8 -22 14 -12 14 6 Z" class="' + (cls || 'fill-card') + '"/></g>';
  }
  var SCENES = {
    bottle:
      P(0, '<circle cx="268" cy="44" r="16" class="fill-sun"/><path class="soft" d="M268 18v-6M268 76v-6M242 44h-6M300 44h-6M250 26l-4-4M290 66l-4-4"/>') +
      P(1, '<rect x="52" y="34" width="128" height="74" rx="6" class="fill-gray"/><path class="soft" d="M52 58h128M52 82h128"/>' +
           '<rect x="62" y="40" width="10" height="16" rx="3" class="fill-blue"/><rect x="78" y="40" width="10" height="16" rx="3" class="fill-blue"/><rect x="94" y="40" width="10" height="16" rx="3" class="fill-green"/><rect x="110" y="40" width="10" height="16" rx="3" class="fill-blue"/>' +
           '<rect x="62" y="64" width="10" height="16" rx="3" class="fill-green"/><rect x="78" y="64" width="10" height="16" rx="3" class="fill-blue"/><rect x="94" y="64" width="10" height="16" rx="3" class="fill-blue"/>') +
      P(2, '<rect x="36" y="118" width="248" height="50" rx="4" class="fill-card"/><path class="ground" d="M20 168h280"/>') +
      P(3, '<g class="float"><rect x="198" y="64" width="12" height="8" rx="2" class="fill-ink"/><path d="M196 72h16q5 7 5 16v24q0 6-6 6h-14q-6 0-6-6v-24q0-9 5-16z" class="fill-blue"/><path class="soft" d="M191 92h26M191 104h26"/></g>') +
      P(4, '<g class="float" style="animation-delay:-2s"><rect x="236" y="62" width="14" height="10" rx="3" class="fill-ink"/><rect x="232" y="72" width="22" height="46" rx="9" class="fill-green"/><path class="soft" d="M236 86h14"/></g>') +
      P(5, '<path class="soft" d="M150 132h40M150 144h24"/><text x="96" y="148" font-size="10" fill="var(--ink-3)" stroke="none" font-family="DM Mono, monospace">34℃</text>'),
    help:
      P(0, '<path class="ground" d="M20 170h280"/><path d="M196 170v-22h24v-22h24v-22h24v-22h32" class="fill-gray"/>') +
      P(1, person(214, 150, 1.05)) +
      P(2, '<path d="M150 158l18-6 6 16-20 4z" class="fill-blue"/>') +
      P(3, '<circle cx="128" cy="164" r="6" class="fill-sun"/><circle cx="108" cy="166" r="5" class="fill-sun"/><circle cx="84" cy="165" r="5.5" class="fill-sun"/><path class="soft" d="M140 152c-6-4-14-4-20 0M98 156c-4-3-10-3-14 0"/>') +
      P(4, person(54, 170, 1.15, 'fill-green')) +
      P(5, '<path class="soft" d="M70 110c10-10 24-10 34 0" stroke-dasharray="3 4"/>'),
    tree:
      P(0, '<circle cx="62" cy="48" r="14" class="fill-sun"/>') +
      P(1, '<path class="ground" d="M20 166h280"/><path d="M110 166c20-18 80-18 100 0" class="fill-gray"/>') +
      P(2, '<path d="M160 152V104"/><path d="M160 128c-12-2-20-10-22-22 12 0 20 8 22 22z" class="fill-green"/><path d="M160 116c10-4 16-12 16-24-12 2-16 12-16 24z" class="fill-green"/>', 'float') +
      P(3, '<path d="M236 166l-14-62"/><path d="M216 92l10-4 6 16-10 4z" class="fill-gray"/>') +
      P(4, '<path d="M60 150h28v16H60z" class="fill-blue"/><path d="M88 154l14-10M60 152c-8 0-10-12-2-14"/><path class="soft" d="M104 140l4-4M108 146l5-2"/>') +
      P(5, '<path class="soft" d="M180 60c8-6 16-6 24 0M196 46c6-4 12-4 18 0"/>'),
    sns:
      P(0, '<rect x="118" y="24" width="84" height="152" rx="14" class="fill-card"/><path class="soft" d="M150 34h20"/>') +
      P(1, '<rect x="128" y="48" width="64" height="44" rx="6" class="fill-blue"/><circle cx="146" cy="64" r="6" class="fill-sun"/><path d="M128 86l18-14 14 10 10-8 22 14" class="soft"/>') +
      P(2, '<path class="soft" d="M130 104h56M130 114h40M130 124h48"/>') +
      P(3, '<circle cx="64" cy="70" r="8" class="fill-gray"/><circle cx="44" cy="120" r="7" class="fill-gray"/><circle cx="84" cy="140" r="6" class="fill-gray"/><path class="soft" d="M72 74l46 12M51 116l67-6M90 136l28-12" stroke-dasharray="2 4"/>') +
      P(4, '<circle cx="256" cy="60" r="8" class="fill-gray"/><circle cx="270" cy="116" r="7" class="fill-gray"/><circle cx="238" cy="150" r="6" class="fill-gray"/><path class="soft" d="M248 64l-46 22M263 114l-61-4M232 146l-30-20" stroke-dasharray="2 4"/>') +
      P(5, '<path d="M226 44c-3-6-12-4-10 3 1 4 10 9 10 9s9-5 10-9c2-7-7-9-10-3z" class="fill-accent-b float"/>'),
    path:
      P(0, '<path class="ground" d="M20 170h280"/>') +
      P(1, '<path d="M160 170L150 110M160 170l10-60" class="soft"/><path d="M120 170c10-30 20-50 30-60M200 170c-6-24-18-46-30-60" />') +
      P(2, '<path d="M150 110c-20-20-60-28-110-30M170 110c20-18 50-26 100-28" class="soft" stroke-dasharray="3 5"/>') +
      P(3, '<path d="M40 80V56l18-12 18 12v24z" class="fill-gray"/><path d="M250 82V60l14-10 14 10v22z" class="fill-blue"/><rect x="258" y="66" width="8" height="10" class="fill-card"/>') +
      P(4, '<path d="M214 150V96"/><path d="M214 96h12" /><circle cx="228" cy="100" r="5" class="fill-sun"/>') +
      P(5, person(160, 170, .8, 'fill-green')),
    product:
      P(0, '<rect x="40" y="38" width="240" height="96" rx="6" class="fill-gray"/><path class="soft" d="M40 86h240"/><path class="ground" d="M20 168h280"/>') +
      P(1, '<rect x="64" y="50" width="34" height="34" rx="4" class="fill-card"/><path class="soft" d="M70 62h22M70 70h14"/>') +
      P(2, '<path d="M126 84V60q0-8 8-8h16q8 0 8 8v24z" class="fill-green"/><rect x="130" y="46" width="24" height="8" rx="2" class="fill-card"/>') +
      P(3, '<path d="M188 84l4-32h28l4 32z" class="fill-blue"/><path class="soft" d="M196 64h20"/>') +
      P(4, '<rect x="234" y="56" width="30" height="28" rx="3" class="fill-card"/><path d="M240 64h18"/>') +
      P(5, '<path d="M120 126h80l-8 36h-64z" class="fill-card"/><path d="M128 126l14-20M192 126l-14-20M132 140h56M136 152h48" class="soft"/>', 'float'),
    friend:
      P(0, '<path class="ground" d="M20 170h280"/><path d="M84 148h152M96 148v22M224 148v22" />') +
      P(1, person(128, 148, 1, 'fill-green')) +
      P(2, person(196, 148, 1, 'fill-gray')) +
      P(3, '<path d="M150 60h56q10 0 10 10v18q0 10-10 10h-34l-12 12v-12h-10q-10 0-10-10V70q0-10 10-10z" class="fill-card"/>', 'float') +
      P(4, '<circle cx="164" cy="80" r="2.5" class="fill-ink"/><circle cx="178" cy="80" r="2.5" class="fill-ink"/><circle cx="192" cy="80" r="2.5" class="fill-ink"/>') +
      P(5, '<path class="soft" d="M60 60c8-6 16-6 24 0M262 50c6-4 12-4 18 0"/>'),
    trash:
      P(0, '<circle cx="258" cy="46" r="14" class="fill-sun"/>') +
      P(1, '<path d="M20 120c20-6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0 40 6 60 0V170H20z" class="fill-blue"/>') +
      P(2, '<path d="M20 146c40-10 100-10 140 0s100 10 140 0V170H20z" class="fill-sun"/><path class="ground" d="M20 170h280"/>') +
      P(3, '<rect x="146" y="150" width="12" height="18" rx="2" class="fill-card" transform="rotate(-70 152 159)"/>') +
      P(4, '<path d="M196 40c-30 40-40 80-40 108"/><path d="M152 150l4 6 6-4"/>' + person(214, 140, 1, 'fill-green')) +
      P(5, '<path class="soft" d="M80 60l8 6 8-6M110 44l6 5 6-5"/>')
  };
  function illustration(key, cls) {
    var crop = cls && cls.indexOf('ill-static') >= 0 ? ' preserveAspectRatio="xMidYMid slice"' : '';
    return '<svg class="ill' + (cls ? ' ' + cls : '') + '" viewBox="0 0 320 200"' + crop + ' aria-hidden="true">' + (SCENES[key] || SCENES.bottle) + '</svg>';
  }

  OSC.art = { globe: globe, icon: icon, illustration: illustration };
})(typeof window !== 'undefined' ? window : globalThis);
