/*
 * 차시 공통 '활동 제출' 위젯 (1·3·4차시처럼 페이지 안에 제출 칸이 없는 수업용)
 * 페이지에서 먼저 window.LESSON_SUBMIT = { lesson, action, intro, questions:[{key,label,placeholder,prefill}], collect(){...}, bottom }
 * 를 정한 뒤 이 파일을 불러오면 오른쪽 아래에 [📮 활동 제출] 버튼이 생깁니다.
 * 제출은 2·5·6·7차시와 같은 구글 시트 Apps Script 웹 앱으로 보내고, 선생님 피드백도 같은 곳에서 불러옵니다.
 */
(function () {
  var C = window.LESSON_SUBMIT; if (!C) return;
  var API = 'https://script.google.com/macros/s/AKfycbyfpqz_5eEpNHCmJyu6QdyYyYAaOfNnMo9S0Yd94ZBvp32PFutglQ2HU2_71Z4shqvmHw/exec';
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = '' +
    '.lsw-fab{position:fixed;right:12px;bottom:' + (C.bottom || 12) + 'px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:999px;background:#f59e0b;color:#0f172a;border:0;font-family:"Noto Sans KR",system-ui,sans-serif;font-size:15px;font-weight:900;box-shadow:0 6px 18px rgba(245,158,11,.4);cursor:pointer}' +
    '.lsw-bg{position:fixed;inset:0;z-index:2147483001;background:rgba(2,6,23,.72);display:none;align-items:flex-end;justify-content:center;padding:12px}' +
    '.lsw-bg.on{display:flex}@media(min-width:700px){.lsw-bg{align-items:center}}' +
    '.lsw{width:min(640px,100%);max-height:92vh;overflow:auto;background:#fff;color:#0f172a;border-radius:20px;padding:22px;font-family:"Noto Sans KR",system-ui,sans-serif;font-size:16px;line-height:1.65;word-break:keep-all;box-shadow:0 20px 50px rgba(0,0,0,.4)}' +
    '.lsw h3{margin:0 0 4px;font-size:20px;font-weight:900}.lsw .k{display:inline-block;font-size:12px;font-weight:700;color:#b45309;background:#fef3c7;padding:2px 10px;border-radius:6px;margin-bottom:8px}' +
    '.lsw p.i{margin:0 0 12px;color:#475569;font-size:14.5px}' +
    '.lsw .res{background:#f1f5f9;border-radius:12px;padding:10px 14px;font-size:14.5px;margin:0 0 14px}.lsw .res b{color:#b45309}' +
    '.lsw label{display:block;font-weight:700;font-size:15px;margin:10px 0 6px}' +
    '.lsw textarea{width:100%;min-height:110px;font:inherit;font-size:15px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:12px;resize:vertical;box-sizing:border-box;background:#fff;color:#0f172a}' +
    '.lsw .who{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0 4px}' +
    '.lsw .who label{margin:0;font-size:13px;color:#475569;display:flex;flex-direction:column;gap:4px}' +
    '.lsw .who input{font:inherit;font-size:16px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;min-width:0;background:#f8fafc;color:#0f172a}' +
    '.lsw textarea:focus,.lsw .who input:focus{outline:2px solid #f59e0b;outline-offset:1px}' +
    '.lsw .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}' +
    '.lsw .row button{font:inherit;font-weight:700;font-size:15px;padding:10px 18px;border-radius:12px;border:1px solid #f59e0b;background:#f59e0b;color:#0f172a;cursor:pointer}' +
    '.lsw .row button.g{background:transparent;color:#b45309}.lsw .row button:disabled{opacity:.6;cursor:wait}' +
    '.lsw .msg{margin-top:10px;font-weight:700;min-height:1.4em}.lsw .msg.ok{color:#15803d}.lsw .msg.err{color:#b91c1c}' +
    '.lsw .fb{margin-top:10px;background:#f1f5f9;border-radius:12px;padding:12px 14px}.lsw .fb .g{display:inline-block;font-weight:900;background:#f59e0b;border-radius:8px;padding:1px 10px;margin-right:6px}' +
    '@media(max-width:480px){.lsw .who{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.lsw .who label:last-child{grid-column:1/-1}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'lsw-fab'; fab.textContent = '📮 활동 제출';
  var bg = document.createElement('div'); bg.className = 'lsw-bg'; bg.setAttribute('role', 'dialog'); bg.setAttribute('aria-label', '선생님께 활동 제출');
  var qs = (C.questions || []).map(function (q) {
    return '<label for="lsw-' + q.key + '">' + q.label + '</label><textarea id="lsw-' + q.key + '" placeholder="' + esc(q.placeholder || '') + '"></textarea>';
  }).join('');
  bg.innerHTML = '<div class="lsw"><div class="k">' + C.lesson + '차시 · 선생님께 제출하기</div><h3>오늘 활동을 제출해요</h3>' +
    '<p class="i">' + (C.intro || '') + ' 제출하면 선생님 화면에 바로 나타납니다. 고쳐서 다시 제출해도 괜찮아요(마지막 제출을 기준으로 봅니다).</p>' +
    '<div class="res" id="lsw-res"></div>' + qs +
    '<div class="who"><label>학반 <input id="lsw-class" placeholder="예) 2-3" autocomplete="off"></label><label>번호 <input id="lsw-num" inputmode="numeric" placeholder="예) 15" autocomplete="off"></label><label>이름 <input id="lsw-name" placeholder="이름" autocomplete="off"></label></div>' +
    '<div class="row"><button type="button" id="lsw-send">제출하기</button><button type="button" class="g" id="lsw-fb">선생님 피드백 확인</button><button type="button" class="g" id="lsw-close">닫기</button></div>' +
    '<div class="msg" id="lsw-msg" role="status" aria-live="polite"></div><div class="fb" id="lsw-fbbox" hidden></div></div>';
  document.body.appendChild(fab); document.body.appendChild(bg);
  function $(id) { return document.getElementById(id); }

  // 학반·번호·이름은 다른 차시와 같은 저장 키를 써서 한 번만 입력하면 되게 함
  [['lsw-class', 'pc-class'], ['lsw-num', 'pc-num'], ['lsw-name', 'pc-name']].forEach(function (p) {
    var i = $(p[0]); i.value = store(p[1]) || ''; i.addEventListener('input', function () { store(p[1], i.value); });
  });
  (C.questions || []).forEach(function (q) {
    var ta = $('lsw-' + q.key), k = 'lsw' + C.lesson + '-' + q.key;
    ta.value = store(k) || ''; ta.addEventListener('input', function () { store(k, ta.value); });
  });

  function results() { try { return C.collect ? C.collect() : {}; } catch (e) { return {}; } }
  function open() {
    (C.questions || []).forEach(function (q) {
      var ta = $('lsw-' + q.key);
      if (!ta.value.trim() && q.prefill) { var v = q.prefill(); if (v) ta.value = v; }
    });
    var r = results(), names = C.resultNames || {};
    var lines = Object.keys(names).map(function (k) { return names[k] + ': <b>' + esc(r[k] || '아직 안 함') + '</b>'; });
    $('lsw-res').innerHTML = lines.length ? '함께 제출되는 활동 결과<br>' + lines.join('<br>') : '';
    $('lsw-res').hidden = !lines.length;
    bg.classList.add('on');
  }
  fab.addEventListener('click', open);
  $('lsw-close').addEventListener('click', function () { bg.classList.remove('on'); });
  bg.addEventListener('click', function (e) { if (e.target === bg) bg.classList.remove('on'); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') bg.classList.remove('on'); });

  function v(id) { return $(id).value.trim(); }
  function post(payload) {
    var ctrl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('status ' + r.status); return r.json(); });
  }
  function needWho() {
    if (v('lsw-class') && v('lsw-num') && v('lsw-name')) return false;
    var m = $('lsw-msg'); m.className = 'msg err'; m.textContent = '학반, 번호, 이름을 모두 써 주세요.'; return true;
  }
  $('lsw-send').addEventListener('click', function () {
    var btn = this, m = $('lsw-msg'); m.className = 'msg'; m.textContent = '';
    if (needWho()) return;
    var any = (C.questions || []).some(function (q) { return v('lsw-' + q.key); });
    if (!any) { m.className = 'msg err'; m.textContent = '글쓰기 칸을 먼저 채워 주세요.'; return; }
    var p = results(); p.action = C.action; p.className = v('lsw-class'); p.studentNumber = v('lsw-num'); p.studentName = v('lsw-name');
    (C.questions || []).forEach(function (q) { p[q.key] = v('lsw-' + q.key); });
    btn.disabled = true; btn.textContent = '제출 중…';
    post(p).then(function (d) {
      if (!d || !d.ok) throw new Error('server');
      m.className = 'msg ok'; m.textContent = '제출했어요! (' + d.timestamp + ') 선생님 화면에 바로 나타납니다.';
    }).catch(function () {
      m.className = 'msg err'; m.textContent = '제출하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요. (쓴 글은 그대로 남아 있어요)';
    }).then(function () { btn.disabled = false; btn.textContent = '제출하기'; });
  });
  $('lsw-fb').addEventListener('click', function () {
    var btn = this, box = $('lsw-fbbox'); $('lsw-msg').textContent = '';
    if (needWho()) return;
    btn.disabled = true; box.hidden = false; box.textContent = '불러오는 중…';
    post({ action: 'myFeedback', lesson: C.lesson, className: v('lsw-class'), studentNumber: v('lsw-num'), studentName: v('lsw-name') })
      .then(function (d) {
        if (!d || !d.ok) throw new Error('server');
        if (!d.found) { box.textContent = '아직 제출 기록이 없어요. 먼저 제출해 주세요.'; return; }
        if (!d.grade && !d.feedback) { box.textContent = '제출은 확인되었어요(' + d.timestamp + '). 선생님이 아직 평가하지 않았어요. 잠시 뒤 다시 눌러 보세요.'; return; }
        box.innerHTML = (d.grade ? '<span class="g">' + esc(d.grade) + '</span>' : '') + esc(d.feedback || '');
      })
      .catch(function () { box.textContent = '불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.'; })
      .then(function () { btn.disabled = false; });
  });
})();
