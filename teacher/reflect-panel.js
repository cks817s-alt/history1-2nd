/* =====================================================================
   교사 화면 · 수업 성찰 (선생님만, 교사 비밀번호 필요)
   - 나이스: 고른 날의 역사 수업(반·교시) + 3주 학사 일정  → 서버(Apps Script)가 키를 들고 부름
   - 성찰 기록: 좋았던 점·부족한 점·다음에 바꿀 것·아이디어 → 시트 「수업 성찰」 탭
   - Gemini: 쌓인 성찰 → 다음 수업 개선안 3가지 / 아이디어 메모 → 45분 활동으로 다듬기
   API 키는 이 파일에 없습니다(서버 스크립트 속성에만 있음).
   ===================================================================== */
(function(){
  var box = document.getElementById('reflectPanel');
  var API = window.TEACHER_API, getPw = window.TEACHER_PW;
  function $(s){ return box.querySelector(s); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function post(p){ p.password = getPw(); return fetch(API,{method:'POST',body:JSON.stringify(p)}).then(function(r){ return r.json(); }); }
  function ymdOf(d){ return d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2); }
  function dash(y){ return y.slice(0,4)+'-'+y.slice(4,6)+'-'+y.slice(6,8); }
  var DOW='일월화수목금토';
  function pretty(y){ var d=new Date(+y.slice(0,4),+y.slice(4,6)-1,+y.slice(6,8)); return (d.getMonth()+1)+'월 '+d.getDate()+'일('+DOW[d.getDay()]+')'; }
  var LESSONS=['1차시 · 제1차 세계 대전','1차시+ · 유럽의 정치 체제 변화','2차시 · 제2차 세계 대전의 배경','3차시 · 제2차 세계 대전의 전개','4차시 · 전쟁 범죄','5차시 · 인권 회복과 평화','6차시 · 민족 운동','7차시 · 냉전 체제의 형성','개념 학습·복습','세계사 타임라인','기타'];
  var ERR={unauthorized:'비밀번호가 맞지 않아요. 다시 로그인해 주세요.',no_neis_key:'나이스 키가 아직 없어요. 시트 메뉴 [📚 수업 설정] → ④ 나이스 API 키 입력.',ai_unavailable:'AI가 지금 답하지 못했어요. 잠시 뒤 다시 눌러 주세요.',no_rows:'먼저 성찰을 한 개 이상 저장해 주세요.',empty:'내용을 한 칸 이상 써 주세요.'};
  function emsg(e){ return ERR[e] || ('잠시 문제가 생겼어요 ('+e+')'); }

  var css=''+
  '#reflectPanel .rp-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:16px;align-items:start}'+
  '#reflectPanel .rp-col{display:grid;gap:16px;min-width:0}'+
  '#reflectPanel h2{margin:0 0 4px;font-size:22px}'+
  '#reflectPanel .k{font-family:"Gaegu",cursive;font-weight:700;font-size:18px;color:var(--nb-teal,#0A6E6A)}'+
  '#reflectPanel .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'+
  '#reflectPanel .meta{font-size:14px;color:var(--ink-2)}'+
  '#reflectPanel .slots{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}'+
  '#reflectPanel .slots button{width:100%;text-align:left;display:flex;gap:10px;align-items:center;font:inherit;font-size:15px;padding:10px 12px;border:2px solid var(--nb-ink,#1C1C1C);border-radius:12px;background:var(--surface);color:inherit;cursor:pointer;min-height:46px}'+
  '#reflectPanel .slots button b{font-family:"Do Hyeon",sans-serif;font-weight:400;font-size:20px;min-width:52px}'+
  '#reflectPanel .slots button[aria-pressed="true"]{background:var(--nb-hl,#FFE45C);color:#1C1C1C;box-shadow:3px 3px 0 var(--nb-ink,#1C1C1C)}'+
  '#reflectPanel .events{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:4px;font-size:14px}'+
  '#reflectPanel .events li{display:flex;gap:10px}#reflectPanel .events li span{min-width:92px;font-weight:800}'+
  '#reflectPanel label.f{display:block;font-weight:800;font-size:14.5px;margin:10px 0 4px}'+
  '#reflectPanel textarea{width:100%;box-sizing:border-box;min-height:70px;resize:vertical;font:inherit;font-size:15px;line-height:1.55;padding:9px 11px;border:2px solid var(--nb-ink,#1C1C1C);border-radius:10px;background:var(--surface);color:inherit}'+
  '#reflectPanel .fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}'+
  '#reflectPanel .fields input,#reflectPanel .fields select{width:100%;box-sizing:border-box}'+
  '#reflectPanel .ai{white-space:pre-wrap;line-height:1.7;font-size:15px;border:2px dashed var(--nb-ink,#1C1C1C);border-radius:12px;padding:12px 14px;margin-top:10px;background:var(--surface)}'+
  '#reflectPanel .ai small{display:block;margin-top:8px;color:var(--ink-2);font-size:12.5px}'+
  '#reflectPanel .log{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:10px}'+
  '#reflectPanel .log li{border:2px solid var(--nb-ink,#1C1C1C);border-radius:12px;padding:10px 12px;background:var(--surface);font-size:14px;line-height:1.6}'+
  '#reflectPanel .log li h3{margin:0 0 4px;font-size:15.5px}#reflectPanel .log dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:2px 10px}#reflectPanel .log dt{font-weight:800;white-space:nowrap}#reflectPanel .log dd{margin:0;white-space:pre-wrap}'+
  '#reflectPanel .msg{min-height:1.4em;font-weight:700;margin-top:8px}'+
  '@media (max-width:900px){#reflectPanel .rp-grid{grid-template-columns:1fr}#reflectPanel .rp-col{display:contents}#reflectPanel .rp-grid>.rp-col:first-child>.card:first-child{order:0}#reflectPanel #rpForm{order:1}#reflectPanel .rp-grid>.rp-col:first-child>.card:nth-child(2){order:3}#reflectPanel .rp-grid>.rp-col:first-child>.card:nth-child(3){order:2}#reflectPanel .rp-grid>.rp-col:last-child>.card:last-child{order:4}}'+
  '@media (max-width:560px){#reflectPanel .fields{grid-template-columns:repeat(2,minmax(0,1fr))}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var today=ymdOf(new Date());
  box.innerHTML=
  '<div class="rp-grid">'+
    '<div class="rp-col">'+
      '<div class="card"><span class="k">나이스 시간표</span><h2>📅 오늘의 역사 수업</h2>'+
        '<div class="row" style="margin-top:6px"><input type="date" id="rpDate" value="'+dash(today)+'" aria-label="날짜"><button class="btn ghost" type="button" id="rpLoad">불러오기</button></div>'+
        '<ul class="slots" id="rpSlots"></ul><p class="meta" id="rpSlotMsg">불러오는 중…</p>'+
        '<p class="meta" style="margin-top:6px">수업을 누르면 「수업 성찰 쓰기」 칸에 날짜·반·교시가 채워집니다.</p></div>'+
      '<div class="card"><span class="k">앞으로 3주</span><h2>🗓 학사 일정</h2><ul class="events" id="rpEvents"></ul><p class="meta" id="rpEvMsg"></p></div>'+
      '<div class="card"><span class="k">Gemini가 함께 봐요</span><h2>💡 다음 수업 개선안</h2>'+
        '<p class="meta">저장한 성찰(최근 15개)을 읽고 되풀이되는 점과 바로 해 볼 개선안 3가지를 제안합니다. 「수업 성찰 쓰기」에서 고른 수업을 먼저 봅니다.</p>'+
        '<div class="row" style="margin-top:8px"><button class="btn" type="button" id="rpAI">개선안 받기</button></div><div id="rpAIOut"></div></div>'+
    '</div>'+
    '<div class="rp-col">'+
      '<form class="card" id="rpForm"><span class="k">수업이 끝나면 3분</span><h2>📝 수업 성찰 쓰기</h2>'+
        '<div class="fields"><div><label class="f" for="rpD">날짜</label><input type="date" id="rpD" value="'+dash(today)+'"></div>'+
        '<div><label class="f" for="rpC">반</label><input id="rpC" placeholder="2-3"></div>'+
        '<div><label class="f" for="rpP">교시</label><input id="rpP" inputmode="numeric" placeholder="3"></div>'+
        '<div><label class="f" for="rpL">수업</label><select id="rpL">'+LESSONS.map(function(l){return '<option>'+esc(l)+'</option>';}).join('')+'</select></div></div>'+
        '<label class="f" for="rpGood">😊 좋았던 점</label><textarea id="rpGood" maxlength="2000" placeholder="예) 월 분류 활동에서 거의 모든 학생이 참여했다"></textarea>'+
        '<label class="f" for="rpWeak">🤔 부족한 점</label><textarea id="rpWeak" maxlength="2000" placeholder="예) 레닌과 스탈린 차이를 설명할 시간이 모자랐다"></textarea>'+
        '<label class="f" for="rpChange">🔁 다음에 바꿀 것</label><textarea id="rpChange" maxlength="2000" placeholder="예) 비교표를 먼저 보여 주고 활동 시작"></textarea>'+
        '<label class="f" for="rpIdea">✨ 수업 아이디어 메모</label><textarea id="rpIdea" maxlength="1500" placeholder="떠오른 아이디어를 짧게. 아래 「활동으로 다듬기」를 누르면 45분 활동안으로 바꿔 줍니다."></textarea>'+
        '<div class="row" style="margin-top:12px"><button class="btn" type="submit" id="rpSave">시트에 저장</button><button class="btn ghost" type="button" id="rpIdeaAI">아이디어 → 활동으로 다듬기</button></div>'+
        '<div class="msg" id="rpMsg" role="status"></div><div id="rpIdeaOut"></div></form>'+
      '<div class="card"><div class="row" style="justify-content:space-between"><div><span class="k">지난 기록</span><h2>📚 성찰 모아 보기</h2></div><button class="btn ghost" type="button" id="rpRefresh">새로 고침</button></div>'+
        '<ul class="log" id="rpLog"></ul><p class="meta" id="rpLogMsg">불러오는 중…</p></div>'+
    '</div>'+
  '</div>';

  /* ---- 나이스 ---- */
  function loadNeis(){
    var y=$('#rpDate').value.replace(/-/g,''); if(!/^\d{8}$/.test(y)) return;
    $('#rpSlots').innerHTML=''; $('#rpSlotMsg').hidden=false; $('#rpSlotMsg').textContent='나이스에서 불러오는 중…'; $('#rpEvents').innerHTML=''; $('#rpEvMsg').textContent='';
    post({action:'neisToday',ymd:y}).then(function(r){
      if(!r.ok){ $('#rpSlotMsg').textContent=emsg(r.error); return; }
      if(!r.lessons.length){ $('#rpSlotMsg').textContent=pretty(y)+'에는 역사 수업이 없어요.'; }
      else { $('#rpSlotMsg').hidden=true;
        $('#rpSlots').innerHTML=r.lessons.map(function(l){ return '<li><button type="button" aria-pressed="false" data-c="'+esc(l.cls)+'" data-p="'+l.period+'"><b>'+l.period+'교시</b>'+esc(l.cls)+'반 · '+esc(l.subject)+'</button></li>'; }).join(''); }
      $('#rpEvents').innerHTML=r.events.slice(0,12).map(function(e){ return '<li><span>'+pretty(e.ymd)+'</span>'+esc(e.name)+'</li>'; }).join('');
      $('#rpEvMsg').textContent=r.events.length?'':'3주 안에 학사 일정이 없어요.';
    }).catch(function(){ $('#rpSlotMsg').textContent='나이스를 불러오지 못했어요. 인터넷을 확인해 주세요.'; });
  }
  $('#rpLoad').onclick=loadNeis; $('#rpDate').onchange=loadNeis;
  $('#rpSlots').onclick=function(e){ var b=e.target.closest('button'); if(!b) return;
    [].forEach.call(box.querySelectorAll('#rpSlots button'),function(x){ x.setAttribute('aria-pressed',x===b); });
    $('#rpD').value=$('#rpDate').value; $('#rpC').value=b.dataset.c; $('#rpP').value=b.dataset.p; $('#rpGood').focus(); };

  /* ---- 성찰 저장·목록 ---- */
  function form(){ return {date:$('#rpD').value,cls:$('#rpC').value.trim(),period:$('#rpP').value.trim(),lesson:$('#rpL').value,good:$('#rpGood').value.trim(),weak:$('#rpWeak').value.trim(),change:$('#rpChange').value.trim(),idea:$('#rpIdea').value.trim()}; }
  var DRAFT='rp-draft';
  try{ var d=JSON.parse(localStorage.getItem(DRAFT)||'null'); if(d){ ['Good','Weak','Change','Idea'].forEach(function(k){ if(d[k.toLowerCase()]) $('#rp'+k).value=d[k.toLowerCase()]; }); } }catch(e){}
  $('#rpForm').addEventListener('input',function(){ try{ localStorage.setItem(DRAFT,JSON.stringify(form())); }catch(e){} });
  $('#rpForm').onsubmit=function(e){
    e.preventDefault(); var f=form(), m=$('#rpMsg');
    if(!(f.good||f.weak||f.change||f.idea)){ m.style.color='#B3261E'; m.textContent=emsg('empty'); return; }
    $('#rpSave').disabled=true; m.style.color=''; m.textContent='저장하는 중…';
    f.action='reflect';
    post(f).then(function(r){
      if(!r.ok){ m.style.color='#B3261E'; m.textContent=emsg(r.error); return; }
      m.style.color='var(--nb-teal,#0A6E6A)'; m.textContent='✓ 시트 「수업 성찰」에 저장했어요 ('+r.timestamp+')';
      ['Good','Weak','Change','Idea'].forEach(function(k){ $('#rp'+k).value=''; }); try{ localStorage.removeItem(DRAFT); }catch(e){}
      loadLog();
    }).catch(function(){ m.style.color='#B3261E'; m.textContent='저장하지 못했어요. 쓴 내용은 이 기기에 남아 있으니 다시 눌러 주세요.'; })
      .then(function(){ $('#rpSave').disabled=false; });
  };
  function loadLog(){
    $('#rpLogMsg').hidden=false; $('#rpLogMsg').textContent='불러오는 중…';
    post({action:'reflections'}).then(function(r){
      if(!r.ok){ $('#rpLogMsg').textContent=emsg(r.error); return; }
      if(!r.rows.length){ $('#rpLogMsg').textContent='아직 저장한 성찰이 없어요.'; $('#rpLog').innerHTML=''; return; }
      $('#rpLogMsg').hidden=true;
      var L=[['좋았던 점','good'],['부족한 점','weak'],['바꿀 것','change'],['아이디어','idea']];
      $('#rpLog').innerHTML=r.rows.map(function(x){
        return '<li><h3>'+esc(x.date)+' · '+esc(x.cls)+'반 '+esc(x.period)+(x.period?'교시':'')+' · '+esc(x.lesson)+'</h3><dl>'+
          L.filter(function(l){ return x[l[1]]; }).map(function(l){ return '<dt>'+l[0]+'</dt><dd>'+esc(x[l[1]])+'</dd>'; }).join('')+'</dl></li>';
      }).join('');
    }).catch(function(){ $('#rpLogMsg').textContent='기록을 불러오지 못했어요.'; });
  }
  $('#rpRefresh').onclick=loadLog;

  /* ---- Gemini ---- */
  function aiBox(el,text){ el.innerHTML='<div class="ai">'+esc(text)+'<small>AI 제안입니다. 역사적 사실은 교과서로 다시 확인하세요.</small></div>'; }
  function busy(b,on,t){ b.disabled=on; if(on){ b.dataset.t=b.textContent; b.textContent=t; } else if(b.dataset.t) b.textContent=b.dataset.t; }
  $('#rpAI').onclick=function(){ var b=this, out=$('#rpAIOut'); busy(b,true,'생각하는 중… (10초쯤)'); out.innerHTML='';
    post({action:'reflectAI',lesson:$('#rpL').value}).then(function(r){ if(r.ok) aiBox(out,r.text); else out.innerHTML='<p class="msg" style="color:#B3261E">'+esc(emsg(r.error))+'</p>'; })
      .catch(function(){ out.innerHTML='<p class="msg" style="color:#B3261E">AI에 연결하지 못했어요.</p>'; }).then(function(){ busy(b,false); }); };
  $('#rpIdeaAI').onclick=function(){ var b=this, out=$('#rpIdeaOut'), idea=$('#rpIdea').value.trim();
    if(!idea){ $('#rpMsg').style.color='#B3261E'; $('#rpMsg').textContent='아이디어 메모 칸을 먼저 써 주세요.'; $('#rpIdea').focus(); return; }
    busy(b,true,'다듬는 중… (10초쯤)'); out.innerHTML='';
    post({action:'ideaAI',idea:idea,lesson:$('#rpL').value}).then(function(r){ if(r.ok) aiBox(out,r.text); else out.innerHTML='<p class="msg" style="color:#B3261E">'+esc(emsg(r.error))+'</p>'; })
      .catch(function(){ out.innerHTML='<p class="msg" style="color:#B3261E">AI에 연결하지 못했어요.</p>'; }).then(function(){ busy(b,false); }); };

  loadNeis(); loadLog();
})();
