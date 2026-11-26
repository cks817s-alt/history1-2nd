/* 교과서 218~219쪽: 그림·지도·QR을 누르면 장면 재생기(확대·이동·표시 + 설명 + 흑백→컬러)가 열린다 */
(function () {
  // x,y = 그림 안 초점(%), z = 확대 배율, m = 표시 동그라미 [x,y,지름%]
  var SC = {
    mao: { kicker: '교과서 218쪽 사진', title: '중화 인민 공화국의 수립을 선포하는 마오쩌둥(1949)',
      img: 'img/tb/mao.jpg', color: 'img/tb/mao_c.jpg', ratio: 768 / 559, map: 'm-china',
      steps: [
        { x: 50, y: 50, z: 1, t: '1949년 10월 1일, 중국 베이징의 <b>톈안먼(천안문)</b> 성루. 여러 대의 마이크 앞에서 중요한 발표가 시작됩니다.' },
        { x: 58, y: 38, z: 2, m: [59, 25, 13], t: '가운데에서 원고를 읽는 사람이 공산당 지도자 <b>마오쩌둥</b>이에요. 지금 <b>중화 인민 공화국</b>의 수립을 선포하고 있어요.' },
        { x: 30, y: 35, z: 1.6, t: '중국에서는 <b>장제스</b>가 이끄는 <b>국민당</b>과 <b>마오쩌둥</b>이 이끄는 <b>공산당</b>이 전쟁을 벌였어요(<b>국공 내전</b>).' },
        { x: 70, y: 45, z: 1.35, t: '이 전쟁에서 승리한 마오쩌둥은 <b>중화 인민 공화국</b>을 수립하였어요(1949). 패배한 장제스의 국민당 정부는 <b>타이완</b>으로 옮겨 갔어요.' },
        { x: 50, y: 50, z: 1, t: '중국이 공산화되면서 <b>아시아에서도 냉전</b>이 본격화되었어요. 지도에서 「중국의 공산화(1949)」를 찾아보세요.' }
      ] },
    iron: { kicker: '교과서 218쪽 풍자화', title: '철의 장막 풍자화',
      img: 'img/tb/iron.jpg', color: 'img/tb/iron_c.jpg', ratio: 753 / 765, map: 'm-berlin',
      steps: [
        { x: 50, y: 50, z: 1, t: '1946년 영국 신문에 실린 풍자화예요. <b>유럽(EUROPE)</b>을 가로질러 거대한 벽이 길게 세워져 있어요.' },
        { x: 92, y: 8, z: 2.6, m: [95, 4, 9], t: '벽 너머 꼭대기에 <b>소련 국기</b>가 걸려 있어요. 벽 저편은 소련의 영향 아래 있는 지역이에요.' },
        { x: 68, y: 40, z: 1.7, m: [64, 36, 30], t: '벽에는 「NO ADMITTANCE BY ORDER JOE」, 곧 <b>「조(스탈린)의 명령에 따른 입장 금지」</b>라고 쓰여 있어요. ‘조’는 소련 지도자 스탈린을 부르던 별명이에요.' },
        { x: 70, y: 84, z: 2.3, m: [70, 82, 22], t: '벽 아래를 들춰 보는 사람은 영국의 <b>처칠</b>이에요. 벽 너머에서 무슨 일이 일어나는지 알 수 없어 엿보고 있어요.' },
        { x: 50, y: 50, z: 1, t: '<b>철의 장막</b>은 처칠이 소련의 <b>폐쇄적이고 비밀스러운 태도</b>를 비유하며 한 말이에요. 유럽은 이 장막을 사이에 두고 동서로 나뉘었어요.' }
      ] },
    inchon: { kicker: '교과서 218쪽 사진', title: '서울을 되찾고자 인천에 상륙한 국군과 국제 연합군(1950)',
      img: 'img/tb/inchon.jpg', color: 'img/tb/inchon_c.jpg', ratio: 863 / 610, map: 'm-korea',
      steps: [
        { x: 50, y: 50, z: 1, t: '1950년 9월, 인천 해안. 군인들이 물을 헤치며 바닷가로 올라오고 있어요.' },
        { x: 72, y: 35, z: 1.7, t: '<b>6·25 전쟁</b>이 일어나자 <b>자본주의 진영</b>의 국가들이 <b>국제 연합군</b>으로 참여하여 남한을 도왔어요.' },
        { x: 25, y: 55, z: 1.9, m: [22, 55, 26], t: '서울을 되찾고자 국군과 국제 연합군이 <b>인천 상륙 작전</b>에 성공하여 북으로 나아갔어요.' },
        { x: 50, y: 50, z: 1, t: '그러자 <b>중국군</b>이 참전하여 북한을 도왔어요. 이 전쟁으로 <b>동아시아에서 냉전이 더욱 심해졌어요.</b>' }
      ] },
    vietnam: { kicker: '교과서 219쪽 사진', title: '베트남 전쟁에 참여한 미군(1964)',
      img: 'img/tb/vietnam.jpg', color: 'img/tb/vietnam_c.jpg', ratio: 745 / 600, map: 'm-vietnam', video: 'vn',
      steps: [
        { x: 50, y: 50, z: 1, t: '베트남의 풀밭 위로 헬리콥터가 날고, 총을 든 <b>미군</b>이 걸어가고 있어요.' },
        { x: 38, y: 36, z: 2.1, m: [38, 36, 22], t: '하늘의 대형 수송 헬리콥터는 병사와 물자를 실어 날랐어요. 정글과 논이 많은 베트남에서 중요한 이동 수단이었어요.' },
        { x: 50, y: 65, z: 1.7, t: '공산주의 정권이 들어선 <b>북베트남</b>이 베트남 전체를 통일하려 하자, <b>공산주의의 확산</b>을 우려한 미국은 <b>남베트남</b>을 지원하였어요.' },
        { x: 50, y: 50, z: 1, t: '이후 여러 나라가 참전하며 베트남 전쟁은 <b>국제전</b>이 되었어요(우리나라도 국군을 파병했어요). 전쟁에서 <b>북베트남이 승리</b>하면서 베트남은 통일되었어요(1975).' }
      ] },
    cuba: { kicker: '교과서 219쪽 풍자화', title: '쿠바 미사일 사건 풍자화(1962)',
      img: 'img/tb/cuba.jpg', color: 'img/tb/cuba_c.jpg', ratio: 831 / 566, map: 'm-cuba',
      steps: [
        { x: 50, y: 50, z: 1, t: '1962년 <b>쿠바 미사일 위기</b>를 그린 풍자화예요. 두 사람이 팔씨름을 하고 있어요.' },
        { x: 32, y: 30, z: 2.1, m: [33, 23, 17], t: '왼쪽은 <b>소련 서기장 흐루쇼프</b>. 땀을 뻘뻘 흘리며 버티고 있어요.' },
        { x: 64, y: 26, z: 2.1, m: [60, 14, 15], t: '오른쪽은 <b>미국 대통령 케네디</b>. 두 사람 모두 물러서지 않고 힘을 겨뤄요.' },
        { x: 50, y: 78, z: 1.55, t: '두 사람은 각각 <b>핵무기</b>를 깔고 앉아 있어요. 하나라도 터지면 엄청난 피해가 생겨요.' },
        { x: 58, y: 56, z: 2.5, m: [58, 56, 9], t: '탁자 위의 스위치는 <b>상대가 앉아 있는 핵무기</b>와 이어져 있어요. 서로 상대의 핵무기 스위치를 누르려는 모습이에요.' },
        { x: 50, y: 50, z: 1, t: '소련이 쿠바에 <b>핵미사일 기지</b>를 세우려 하자 미국은 <b>쿠바 해상을 봉쇄</b>했어요. 세계는 <b>핵전쟁의 위기</b>에 처했지만, 소련이 미사일을 철수하기로 발표하여 전쟁은 일어나지 않았어요.' }
      ] },
    'm-berlin': { kicker: '냉전의 전개 지도', title: '베를린 장벽 설치(1961)', img: 'img/tb/map218.jpg', ratio: 1649 / 1133, go: 'iron',
      steps: [
        { x: 50, y: 50, z: 1, t: '지도에서 <b>노란색</b>은 소련과 그 동맹국, <b>초록색</b>은 미국과 그 동맹국(1977년 기준)이에요.' },
        { x: 18, y: 34, z: 3, m: [18.5, 34.8, 6], t: '독일의 <b>베를린</b>. 1961년 동독이 <b>베를린 장벽</b>을 세워 동베를린과 서베를린을 갈라놓았어요. 장벽은 냉전의 상징이 되었어요.' }
      ] },
    'm-china': { kicker: '냉전의 전개 지도', title: '중국의 공산화(1949)', img: 'img/tb/map218.jpg', ratio: 1649 / 1133, go: 'mao',
      steps: [
        { x: 50, y: 50, z: 1, t: '지도에서 <b>노란색</b>은 소련과 그 동맹국, <b>초록색</b>은 미국과 그 동맹국(1977년 기준)이에요.' },
        { x: 60, y: 48, z: 2.2, m: [60, 50, 16], t: '<b>중국</b>에서는 국공 내전에서 공산당이 승리하여 <b>중화 인민 공화국</b>이 수립되었어요(1949). 소련 옆의 거대한 나라가 공산 진영이 되었어요.' }
      ] },
    'm-korea': { kicker: '냉전의 전개 지도', title: '6·25 전쟁(1950~1953)', img: 'img/tb/map218.jpg', ratio: 1649 / 1133, go: 'inchon',
      steps: [
        { x: 50, y: 50, z: 1, t: '지도에서 <b>노란색</b>은 소련과 그 동맹국, <b>초록색</b>은 미국과 그 동맹국(1977년 기준)이에요.' },
        { x: 71, y: 49, z: 3, m: [71.5, 48, 6], t: '<b>한반도</b>. 광복 뒤 냉전의 영향으로 남북으로 갈라졌고, 소련의 지원을 받은 북한이 남한을 침략하여 <b>6·25 전쟁</b>이 일어났어요(1950).' }
      ] },
    'm-vietnam': { kicker: '냉전의 전개 지도', title: '베트남 전쟁(1964~1975)', img: 'img/tb/map218.jpg', ratio: 1649 / 1133, go: 'vietnam',
      steps: [
        { x: 50, y: 50, z: 1, t: '지도에서 <b>노란색</b>은 소련과 그 동맹국, <b>초록색</b>은 미국과 그 동맹국(1977년 기준)이에요.' },
        { x: 60, y: 64.5, z: 3, m: [61, 64.5, 6], t: '<b>베트남</b>. 북베트남과 미국의 지원을 받는 남베트남이 대립하다가 전쟁이 일어났어요(1964). 북베트남이 승리하여 베트남은 통일되었어요(1975).' }
      ] },
    'm-cuba': { kicker: '냉전의 전개 지도', title: '쿠바 미사일 위기(1962)', img: 'img/tb/map219.jpg', ratio: 1334 / 1200, go: 'cuba',
      steps: [
        { x: 50, y: 50, z: 1, t: '아메리카 대륙. <b>초록색</b>인 미국과 그 동맹국이 대부분을 차지하고 있어요.' },
        { x: 57, y: 55, z: 3, m: [56.5, 55.4, 6], t: '<b>쿠바</b>는 미국 플로리다에서 약 150km 떨어진 섬나라예요. 미국과 지리적으로 가까운 이곳에 소련이 <b>핵미사일 기지</b>를 세우려 하였어요.' }
      ] }
  };
  var VID = {
    kmt: { title: '국공 내전', kicker: '교과서 218쪽 QR 영상', src: 'https://viewer.vivasam.com/qrviewer/viewer.html?qrcode=106428_218p_56_ST' },
    vn: { title: '베트남 전쟁', kicker: '비바샘 영상 · 교과서 218~219쪽', src: 'https://www.vivasam.com/viewer/share/contentViewer?contentId=453635&contentGubun=CN030' }
  };

  var root, stage, layer, imgB, imgC, mark, textEl, dots, titleEl, kickEl, playBtn, colBtn, mapBtn, goBtn, vidBtn, frame, openA, note;
  var cur = null, step = 0, timer = null, playing = true, colorOk = {}, lastFocus = null;

  function build() {
    root = document.createElement('div');
    root.className = 'scp'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'scpT');
    root.innerHTML =
      '<div class="scp-box">' +
      ' <div class="scp-stage" title="누르면 흑백 ↔ 컬러"><div class="scp-layer"><img class="bw" alt=""><img class="col" alt=""><div class="scp-mark"></div></div><span class="scp-badge">AI 채색 · 실제 색과 다를 수 있어요</span></div>' +
      ' <iframe class="scp-video" title="수업 영상" allow="autoplay; fullscreen" allowfullscreen></iframe>' +
      ' <div class="scp-side">' +
      '  <div class="scp-top"><h3 id="scpT"><small></small><span></span></h3><button class="scp-x" type="button" aria-label="닫기">✕</button></div>' +
      '  <div class="scp-text" aria-live="polite"></div>' +
      '  <div class="scp-dots"></div>' +
      '  <div class="scp-ctl">' +
      '   <button type="button" class="scp-step" data-d="-1">◀ 이전</button><button type="button" class="scp-step pri" data-d="1">다음 ▶</button>' +
      '   <button type="button" class="scp-step scp-play">⏸ 멈춤</button><button type="button" class="scp-step scp-col">🎨 흑백으로</button>' +
      '   <button type="button" class="scp-map">🗺 지도에서 보기</button><button type="button" class="scp-go">🖼 그림 보기</button><button type="button" class="scp-vid">▶ 영상 보기</button>' +
      '   <a class="scp-open" target="_blank" rel="noopener">새 창에서 열기 ↗</a>' +
      '  </div>' +
      '  <p class="scp-note"></p>' +
      ' </div>' +
      '</div>';
    document.body.appendChild(root);
    stage = root.querySelector('.scp-stage'); layer = root.querySelector('.scp-layer');
    imgB = layer.querySelector('.bw'); imgC = layer.querySelector('.col'); mark = layer.querySelector('.scp-mark');
    textEl = root.querySelector('.scp-text'); dots = root.querySelector('.scp-dots');
    titleEl = root.querySelector('#scpT span'); kickEl = root.querySelector('#scpT small');
    playBtn = root.querySelector('.scp-play'); colBtn = root.querySelector('.scp-col');
    mapBtn = root.querySelector('.scp-map'); goBtn = root.querySelector('.scp-go'); vidBtn = root.querySelector('.scp-vid');
    frame = root.querySelector('.scp-video'); openA = root.querySelector('.scp-open'); note = root.querySelector('.scp-note');

    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    root.querySelector('.scp-x').onclick = close;
    root.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { stop(); go(step + (+b.dataset.d)); }; });
    playBtn.onclick = function () { playing ? stop() : (playing = true, playBtn.textContent = '⏸ 멈춤', schedule()); };
    colBtn.onclick = toggleColor; stage.onclick = toggleColor;
    mapBtn.onclick = function () { open(SC[cur].map); };
    goBtn.onclick = function () { open(SC[cur].go); };
    vidBtn.onclick = function () { openVideo(SC[cur].video); };
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && !root.classList.contains('vid')) { stop(); go(step + 1); }
      else if (e.key === 'ArrowLeft' && !root.classList.contains('vid')) { stop(); go(step - 1); }
    });
    window.addEventListener('resize', fit);
  }

  function fit() {
    if (!cur || !SC[cur]) return;
    var r = SC[cur].ratio, side = window.innerWidth > 820;
    var maxW = side ? Math.min(1180, window.innerWidth - 32) * 0.6 : window.innerWidth - 24;
    var maxH = side ? window.innerHeight - 80 : window.innerHeight * 0.48;
    var w = Math.min(maxW, maxH * r);
    stage.style.width = w + 'px'; stage.style.height = (w / r) + 'px';
  }

  function hasColor(s, cb) {
    if (!s.color) return cb(false);
    if (s.color in colorOk) return cb(colorOk[s.color]);
    var im = new Image();
    im.onload = function () { colorOk[s.color] = true; cb(true); };
    im.onerror = function () { colorOk[s.color] = false; cb(false); };
    im.src = s.color;
  }

  function setColor(on) {
    root.classList.toggle('color', on);
    colBtn.textContent = on ? '🎨 흑백으로' : '🎨 컬러로';
  }
  function toggleColor() { if (!colBtn.hidden) setColor(!root.classList.contains('color')); }

  function open(id) {
    var s = SC[id]; if (!s) return;
    if (!root) build();
    if (!root.classList.contains('on')) lastFocus = document.activeElement;
    cur = id; step = 0; playing = true; playBtn.textContent = '⏸ 멈춤';
    root.classList.remove('vid', 'color'); frame.src = 'about:blank';
    kickEl.textContent = s.kicker; titleEl.textContent = s.title;
    layer.style.transition = 'none'; layer.style.transform = 'none';
    imgB.src = s.img; imgB.alt = s.title; imgC.removeAttribute('src');
    mapBtn.hidden = !s.map; goBtn.hidden = !s.go; vidBtn.hidden = !s.video; openA.hidden = true;
    goBtn.textContent = s.go && SC[s.go].img.indexOf('map') < 0 ? '🖼 ' + (SC[s.go].kicker.indexOf('풍자화') >= 0 ? '풍자화' : '사진') + ' 보기' : '🖼 그림 보기';
    colBtn.hidden = true; note.textContent = '';
    hasColor(s, function (ok) {
      if (cur !== id) return;
      colBtn.hidden = !ok;
      if (ok) {
        imgC.src = s.color;
        note.textContent = '그림을 누르면 흑백과 컬러를 바꿔 볼 수 있어요. 컬러는 AI(Gemini)가 칠한 것이라 실제 색과 다를 수 있어요.';
        setTimeout(function () { if (cur === id && step === 0) setColor(true); }, 1100);
      }
    });
    dots.innerHTML = s.steps.map(function (_, i) { return '<button type="button" aria-label="' + (i + 1) + '번째 설명"></button>'; }).join('');
    dots.querySelectorAll('button').forEach(function (b, i) { b.onclick = function () { stop(); go(i); }; });
    root.classList.add('on'); document.body.style.overflow = 'hidden';
    fit();
    requestAnimationFrame(function () { layer.style.transition = ''; go(0); });
    root.querySelector('.scp-x').focus({ preventScroll: true });
  }

  function go(i) {
    var s = SC[cur]; if (!s) return;
    step = Math.max(0, Math.min(s.steps.length - 1, i));
    var st = s.steps[step], z = st.z || 1;
    var tx = clamp(50 - st.x * z, 100 - 100 * z, 0), ty = clamp(50 - st.y * z, 100 - 100 * z, 0);
    layer.style.setProperty('--z', z);
    layer.style.transform = 'translate(' + tx + '%,' + ty + '%) scale(' + z + ')';
    if (st.m) {
      mark.style.left = st.m[0] + '%'; mark.style.top = st.m[1] + '%';
      mark.style.width = st.m[2] + '%'; mark.style.height = (st.m[2] * s.ratio) + '%';
      mark.classList.remove('on'); void mark.offsetWidth; mark.classList.add('on');
    } else mark.classList.remove('on');
    textEl.innerHTML = '<p>' + st.t + '</p>';
    dots.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === step); });
    schedule();
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function schedule() {
    clearTimeout(timer);
    if (!playing || !cur || !SC[cur]) return;
    if (step >= SC[cur].steps.length - 1) { playing = false; playBtn.textContent = '▶ 다시 재생'; playBtn.onclick = replay; return; }
    timer = setTimeout(function () { go(step + 1); }, 5600);
  }
  function replay() { playBtn.onclick = function () { playing ? stop() : (playing = true, playBtn.textContent = '⏸ 멈춤', schedule()); }; playing = true; playBtn.textContent = '⏸ 멈춤'; go(0); }
  function stop() { playing = false; clearTimeout(timer); playBtn.textContent = '▶ 자동 재생'; }

  function openVideo(id) {
    var v = VID[id]; if (!v) return;
    if (!root) build();
    if (!root.classList.contains('on')) lastFocus = document.activeElement;
    stop(); cur = 'video';
    root.classList.add('on', 'vid'); root.classList.remove('color');
    document.body.style.overflow = 'hidden';
    kickEl.textContent = v.kicker; titleEl.textContent = v.title;
    textEl.innerHTML = '<p>영상이 보이지 않으면 <b>새 창에서 열기</b>를 눌러 주세요.</p>';
    mapBtn.hidden = goBtn.hidden = vidBtn.hidden = colBtn.hidden = true;
    openA.hidden = false; openA.href = v.src; note.textContent = '출처: 비상교육 비바샘';
    frame.src = v.src;
    root.querySelector('.scp-x').focus({ preventScroll: true });
  }

  function close() {
    if (!root) return;
    stop(); root.classList.remove('on', 'vid', 'color'); frame.src = 'about:blank';
    document.body.style.overflow = ''; cur = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-scene],[data-video]');
    if (!b || (root && root.contains(b))) return;
    e.preventDefault();
    if (b.dataset.scene) open(b.dataset.scene); else openVideo(b.dataset.video);
  });
  window.TBSpread = { open: open, video: openVideo, scenes: SC, videos: VID };
})();
