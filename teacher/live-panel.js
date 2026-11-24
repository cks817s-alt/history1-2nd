/* =====================================================================
   교사 화면 · 수업 진행판 (노트북용)
   - 수업 방 열기(입장 코드 4자리 + 학생용 QR), 수업 화면 띄우기, 태블릿 시연 QR
   - 타이머(선생님만 조작) · 손 든 학생 · 학생 활동 현황
   서버: Firebase 실시간 DB live/{코드}  (assets/live.js 의 LiveCore 사용)
   ===================================================================== */
(function(){
  var Core = window.LiveCore;
  var BASE = location.href.replace(/teacher\/.*$/, '');
  var box = document.getElementById('livePanel');
  function $(s){ return box.querySelector(s); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }
  function fmt(ms){ var s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2); }
  function ago(ms){ var s=Math.max(0,Math.round(ms/1000)); return s<60? s+'초 전' : Math.floor(s/60)+'분 전'; }

  var css = ''+
  '#livePanel .lp-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px;align-items:start}'+
  '#livePanel .lp-col{display:grid;gap:16px;min-width:0}'+
  '#livePanel h2{margin:0 0 4px;font-size:22px}'+
  '#livePanel .k{font-family:"Gaegu",cursive;font-weight:700;font-size:18px;color:var(--nb-teal,#0A6E6A)}'+
  '#livePanel .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'+
  '#livePanel .code{font-family:"Do Hyeon",sans-serif;font-size:64px;line-height:1;letter-spacing:.12em;margin:6px 0}'+
  '#livePanel .room-h{display:flex;gap:18px;align-items:center;flex-wrap:wrap}'+
  '#livePanel .qr{width:150px;height:150px;background:#fff;border:2px solid #1C1C1C;border-radius:12px;padding:8px;flex:none}'+
  '#livePanel .qr img,#livePanel .qr canvas{width:100%!important;height:100%!important}'+
  '#livePanel .meta{font-size:14px;color:var(--ink-2)}'+
  '#livePanel .tm-big{font-family:"Do Hyeon",sans-serif;font-size:72px;line-height:1;text-align:center;margin:8px 0;font-variant-numeric:tabular-nums}'+
  '#livePanel .tm-big.warn{color:#B3261E}'+
  '#livePanel .tm-bar{height:10px;border:2px solid var(--nb-ink,#1C1C1C);border-radius:999px;overflow:hidden;margin-bottom:12px}'+
  '#livePanel .tm-bar i{display:block;height:100%;background:var(--nb-teal,#0A6E6A);transition:width .25s linear}'+
  '#livePanel .pre button{min-width:62px}'+
  '#livePanel .hands{list-style:none;margin:0;padding:0;display:grid;gap:8px}'+
  '#livePanel .hands li{display:flex;align-items:center;gap:10px;border:2px solid var(--nb-ink,#1C1C1C);border-radius:12px;padding:10px 12px;background:#FFF3B0;color:#1C1C1C}'+
  '#livePanel .hands li b{font-size:17px}#livePanel .hands li span{font-size:13px;color:#4A4A4A;flex:1}'+
  '#livePanel .cnt{display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:999px;background:#B3261E;color:#fff;font-weight:900;font-size:15px;padding:0 8px;margin-left:6px}'+
  '#livePanel .cnt.zero{background:var(--surface-2);color:var(--ink-2)}'+
  '#livePanel .sum{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}'+
  '#livePanel .sum span{font-size:14px;font-weight:800;border:2px solid var(--nb-ink,#1C1C1C);border-radius:10px;padding:4px 10px}'+
  '#livePanel .seats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}'+
  '#livePanel .seat{border:2px solid var(--nb-ink,#1C1C1C);border-radius:12px;padding:8px 10px;background:var(--surface);font-size:13.5px;line-height:1.45;position:relative}'+
  '#livePanel .seat b{font-size:15.5px}#livePanel .seat .s{display:block;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '#livePanel .seat .tag{display:inline-block;font-size:12px;font-weight:900;border-radius:6px;padding:0 6px;margin-top:2px}'+
  '#livePanel .st-ok{background:#D7EFEC}#livePanel .st-ok .tag{background:#0A6E6A;color:#fff}'+
  '#livePanel .st-idle{background:#FFF3B0}#livePanel .st-idle .tag{background:#8a6d00;color:#fff}'+
  '#livePanel .st-away{background:#FBE3E1}#livePanel .st-away .tag{background:#B3261E;color:#fff}'+
  '#livePanel .st-off{opacity:.55;border-style:dashed}#livePanel .st-off .tag{background:#777;color:#fff}'+
  '#livePanel .seat.hand::after{content:"✋";position:absolute;right:6px;top:4px;font-size:18px}'+
  '#livePanel .seats.blur b.nm{filter:blur(6px)}'+
  ':root[data-theme="dark"] #livePanel .st-ok,:root[data-theme="dark"] #livePanel .st-idle,:root[data-theme="dark"] #livePanel .st-away{color:#1C1C1C}:root[data-theme="dark"] #livePanel .seat .s{color:#4A4A4A}'+
  '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) #livePanel .st-ok,:root:not([data-theme="light"]) #livePanel .st-idle,:root:not([data-theme="light"]) #livePanel .st-away{color:#1C1C1C}:root:not([data-theme="light"]) #livePanel .seat .s{color:#4A4A4A}}'+
  '#livePanel .two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'+
  '#livePanel .dev{border:2px dashed var(--nb-ink,#1C1C1C);border-radius:12px;padding:12px;font-size:14px}'+
  '#livePanel .dev b{display:block;font-size:16px}'+
  '#livePanel .demo-on{font-size:13px;font-weight:800;color:var(--nb-teal,#0A6E6A)}'+
  '#livePanel .bigqr{position:fixed;inset:0;z-index:60;background:rgba(20,20,20,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#fff;text-align:center;padding:16px;cursor:zoom-out}'+
  '#livePanel .bigqr .q{width:min(70vmin,520px);height:min(70vmin,520px);background:#fff;border-radius:18px;padding:14px}'+
  '#livePanel .bigqr .q img,#livePanel .bigqr .q canvas{width:100%!important;height:100%!important}'+
  '#livePanel .bigqr b{font-family:"Do Hyeon",sans-serif;font-weight:400;font-size:clamp(26px,5vw,44px)}'+
  '#livePanel .bigqr .c{font-family:"Do Hyeon",sans-serif;font-size:clamp(40px,9vw,90px);letter-spacing:.15em;line-height:1}'+
  '#livePanel .flash{animation:lpflash 1s ease-in-out 3}@keyframes lpflash{50%{box-shadow:0 0 0 6px #FFE45C}}'+
  '@media (max-width:900px){#livePanel .lp-grid{grid-template-columns:1fr}}'+
  '@media (max-width:560px){#livePanel .code{font-size:48px}#livePanel .tm-big{font-size:56px}#livePanel .two{grid-template-columns:1fr}#livePanel .qr{width:120px;height:120px}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var CLASSES=['2-1','2-2','2-3','2-4','2-5'];
  box.innerHTML =
  '<div class="card" id="lpSetup">'+
    '<span class="k">수업 시작 전에</span><h2>🎛 수업 방 열기</h2>'+
    '<p class="meta">반과 수업을 고르고 방을 열면 입장 코드와 QR이 생깁니다. 학생이 수업 페이지 왼쪽 아래 「🔗 수업 연결」에 코드를 넣거나 QR을 찍으면 손 들기·타이머·활동 현황이 연결됩니다.</p>'+
    '<div class="row" style="margin-top:10px"><select id="lpCls" aria-label="반">'+CLASSES.map(function(c){return '<option>'+c+'</option>';}).join('')+'<option value="">직접 입력</option></select>'+
    '<input id="lpClsX" placeholder="예) 3-2" style="width:90px" hidden>'+
    '<select id="lpPage" aria-label="수업">'+Core.PAGES.map(function(p){return '<option value="'+p[0]+'">'+esc(p[1])+'</option>';}).join('')+'</select>'+
    '<button class="btn" type="button" id="lpOpen">수업 방 열기</button></div>'+
    '<div class="msg" id="lpMsg"></div>'+
  '</div>'+
  '<div id="lpRoom" hidden>'+
    '<div class="lp-grid">'+
      '<div class="lp-col">'+
        '<div class="card"><div class="room-h"><div class="qr" id="lpQr" title="눌러서 크게 보기"></div><div style="flex:1;min-width:180px">'+
          '<span class="k">입장 코드</span><div class="code" id="lpCode">----</div><div class="meta" id="lpInfo"></div>'+
          '<div class="row" style="margin-top:10px"><button class="btn" type="button" id="lpBig">학생용 QR 크게</button><button class="btn ghost" type="button" id="lpClose">방 닫기</button></div>'+
        '</div></div></div>'+
        '<div class="card"><span class="k">교사 기기 2대로 수업하기</span><h2>💻 노트북 + 📱 태블릿</h2>'+
          '<div class="two" style="margin-top:8px">'+
            '<div class="dev"><b>💻 노트북 (지금 이 화면)</b>수업 진행판을 켜 두고, 수업 화면은 새 창으로 열어 프로젝터(확장 화면)로 보냅니다.<div class="row" style="margin-top:8px"><button class="btn" type="button" id="lpPresent">수업 화면 띄우기</button></div></div>'+
            '<div class="dev"><b>📱 태블릿 (학생 시연)</b>아래 QR을 찍으면 <b>학생 시연 모드</b>로 열립니다. 학생처럼 직접 해 보이되, 집계에서 빠지고 제출은 저장되지 않아요.<div class="row" style="margin-top:8px"><button class="btn ghost" type="button" id="lpDemoQr">시연용 QR 보기</button></div><div class="demo-on" id="lpDemoSt"></div></div>'+
          '</div></div>'+
        '<div class="card"><div class="row" style="justify-content:space-between"><div><span class="k">누가 따라오고 있나요?</span><h2>👀 학생 활동 현황</h2></div><label style="font-size:14px;font-weight:700"><input type="checkbox" id="lpHide"> 이름 가리기</label></div>'+
          '<div class="sum" id="lpSum"></div><div class="seats" id="lpSeats"></div>'+
          '<p class="meta" style="margin-top:10px">초록 = 이 수업 페이지에서 활동 중 · 노랑 = 페이지는 열려 있지만 1분 넘게 멈춤 · 빨강 = 다른 탭이나 앱으로 나감 · 점선 = 연결 끊김. 학생 화면은 15초마다, 그리고 단계가 바뀌거나 화면을 떠날 때 바로 알려 옵니다. 다른 프로그램의 내용이나 쓴 글은 보이지 않습니다.</p>'+
        '</div>'+
      '</div>'+
      '<div class="lp-col">'+
        '<div class="card"><span class="k">선생님만 조작해요</span><h2>⏱ 타이머</h2>'+
          '<div class="tm-big" id="lpTm">0:00</div><div class="tm-bar"><i id="lpTmBar" style="width:0"></i></div>'+
          '<div class="row pre">'+[1,2,3,5,10].map(function(m){return '<button class="btn ghost" type="button" data-min="'+m+'">'+m+'분</button>';}).join('')+'<input id="lpMin" type="number" min="1" max="90" placeholder="분" style="width:70px" aria-label="분 직접 입력"></div>'+
          '<div class="row" style="margin-top:8px"><input id="lpLabel" placeholder="무엇을 하는 시간? (예: 활동 2)" maxlength="20" style="flex:1;min-width:140px"></div>'+
          '<div class="row" style="margin-top:10px"><button class="btn" type="button" id="lpStart">시작</button><button class="btn ghost" type="button" id="lpPause">일시 정지</button><button class="btn ghost" type="button" id="lpPlus">+1분</button><button class="btn ghost" type="button" id="lpReset">끄기</button></div>'+
          '<p class="meta" style="margin-top:8px">학생 화면 위쪽 가운데에 같은 시간이 함께 줄어듭니다.</p>'+
        '</div>'+
        '<div class="card" id="lpHandCard"><span class="k">질문 있어요</span><h2>✋ 손 든 학생 <span class="cnt zero" id="lpHandN">0</span></h2>'+
          '<ul class="hands" id="lpHands"></ul><p class="meta" id="lpHandEmpty">아직 손 든 학생이 없어요.</p>'+
          '<div class="row" style="margin-top:8px"><button class="btn ghost" type="button" id="lpHandAll">모두 내리기</button><label style="font-size:14px;font-weight:700"><input type="checkbox" id="lpBeep" checked> 알림음</label></div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';

  /* ---------- QR ---------- */
  var qrLib = null;
  function needQr(){ if (qrLib) return qrLib; qrLib = new Promise(function(res,rej){ var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); return qrLib; }
  function drawQr(el, text){ needQr().then(function(){ el.innerHTML=''; new QRCode(el,{text:text,width:512,height:512,correctLevel:QRCode.CorrectLevel.M}); }).catch(function(){ el.textContent='QR을 만들지 못했어요'; }); }
  function bigQr(title, text, code){
    var d=document.createElement('div'); d.className='bigqr'; d.setAttribute('role','dialog');
    d.innerHTML='<b>'+esc(title)+'</b><div class="q"></div><div class="c">'+esc(code)+'</div><small>'+esc(text)+'</small><small>화면을 누르면 닫힙니다</small>';
    box.appendChild(d); drawQr(d.querySelector('.q'), text);
    d.onclick=function(){ d.remove(); };
  }

  /* ---------- 방 ---------- */
  var R=null, offs=[], timer=null, hands={}, pres={}, prevHands=0;
  function link(demo){ return BASE+R.page+'?live='+R.code+(demo?'&demo=1':''); }
  $('#lpCls').onchange=function(){ $('#lpClsX').hidden=!!this.value; };
  $('#lpOpen').onclick=function(){
    var btn=this, cls=$('#lpCls').value||$('#lpClsX').value.trim(), page=$('#lpPage').value;
    if(!cls){ $('#lpMsg').textContent='반을 써 주세요.'; return; }
    btn.disabled=true; $('#lpMsg').textContent='';
    Core.init().then(function(){ return tryCreate(cls,page,0); })
      .then(function(code){ R={code:code,cls:cls,page:page}; ls('lp-room',JSON.stringify(R)); showRoom(); })
      .catch(function(){ $('#lpMsg').textContent='방을 열지 못했어요. 인터넷 연결을 확인해 주세요.'; })
      .then(function(){ btn.disabled=false; });
  };
  function tryCreate(cls,page,n){
    if(n>8) return Promise.reject(new Error('full'));
    var code=String(1000+Math.floor(Math.random()*9000));
    return Core.ref('live/'+code+'/meta').transaction(function(cur){
      if(cur && !cur.closed && Core.now()-(cur.createdAt||0) < 12*3600*1000) return; // 사용 중
      if(cur && cur.teacher!==Core.uid) return; // 남의 옛 방은 덮지 않음
      return {teacher:Core.uid, cls:cls, page:page, createdAt:Core.now(), closed:false};
    }).then(function(r){ return r.committed ? code : tryCreate(cls,page,n+1); });
  }
  $('#lpClose').onclick=function(){
    if(!R || !confirm('수업 방을 닫을까요? 학생들의 연결이 끊깁니다.')) return;
    var code=R.code;
    Core.ref('live/'+code+'/meta/closed').set(true).catch(function(){});
    // meta 는 교사만 고칠 수 있으니 closed 만 바꾸고, 나머지 자료는 지운다
    Core.ref('live/'+code+'/meta').update({closed:true});
    Core.ref('live/'+code+'/timer').set({state:'idle'});
    Core.ref('live/'+code+'/hands').remove(); Core.ref('live/'+code+'/presence').remove();
    stopRoom(); R=null; ls('lp-room',null); $('#lpRoom').hidden=true; $('#lpSetup').hidden=false;
  };
  $('#lpBig').onclick=function(){ if(R) bigQr('휴대폰 카메라로 찍어 수업에 연결하세요', link(false), R.code); };
  $('#lpDemoQr').onclick=function(){ if(R) bigQr('📱 태블릿 · 학생 시연 모드', link(true), R.code); };
  $('#lpPresent').onclick=function(){ if(R) window.open(link(true),'lessonScreen','noopener'); };
  $('#lpQr').onclick=function(){ $('#lpBig').click(); };
  $('#lpHide').onchange=function(){ $('#lpSeats').classList.toggle('blur',this.checked); };

  function showRoom(){
    $('#lpSetup').hidden=true; $('#lpRoom').hidden=false;
    $('#lpCode').textContent=R.code;
    $('#lpInfo').innerHTML=esc(R.cls)+'반 · '+esc(Core.pageName(R.page));
    drawQr($('#lpQr'), link(false));
    stopRoom();
    var tr=Core.ref('live/'+R.code+'/timer'), hr=Core.ref('live/'+R.code+'/hands'), pr=Core.ref('live/'+R.code+'/presence');
    var a=tr.on('value',function(s){ timer=s.val(); drawTimer(); });
    var b=hr.on('value',function(s){ hands=s.val()||{}; drawHands(); drawSeats(); });
    var c=pr.on('value',function(s){ pres=s.val()||{}; drawSeats(); });
    offs.push(function(){ tr.off('value',a); hr.off('value',b); pr.off('value',c); });
    var iv=setInterval(drawSeats,5000); offs.push(function(){ clearInterval(iv); });
  }
  function stopRoom(){ offs.forEach(function(f){ f(); }); offs=[]; clearInterval(tTick); }

  /* ---------- 타이머 ---------- */
  var tTick=null, chosen=0;
  box.querySelectorAll('[data-min]').forEach(function(b){ b.onclick=function(){ chosen=+b.dataset.min*60000; $('#lpMin').value=b.dataset.min; box.querySelectorAll('[data-min]').forEach(function(x){ x.setAttribute('aria-pressed',x===b); }); if(!timer||timer.state==='idle') preview(); }; });
  $('#lpMin').oninput=function(){ chosen=Math.max(0,Math.min(90,+this.value||0))*60000; if(!timer||timer.state==='idle') preview(); };
  function preview(){ $('#lpTm').textContent=fmt(chosen); $('#lpTmBar').style.width='100%'; }
  function tset(v){ if(R) return Core.ref('live/'+R.code+'/timer').set(v); }
  $('#lpStart').onclick=function(){
    var dur=chosen||(timer&&timer.dur)||0; if(!dur){ alert('몇 분인지 먼저 골라 주세요.'); return; }
    tset({state:'run', dur:dur, endsAt:Core.now()+dur, label:$('#lpLabel').value.trim()});
  };
  $('#lpPause').onclick=function(){
    if(!timer) return;
    if(timer.state==='run') tset({state:'pause', dur:timer.dur, left:Math.max(0,timer.endsAt-Core.now()), label:timer.label||''});
    else if(timer.state==='pause') tset({state:'run', dur:timer.dur, endsAt:Core.now()+timer.left, label:timer.label||''});
  };
  $('#lpPlus').onclick=function(){
    if(!timer||timer.state==='idle') return;
    if(timer.state==='run') tset({state:'run', dur:timer.dur+60000, endsAt:Math.max(timer.endsAt,Core.now())+60000, label:timer.label||''});
    else tset({state:'pause', dur:timer.dur+60000, left:timer.left+60000, label:timer.label||''});
  };
  $('#lpReset').onclick=function(){ tset({state:'idle'}); };
  function drawTimer(){
    clearInterval(tTick); tTick=null;
    var t=timer; $('#lpPause').textContent = t&&t.state==='pause' ? '계속' : '일시 정지';
    if(!t||t.state==='idle'){ $('#lpTm').classList.remove('warn'); if(chosen) preview(); else { $('#lpTm').textContent='0:00'; $('#lpTmBar').style.width='0'; } return; }
    function upd(){ var left=t.state==='run'?t.endsAt-Core.now():t.left; $('#lpTm').textContent=left>0?fmt(left):'시간 끝!'; $('#lpTm').classList.toggle('warn',left<=10000);
      $('#lpTmBar').style.width=(t.dur?Math.max(0,Math.min(1,left/t.dur))*100:0)+'%'; if(left<=0){ clearInterval(tTick); tTick=null; } }
    upd(); if(t.state==='run') tTick=setInterval(upd,250);
  }

  /* ---------- 손 든 학생 ---------- */
  function beep(){ try{ var C=window.AudioContext||window.webkitAudioContext, c=new C(), o=c.createOscillator(), g=c.createGain(); o.frequency.value=880; g.gain.value=.08; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+.18); }catch(e){} }
  function drawHands(){
    var list=Object.keys(hands).map(function(k){ var h=hands[k]; h.uid=k; return h; }).sort(function(a,b){ return a.at-b.at; });
    var n=list.length; $('#lpHandN').textContent=n; $('#lpHandN').classList.toggle('zero',!n);
    $('#lpHandEmpty').hidden=!!n;
    $('#lpHands').innerHTML=list.map(function(h){ return '<li><b>'+esc(h.num)+'번 '+esc(h.name)+'</b><span>'+esc(h.cls)+' · '+ago(Core.now()-h.at)+'</span><button class="btn ghost" type="button" data-down="'+esc(h.uid)+'">확인</button></li>'; }).join('');
    if(n>prevHands){ if($('#lpBeep').checked) beep(); var c=$('#lpHandCard'); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
    prevHands=n;
    document.title = (n?'✋'+n+' · ':'')+'교사 확인·평가';
  }
  $('#lpHands').onclick=function(e){ var b=e.target.closest('[data-down]'); if(b&&R) Core.ref('live/'+R.code+'/hands/'+b.dataset.down).remove(); };
  $('#lpHandAll').onclick=function(){ if(R && Object.keys(hands).length && confirm('손 든 학생을 모두 내릴까요?')) Core.ref('live/'+R.code+'/hands').remove(); };

  /* ---------- 학생 활동 현황 ---------- */
  function status(p, now){
    if(now-(p.at||0) > 45000) return ['off','연결 끊김'];
    if(!p.vis) return ['away','다른 화면'];
    if(now-(p.act||0) > 60000) return ['idle','멈춤 '+ago(now-p.act).replace(' 전','')];
    return ['ok','활동 중'];
  }
  function drawSeats(){
    if(!R) return;
    var now=Core.now(), list=[], demo=0, cnt={ok:0,idle:0,away:0,off:0};
    Object.keys(pres).forEach(function(k){ var p=pres[k]; if(p.demo){ if(now-(p.at||0)<45000) demo++; return; } p.uid=k; p.s=status(p,now); cnt[p.s[0]]++; list.push(p); });
    list.sort(function(a,b){ return (a.cls+'').localeCompare(b.cls+'') || (+a.num||0)-(+b.num||0); });
    $('#lpSum').innerHTML='<span>연결 '+(list.length-cnt.off)+'명</span><span class="st-ok">활동 중 '+cnt.ok+'</span><span class="st-idle">멈춤 '+cnt.idle+'</span><span class="st-away">다른 화면 '+cnt.away+'</span>'+(cnt.off?'<span class="st-off">끊김 '+cnt.off+'</span>':'');
    $('#lpDemoSt').textContent = demo ? '✓ 시연 기기 '+demo+'대 연결됨' : '';
    $('#lpSeats').innerHTML = list.length ? list.map(function(p){
      return '<div class="seat st-'+p.s[0]+(hands[p.uid]?' hand':'')+'"><b>'+esc(p.num)+'번 <b class="nm">'+esc(p.name)+'</b></b>'+
        '<span class="s">'+esc(p.step||p.page||'')+'</span><span class="tag">'+esc(p.s[1])+'</span>'+(p.away?' <span class="tag" style="background:transparent;color:inherit;font-weight:700">나감 '+p.away+'번</span>':'')+'</div>';
    }).join('') : '<p class="meta">아직 연결한 학생이 없어요. 학생용 QR을 띄워 주세요.</p>';
  }

  /* ---------- 처음 ---------- */
  Core.init().then(function(){
    var saved=null; try{ saved=JSON.parse(ls('lp-room')||'null'); }catch(e){}
    if(!saved) return;
    return Core.ref('live/'+saved.code+'/meta').get().then(function(s){
      var m=s.val();
      if(m && !m.closed && m.teacher===Core.uid && Core.now()-(m.createdAt||0)<12*3600*1000){ R=saved; showRoom(); }
      else ls('lp-room',null);
    });
  }).catch(function(){ $('#lpMsg').textContent='실시간 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'; });
})();
