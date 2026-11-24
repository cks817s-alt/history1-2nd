/* =====================================================================
   역사 수업실 · 실시간 수업 연결 (학생 화면)
   - 선생님이 「수업 진행판」에서 연 수업 방(입장 코드 4자리)에 연결
   - ✋ 질문 있어요(손 들기), 선생님 타이머 표시
   - 활동 확인: 지금 보는 단계·이 페이지를 보고 있는지·마지막 조작 시각만 보냄
     (다른 프로그램·화면 내용·입력한 글자는 보내지 않음)
   - 시연 모드(?demo=1): 집계에서 빠지고, 제출은 저장되지 않음
   서버: Firebase 실시간 DB (yeoksa-auction-2611) live/{코드}
   아래 FB_CONFIG 는 Firebase 웹 앱 설정값으로, 공개되어도 되는 값입니다
   (접근은 보안 규칙 database.rules.json 의 live/ 부분이 막습니다).
   ===================================================================== */
(function(){
  if (window.__liveLoaded) return; window.__liveLoaded = true;
  var FB_CONFIG = {"apiKey":"AIzaSyCw0V5GuG3y9_ab9E2FZzpgb6uFKZKktYM","authDomain":"yeoksa-auction-2611.firebaseapp.com","databaseURL":"https://yeoksa-auction-2611-default-rtdb.asia-southeast1.firebasedatabase.app","projectId":"yeoksa-auction-2611","appId":"1:595310104230:web:f16fbe92c309a1db46ee67"};
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var TEACHER = !!window.LIVE_TEACHER;

  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=function(){ rej(new Error('load '+src)); }; document.head.appendChild(s); }); }
  function ss(k,v){ try{ if(v===undefined) return sessionStorage.getItem(k); if(v===null) sessionStorage.removeItem(k); else sessionStorage.setItem(k,v); }catch(e){ return null; } }
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return null; } }

  /* ---------------- 공통: Firebase 연결 ---------------- */
  var Core = window.LiveCore = {
    ready: null, db: null, uid: null, offset: 0,
    init: function(){
      if (this.ready) return this.ready;
      var self = this;
      this.ready = loadScript(SDK+'firebase-app-compat.js')
        .then(function(){ return Promise.all([loadScript(SDK+'firebase-auth-compat.js'), loadScript(SDK+'firebase-database-compat.js')]); })
        .then(function(){
          var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FB_CONFIG);
          self.db = firebase.database(app);
          self.db.ref('.info/serverTimeOffset').on('value', function(s){ self.offset = s.val() || 0; });
          return new Promise(function(res, rej){
            var off = firebase.auth(app).onAuthStateChanged(function(u){ if(u){ off(); self.uid = u.uid; res(u.uid); } });
            firebase.auth(app).signInAnonymously().catch(rej);
          });
        });
      return this.ready;
    },
    now: function(){ return Date.now() + this.offset; },
    ref: function(p){ return this.db.ref(p); },
    // 페이지 → 수업 이름 (교사 화면과 같은 목록)
    PAGES: [
      ['ww1/','1차시 · 제1차 세계 대전'], ['russian-revolution/','1차시+ · 유럽의 정치 체제 변화'],
      ['ww2-background/','2차시 · 제2차 세계 대전의 배경'], ['ww2-process/','3차시 · 제2차 세계 대전의 전개'],
      ['war-crimes/','4차시 · 전쟁 범죄'], ['peace/','5차시 · 인권 회복과 평화'],
      ['national-movements/','6차시 · 민족 운동'], ['cold-war/','7차시 · 냉전 체제의 형성'],
      ['concepts/','개념 학습실'], ['world-timeline/','세계사 타임라인 지구본']
    ],
    pageKey: function(){ var m = location.pathname.match(/\/([a-z0-9-]+)\/(index\.html)?$/); return m ? m[1]+'/' : ''; },
    pageName: function(k){ k = k || this.pageKey(); for (var i=0;i<this.PAGES.length;i++) if (this.PAGES[i][0]===k) return this.PAGES[i][1]; return k || '수업 목록'; }
  };
  if (TEACHER) return;            // 교사 화면은 여기까지(연결 기능만) 사용

  /* ---------------- 학생 화면 ---------------- */
  var params = new URLSearchParams(location.search);
  var urlCode = (params.get('live')||'').replace(/\D/g,'').slice(0,4);
  var DEMO = params.get('demo')==='1' || ss('live-demo')==='1';
  if (DEMO) ss('live-demo','1');
  var sess = (function(){ try{ return JSON.parse(ss('live-sess')||'null'); }catch(e){ return null; } })();
  if (urlCode && (!sess || sess.code!==urlCode)) sess = null;

  var css = ''+
  '.lv-chip{position:fixed;left:12px;bottom:60px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;font:700 13.5px/1.2 "Nanum Gothic","Noto Sans KR",system-ui,sans-serif;padding:8px 13px;border-radius:999px;border:2px solid #1C1C1C;background:#fff;color:#1C1C1C;box-shadow:2px 2px 0 #1C1C1C;cursor:pointer;min-height:40px}'+
  '.lv-chip i{width:9px;height:9px;border-radius:50%;background:#9aa3a0;display:inline-block}'+
  '.lv-chip.on i{background:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.25)}'+
  '.lv-chip.demo{background:#F3E1F7}'+
  '.lv-hand{position:fixed;left:12px;z-index:2147483000;font:800 15px/1.2 "Nanum Gothic","Noto Sans KR",system-ui,sans-serif;padding:10px 16px;border-radius:14px;border:2px solid #1C1C1C;background:#FFE45C;color:#1C1C1C;box-shadow:3px 3px 0 #1C1C1C;cursor:pointer;min-height:46px}'+
  '.lv-hand[aria-pressed="true"]{background:#0A6E6A;color:#fff;animation:lvwave 1.2s ease-in-out infinite}'+
  '@keyframes lvwave{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}'+
  '.lv-timer{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483001;display:none;align-items:center;gap:10px;font:400 26px/1 "Do Hyeon","Nanum Gothic",system-ui,sans-serif;padding:8px 18px;border-radius:14px;border:2px solid #1C1C1C;background:#fff;color:#1C1C1C;box-shadow:3px 3px 0 #1C1C1C;pointer-events:none;max-width:calc(100vw - 24px)}'+
  '.lv-timer.on{display:inline-flex}'+
  '.lv-timer small{font:700 13px/1.2 "Nanum Gothic","Noto Sans KR",sans-serif;color:#4A4A4A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw}'+
  '.lv-timer .bar{position:absolute;left:0;bottom:0;height:4px;background:#0A6E6A;border-radius:0 0 12px 12px}'+
  '.lv-timer.warn{background:#FFE45C}.lv-timer.end{background:#B3261E;color:#fff;animation:lvpulse .8s ease-in-out 6}.lv-timer.end small{color:#fff}'+
  '.lv-timer.pause{opacity:.85}'+
  '@keyframes lvpulse{50%{transform:translateX(-50%) scale(1.06)}}'+
  '.lv-bg{position:fixed;inset:0;z-index:2147483002;background:rgba(20,20,20,.6);display:flex;align-items:center;justify-content:center;padding:16px}'+
  '.lv-box{width:min(100%,380px);background:#FBFBF8;color:#1C1C1C;border:2px solid #1C1C1C;border-radius:18px;box-shadow:5px 5px 0 #1C1C1C;padding:22px;font:400 15px/1.6 "Nanum Gothic","Noto Sans KR",system-ui,sans-serif}'+
  '.lv-box h2{margin:0 0 4px;font:400 26px/1.2 "Do Hyeon","Nanum Gothic",sans-serif}'+
  '.lv-box p{margin:0 0 12px;color:#4A4A4A;font-size:14px}'+
  '.lv-box label{display:block;font-weight:700;font-size:13.5px;margin:8px 0 4px}'+
  '.lv-box input{width:100%;box-sizing:border-box;font:inherit;font-size:17px;padding:9px 12px;border:2px solid #1C1C1C;border-radius:10px;background:#fff;color:#1C1C1C}'+
  '.lv-box input.code{font:400 30px/1 "Do Hyeon",monospace;letter-spacing:.3em;text-align:center}'+
  '.lv-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
  '.lv-btns{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}'+
  '.lv-btns button{flex:1;font:800 15px/1 "Nanum Gothic",sans-serif;min-height:46px;border-radius:10px;border:2px solid #1C1C1C;cursor:pointer;background:#fff;color:#1C1C1C}'+
  '.lv-btns button.go{background:#0A6E6A;color:#fff;box-shadow:3px 3px 0 #1C1C1C}'+
  '.lv-msg{min-height:1.4em;margin-top:8px;font-weight:700;color:#B3261E;font-size:14px}'+
  '.lv-note{font-size:12.5px;color:#4A4A4A;background:#F4F4EE;border-radius:10px;padding:8px 10px;margin-top:12px;line-height:1.55}'+
  '.lv-toast{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:2147483003;background:#1C1C1C;color:#FFE45C;font:700 14.5px/1.4 "Nanum Gothic",sans-serif;padding:10px 16px;border-radius:12px;max-width:calc(100vw - 32px);text-align:center}'+
  '@media print{.lv-chip,.lv-hand,.lv-timer{display:none!important}}'+
  '@media (prefers-reduced-motion:reduce){.lv-hand[aria-pressed="true"],.lv-timer.end{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  if (!document.querySelector('link[href*="Do+Hyeon"]') && !document.querySelector('link[href*="theme.css"]')) {
    var lf = document.createElement('link'); lf.rel='stylesheet'; lf.href='https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Nanum+Gothic:wght@400;700;800&display=swap'; document.head.appendChild(lf);
  }

  var chip = document.createElement('button'); chip.type='button'; chip.className='lv-chip'; chip.innerHTML='<i></i><span>🔗 수업 연결</span>';
  var hand = document.createElement('button'); hand.type='button'; hand.className='lv-hand'; hand.hidden=true; hand.setAttribute('aria-pressed','false'); hand.textContent='✋ 질문 있어요';
  var tm = document.createElement('div'); tm.className='lv-timer'; tm.setAttribute('role','timer'); tm.setAttribute('aria-live','off');
  tm.innerHTML='<span class="t">0:00</span><small></small><span class="bar"></span>';
  function mount(){ document.body.appendChild(chip); document.body.appendChild(hand); document.body.appendChild(tm); place(); }
  // 「← 수업 목록」 버튼 위에 쌓기
  function place(){
    var back = document.querySelector('a[aria-label="수업 목록으로"]'), base = 12;
    if (back) { var r = back.getBoundingClientRect(); base = Math.max(12, innerHeight - r.top + 8); }
    chip.style.bottom = base+'px';
    hand.style.bottom = (base + 48)+'px';
  }
  addEventListener('resize', place);

  function toast(t){ var d=document.createElement('div'); d.className='lv-toast'; d.textContent=t; document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 2600); }

  /* ---------- 입장 창 ---------- */
  function openJoin(prefill){
    var bg = document.createElement('div'); bg.className='lv-bg';
    var cls = ls('pc-class')||'', num = ls('pc-num')||'', name = ls('pc-name')||'';
    bg.innerHTML = '<form class="lv-box" role="dialog" aria-label="수업 연결">'+
      '<h2>🔗 수업에 연결하기</h2>'+
      (DEMO ? '<p><b>학생 시연 모드</b>입니다. 이 기기는 집계에서 빠지고, 제출은 저장되지 않아요.</p>'
            : '<p>선생님 화면의 <b>입장 코드 4자리</b>를 넣으면 손 들기와 타이머를 쓸 수 있어요.</p>')+
      '<label for="lvCode">입장 코드</label><input class="code" id="lvCode" inputmode="numeric" maxlength="4" autocomplete="off" value="'+(prefill||'')+'">'+
      (DEMO ? '' :
      '<div class="lv-row"><div><label for="lvCls">학반</label><input id="lvCls" placeholder="예) 2-3" autocomplete="off"></div><div><label for="lvNum">번호</label><input id="lvNum" inputmode="numeric" placeholder="예) 15" autocomplete="off"></div></div>'+
      '<label for="lvName">이름</label><input id="lvName" autocomplete="off" placeholder="이름">')+
      '<div class="lv-msg" id="lvMsg" role="alert"></div>'+
      '<div class="lv-btns"><button type="button" data-x>나중에</button><button type="submit" class="go">연결하기</button></div>'+
      (DEMO ? '' : '<div class="lv-note">연결되면 선생님 화면에 <b>지금 보는 단계</b>, <b>이 수업 페이지를 보고 있는지</b>, <b>마지막으로 조작한 시각</b>이 보여요. 다른 프로그램이나 내가 쓴 글자는 보내지 않아요. 수업 페이지를 닫으면 연결이 끝나요.</div>')+
      '</form>';
    document.body.appendChild(bg);
    var f = bg.querySelector('form');
    if (!DEMO){ f.querySelector('#lvCls').value=cls; f.querySelector('#lvNum').value=num; f.querySelector('#lvName').value=name; }
    (prefill ? (DEMO ? f.querySelector('#lvCode') : f.querySelector(name?'#lvCode':'#lvName')) : f.querySelector('#lvCode')).focus();
    bg.querySelector('[data-x]').onclick = function(){ bg.remove(); };
    f.onsubmit = function(e){
      e.preventDefault();
      var code = f.querySelector('#lvCode').value.replace(/\D/g,''), msg = f.querySelector('#lvMsg');
      var me = DEMO ? {cls:'시연', num:'0', name:'시연 기기'} :
        {cls:f.querySelector('#lvCls').value.trim(), num:f.querySelector('#lvNum').value.trim(), name:f.querySelector('#lvName').value.trim()};
      if (code.length!==4){ msg.textContent='입장 코드 4자리를 넣어 주세요.'; return; }
      if (!me.cls || !me.num || !me.name){ msg.textContent='학반, 번호, 이름을 모두 써 주세요.'; return; }
      if (!DEMO){ ls('pc-class',me.cls); ls('pc-num',me.num); ls('pc-name',me.name); }
      msg.style.color='#4A4A4A'; msg.textContent='연결하는 중…';
      join(code, me).then(function(){ bg.remove(); toast(DEMO?'시연 기기로 연결했어요.':'수업에 연결했어요! 궁금하면 ✋ 질문 있어요를 누르세요.'); })
        .catch(function(err){ msg.style.color='#B3261E'; msg.textContent = err && err.message==='noroom' ? '그런 수업 방이 없어요. 코드를 다시 확인해 주세요.' : '연결하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.'; });
    };
  }

  /* ---------- 연결 ---------- */
  var room = null, offs = [], timerData = null, tick = null;
  function join(code, me){
    return Core.init().then(function(){ return Core.ref('live/'+code+'/meta').get(); }).then(function(s){
      var m = s.val();
      if (!m || m.closed || (Core.now() - (m.createdAt||0)) > 12*3600*1000) throw new Error('noroom');
      leave(true);
      room = {code:code, me:me, meta:m};
      ss('live-sess', JSON.stringify({code:code, cls:me.cls, num:me.num, name:me.name}));
      chip.classList.add('on'); chip.classList.toggle('demo',DEMO);
      chip.querySelector('span').textContent = DEMO ? '시연 모드 · '+code : '연결됨 · '+(m.cls||'')+' '+code;
      hand.hidden = DEMO; place();
      // 타이머
      var tr = Core.ref('live/'+code+'/timer'); var h1 = tr.on('value', function(x){ timerData = x.val(); drawTimer(); });
      offs.push(function(){ tr.off('value',h1); });
      // 방이 닫히면 끊기
      var mr = Core.ref('live/'+code+'/meta/closed'); var h2 = mr.on('value', function(x){ if (x.val()){ toast('선생님이 수업 방을 닫았어요.'); leave(); } });
      offs.push(function(){ mr.off('value',h2); });
      // 내 손 상태
      var hr = Core.ref('live/'+code+'/hands/'+Core.uid); var h3 = hr.on('value', function(x){ hand.setAttribute('aria-pressed', !!x.val()); hand.textContent = x.val() ? '✋ 손 들었어요 (누르면 내리기)' : '✋ 질문 있어요'; });
      offs.push(function(){ hr.off('value',h3); });
      hr.onDisconnect().remove();
      Presence.start();
    });
  }
  function leave(silent){
    offs.forEach(function(f){ f(); }); offs=[];
    if (room && Core.db){ Core.ref('live/'+room.code+'/hands/'+Core.uid).remove().catch(function(){}); Presence.stop(); }
    room=null; timerData=null; drawTimer();
    chip.classList.remove('on'); chip.querySelector('span').textContent='🔗 수업 연결'; hand.hidden=true;
    if (!silent) ss('live-sess',null);
  }
  chip.onclick = function(){
    if (!room) { openJoin(urlCode||''); return; }
    if (confirm('수업 연결을 끊을까요?')) leave();
  };
  hand.onclick = function(){
    if (!room) return;
    var r = Core.ref('live/'+room.code+'/hands/'+Core.uid);
    if (hand.getAttribute('aria-pressed')==='true') r.remove();
    else r.set({name:room.me.name, cls:room.me.cls, num:String(room.me.num), page:Core.pageName(), at:firebase.database.ServerValue.TIMESTAMP});
  };

  /* ---------- 타이머 표시 ---------- */
  function fmt(ms){ var s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2); }
  function drawTimer(){
    clearInterval(tick); tick=null;
    var d = timerData;
    if (!d || d.state==='idle'){ tm.classList.remove('on','warn','end','pause'); return; }
    tm.querySelector('small').textContent = d.label || '';
    function upd(){
      var left = d.state==='run' ? d.endsAt - Core.now() : d.left;
      tm.classList.add('on'); tm.classList.toggle('pause', d.state==='pause');
      tm.querySelector('.t').textContent = left>0 ? fmt(left) : '시간 끝!';
      tm.querySelector('.bar').style.width = (d.dur ? Math.max(0,Math.min(1,left/d.dur))*100 : 0)+'%';
      tm.classList.toggle('warn', left>0 && left<=10000);
      if (left<=0){ tm.classList.add('end'); clearInterval(tick); tick=null; setTimeout(function(){ if(timerData===d) tm.classList.remove('on'); }, 8000); }
      else tm.classList.remove('end');
    }
    upd(); if (d.state==='run') tick = setInterval(upd, 250);
  }

  /* ---------- 활동 확인 (지금 보는 단계·보고 있는지·마지막 조작) ---------- */
  var Presence = (function(){
    var hb=null, poll=null, lastAct=Date.now(), away=0, lastStep='', ref=null;
    function step(){
      var el = document.querySelector('.steps a.on') || document.querySelector('[role=tab][aria-selected="true"]') || document.querySelector('.tab[aria-selected="true"]') || document.querySelector('nav .active, nav [aria-current]');
      var t = el ? el.textContent.replace(/\s+/g,' ').trim() : '';
      return t.slice(0,30);
    }
    function send(){
      if (!room || !ref) return;
      ref.set({name:room.me.name, cls:room.me.cls, num:String(room.me.num), page:Core.pageName(), step:step(),
               vis:!document.hidden, act:lastAct+Core.offset, away:away, demo:DEMO, at:firebase.database.ServerValue.TIMESTAMP}).catch(function(){});
    }
    function onAct(){ lastAct = Date.now(); }
    function onVis(){ if (document.hidden) away++; send(); }
    return {
      start: function(){
        ref = Core.ref('live/'+room.code+'/presence/'+Core.uid);
        ref.onDisconnect().remove();
        ['pointerdown','keydown','scroll','input','touchstart'].forEach(function(ev){ addEventListener(ev,onAct,{passive:true,capture:true}); });
        document.addEventListener('visibilitychange', onVis);
        send(); hb = setInterval(send, 15000);
        poll = setInterval(function(){ var s=step(); if (s!==lastStep){ lastStep=s; send(); } }, 3000);
      },
      stop: function(){
        clearInterval(hb); clearInterval(poll);
        document.removeEventListener('visibilitychange', onVis);
        if (ref){ ref.remove().catch(function(){}); ref.onDisconnect().cancel(); ref=null; }
      }
    };
  })();

  /* ---------- 시연 모드: 제출을 저장하지 않음 ---------- */
  if (DEMO && window.fetch){
    var of = window.fetch.bind(window);
    window.fetch = function(url, opt){
      try{
        if (String(url).indexOf('script.google.com/macros')>-1 && opt && opt.body){
          var b = JSON.parse(opt.body);
          if (/^submit/.test(b.action||'') || b.action==='artVote'){
            toast('시연 모드라서 제출은 저장되지 않았어요.');
            return Promise.resolve(new Response(JSON.stringify({ok:true, timestamp:'시연 모드 · 저장 안 함'}),{status:200,headers:{'Content-Type':'application/json'}}));
          }
        }
      }catch(e){}
      return of(url, opt);
    };
  }

  /* ---------- 시작 ---------- */
  function boot(){
    mount();
    if (DEMO) chip.classList.add('demo');
    if (sess){ join(sess.code, {cls:sess.cls, num:sess.num, name:sess.name}).catch(function(){ ss('live-sess',null); }); }
    else if (urlCode){ setTimeout(function(){ openJoin(urlCode); }, window.__lessonStartDelay || 600); }
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
