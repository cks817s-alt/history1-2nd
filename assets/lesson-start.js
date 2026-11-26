/* =====================================================================
   역사 수업실 · 수업 시작 화면
   수업 페이지에 들어오면 약 2초 동안 「탐구 노트」 표지가 펼쳐지며
   차시·단원·오늘의 학습 목표를 보여 줍니다.
   - 아무 곳이나 누르거나 아무 키나 누르면 바로 넘어갑니다.
   - 같은 수업은 브라우저 탭 하나에서 한 번만(새로 고침해도 다시 안 나옴).
     주소 끝에 ?start=1 을 붙이면 언제든 다시 볼 수 있습니다(프로젝터용).
   - 「동작 줄이기」 설정이면 움직임 없이 잠깐 보여 줍니다.
   ===================================================================== */
(function(){
  var LESSONS = {
    'ww1/':               {no:'1차시',  unit:'Ⅵ. 세계 대전과 사회 변동 · 01. 세계 대전과 국제 질서의 변화', title:'제1차 세계 대전이 일어나다',
                           goals:['제1차 세계 대전의 배경과 전개 과정을 설명할 수 있다.','제1차 세계 대전 이후 국제 질서를 파악할 수 있다.']},
    'russian-revolution/':{no:'1차시+', unit:'Ⅵ. 세계 대전과 사회 변동 · 01. 세계 대전과 국제 질서의 변화', title:'유럽 각국의 정치 체제가 변화하다',
                           goals:['러시아 혁명의 전개 과정을 설명할 수 있다.','제1차 세계 대전 이후 유럽의 정치적 변화를 파악할 수 있다.']},
    'ww2-background/':    {no:'2차시',  unit:'Ⅵ. 세계 대전과 사회 변동 · 01. 세계 대전과 국제 질서의 변화', title:'제2차 세계 대전이 일어나다 ① 배경',
                           goals:['대공황을 극복하려는 각국의 대응을 알 수 있다.']},
    'ww2-process/':       {no:'3차시',  unit:'Ⅵ. 세계 대전과 사회 변동 · 01. 세계 대전과 국제 질서의 변화', title:'제2차 세계 대전이 일어나다 ② 전개',
                           goals:['제2차 세계 대전의 전개 과정과 결과를 설명할 수 있다.']},
    'war-crimes/':        {no:'4차시',  unit:'Ⅵ. 세계 대전과 사회 변동 · 02. 전쟁 범죄에 맞선 평화 유지 노력', title:'두 차례 세계 대전 중에 전쟁 범죄가 발생하다',
                           goals:['세계 대전 중에 일어난 대량 학살의 내용을 설명할 수 있다.','세계 대전 중에 벌어진 인권 침해의 실상을 파악할 수 있다.']},
    'peace/':             {no:'5차시',  unit:'Ⅵ. 세계 대전과 사회 변동 · 02. 전쟁 범죄에 맞선 평화 유지 노력', title:'인권 회복과 평화 실현을 위해 노력하다',
                           goals:['국제 사회가 인권 회복을 위해 펼친 활동을 이해할 수 있다.','평화를 실현하기 위한 여러 가지 노력을 설명할 수 있다.']},
    'national-movements/':{no:'6차시',  unit:'Ⅵ. 세계 대전과 사회 변동 · 03. 아시아와 아프리카의 민족 운동', title:'아시아와 아프리카에서 민족 운동이 일어나다',
                           goals:['3·1 운동과 5·4 운동의 관련성을 파악할 수 있다.','제1차 세계 대전 이후 인도와 동남아시아에서 전개된 민족 운동을 설명할 수 있다.','제1차 세계 대전 이후 서아시아와 아프리카에서 전개된 민족 운동을 설명할 수 있다.']},
    'cold-war/':          {no:'7차시',  unit:'Ⅶ. 현대 세계의 전개와 과제 · 01. 냉전 체제와 제3 세계의 형성', title:'냉전 체제가 형성되다',
                           goals:['냉전 체제의 대립 구도를 살펴볼 수 있다.','냉전의 전개에 따라 세계에서 벌어진 현상을 파악할 수 있다.']},
    'third-world/':       {no:'8차시',  unit:'Ⅶ. 현대 세계의 전개와 과제 · 01. 냉전 체제와 제3 세계의 형성', title:'제3 세계가 나타나다',
                           goals:['제3 세계가 나타난 배경을 파악할 수 있다.','제3 세계의 등장이 세계정세에 미친 영향을 설명할 수 있다.']}
  };
  var m = location.pathname.match(/\/([a-z0-9-]+)\/(index\.html)?$/);
  var key = m ? m[1]+'/' : '';
  var L = LESSONS[key]; if (!L) return;
  var force = /[?&]start=1\b/.test(location.search);
  var SK = 'lesson-start-'+key;
  try { if (!force && sessionStorage.getItem(SK)) return; sessionStorage.setItem(SK,'1'); } catch(e) {}

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD = 2400;                          // 표지가 열린 뒤 목표를 보여 주는 시간(ms)
  window.__lessonStartDelay = HOLD + 1800;    // 수업 연결 창은 이 뒤에 뜸

  if (!document.querySelector('link[href*="Do+Hyeon"]')) {
    var lf=document.createElement('link'); lf.rel='stylesheet';
    lf.href='https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Gaegu:wght@700&family=Nanum+Gothic:wght@400;700;800&display=swap';
    (document.head||document.documentElement).appendChild(lf);
  }
  var css=''+
  '#lsIntro{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:16px;cursor:pointer;'+
    'background-color:#FBFBF8;background-image:linear-gradient(rgba(10,110,106,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(10,110,106,.09) 1px,transparent 1px);background-size:24px 24px;'+
    'font-family:"Nanum Gothic","Noto Sans KR",system-ui,sans-serif;color:#1C1C1C;transition:opacity .45s ease,visibility .45s}'+
  '#lsIntro.out{opacity:0;visibility:hidden}'+
  '#lsIntro .bk{position:relative;width:min(92vw,620px);perspective:1600px}'+
  '#lsIntro .pg{position:relative;background:#fff;border:3px solid #1C1C1C;border-radius:6px 18px 18px 6px;box-shadow:6px 6px 0 #1C1C1C;padding:28px 28px 26px 44px;min-height:320px;box-sizing:border-box;'+
    'background-image:repeating-linear-gradient(#fff 0 33px,#E3EEF0 33px 34px);background-position:0 70px}'+
  '#lsIntro .pg::before{content:"";position:absolute;left:24px;top:0;bottom:0;width:2px;background:#F1A3A3}'+
  '#lsIntro .cv{position:absolute;inset:0;border:3px solid #1C1C1C;border-radius:6px 18px 18px 6px;background:#0A6E6A;color:#fff;transform-origin:left center;'+
    'display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:28px 32px 28px 44px;box-sizing:border-box;backface-visibility:hidden;'+
    'animation:lsOpen .8s cubic-bezier(.6,.05,.3,1) .3s forwards;box-shadow:inset 14px 0 0 rgba(0,0,0,.18)}'+
  '#lsIntro .cv .lab{background:#fff;color:#1C1C1C;border:3px solid #1C1C1C;border-radius:10px;padding:10px 16px;font:400 clamp(22px,5vw,32px)/1.2 "Do Hyeon",sans-serif;box-shadow:3px 3px 0 #1C1C1C}'+
  '#lsIntro .cv small{margin-top:14px;font:700 clamp(17px,3.6vw,22px)/1.2 "Gaegu",cursive;color:#FFE45C}'+
  '@keyframes lsOpen{to{transform:rotateY(-160deg)}}'+
  '#lsIntro .kick{font:700 clamp(17px,3.4vw,21px)/1.2 "Gaegu",cursive;color:#0A6E6A;margin:0}'+
  '#lsIntro h1,#lsIntro li,#lsIntro .cv small{word-break:keep-all}#lsIntro h1{margin:6px 0 4px;font:400 clamp(26px,6vw,40px)/1.2 "Do Hyeon",sans-serif;letter-spacing:-.01em}'+
  '#lsIntro h1 b{font-weight:400;background:linear-gradient(transparent 58%,#FFE45C 58%)}'+
  '#lsIntro .unit{margin:0 0 14px;font-size:14px;font-weight:700;color:#4A4A4A}'+
  '#lsIntro .gl{margin:0;font:400 18px/1.2 "Do Hyeon",sans-serif;color:#0A6E6A}'+
  '#lsIntro ol{margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px}'+
  '#lsIntro li{display:flex;gap:10px;font-size:clamp(15px,3.4vw,17px);line-height:1.55;font-weight:700;opacity:0;transform:translateY(6px);}#lsIntro.open li{animation:lsIn .4s ease forwards}'+
  '#lsIntro li i{flex:none;font-style:normal;width:26px;height:26px;border-radius:50%;background:#0A6E6A;color:#fff;display:grid;place-items:center;font:400 15px/1 "Do Hyeon",sans-serif;margin-top:1px}'+
  '@keyframes lsIn{to{opacity:1;transform:none}}'+
  '#lsIntro .skip{position:absolute;right:16px;bottom:14px;font-size:13px;color:#4A4A4A;font-weight:700}'+
  '#lsIntro .bar{position:absolute;left:0;right:0;bottom:0;height:5px;background:#0A6E6A;transform-origin:left;transform:scaleX(0)}#lsIntro.open .bar{animation:lsBar linear forwards}'+
  '@keyframes lsBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}'+
  '@media (max-width:560px){#lsIntro .pg{padding:22px 18px 40px 36px;min-height:0}#lsIntro .pg::before{left:18px}#lsIntro .cv{padding:22px 20px 22px 36px}}'+
  '@media (prefers-reduced-motion:reduce){#lsIntro .cv{display:none}#lsIntro li,#lsIntro.open li{opacity:1;transform:none;animation:none}#lsIntro{transition:none}}';
  var st=document.createElement('style'); st.textContent=css; (document.head||document.documentElement).appendChild(st);

  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var d=document.createElement('div'); d.id='lsIntro'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','수업 시작: '+L.title);
  d.innerHTML='<div class="bk"><div class="pg">'+
    '<p class="kick">오늘의 수업을 시작합니다 · '+esc(L.no)+'</p>'+
    '<h1><b>'+esc(L.title)+'</b></h1><p class="unit">'+esc(L.unit)+'</p>'+
    '<p class="gl">◎ 오늘의 학습 목표</p><ol>'+L.goals.map(function(g,i){ return '<li style="animation-delay:'+(reduce?0:i*.15)+'s"><i>'+(i+1)+'</i><span>'+esc(g)+'</span></li>'; }).join('')+'</ol>'+
    '<span class="bar" style="animation-duration:'+HOLD+'ms"></span></div>'+
    '<div class="cv" aria-hidden="true"><span class="lab">역사 탐구 노트</span><small>'+esc(L.no)+' · '+esc(L.title)+'</small></div></div>'+
    '<span class="skip">누르면 바로 시작 ▶</span>';
  document.documentElement.appendChild(d);

  var done=false, t=null, cv=d.querySelector('.cv');
  function opened(){ if(d.classList.contains('open')) return; d.classList.add('open'); t=setTimeout(close, HOLD); }
  if (reduce) opened(); else { cv.addEventListener('animationend', opened); setTimeout(opened, 4000); }
  function close(){
    if(done) return; done=true; clearTimeout(t);
    d.classList.add('out');
    removeEventListener('keydown',close,true);
    setTimeout(function(){ d.remove(); }, 500);
  }
  d.addEventListener('click',close);
  addEventListener('keydown',close,true);
})();
