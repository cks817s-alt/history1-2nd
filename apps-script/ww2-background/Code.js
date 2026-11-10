/**
 * 1차시 「제2차 세계 대전의 배경」 수업 서버 (구글 시트에 연결된 Apps Script 웹 앱)
 *
 * 하는 일
 *  - submit : 학생 탐구 결과를 '제출' 시트에 한 줄씩 기록
 *  - chat   : 무솔리니·히틀러 반박 토론 챗봇 (제미나이 API 키는 서버에만 보관)
 *  - polish : 채팅 내용을 반박 글로 다듬기
 *  - auth   : 교사 비밀번호 확인
 *  - list   : 교사 화면에 제출 현황 불러오기 (비밀번호 필요)
 *
 * 설정은 시트 상단 메뉴 [📚 수업 설정]에서 합니다. (API 키·비밀번호는 코드에 적지 않습니다)
 */

var SHEET_NAME = '제출';
var HEADERS = ['제출일시', '학반', '번호', '이름', '탐구1(㉠답안)', '파시즘특징', '나치즘특징',
  '탐구2(전체주의특징종합)', '반박관점', '탐구3(전체주의반박글)', '챗봇토론기록'];
var FIELDS = ['timestamp', 'className', 'studentNumber', 'studentName', 'q1Answer', 'q2Fascism', 'q2Nazism',
  'q2Combined', 'stance', 'q3Rebuttal', 'chatTranscript'];
var DEFAULT_MODELS = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-flash-latest'];
var LAST_AI_ERROR = '';
var AI_TRACE = [];
var PERSONAS = {
  mussolini: '이탈리아 파시즘 독재자 무솔리니',
  hitler: '독일 나치즘 독재자 히틀러',
  both: '무솔리니와 히틀러 두 사람'
};

/* ---------------- 시트 메뉴 (교사용 설정) ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📚 수업 설정')
    .addItem('① 제미나이 API 키 입력', 'menuSetApiKey')
    .addItem('② 교사 비밀번호 설정', 'menuSetPassword')
    .addItem('③ 연결 상태 점검', 'menuCheck')
    .addToUi();
}

function menuSetApiKey() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('제미나이 API 키 입력',
    'aistudio.google.com/apikey 에서 발급한 키를 붙여 넣으세요.\n(키는 이 스크립트의 속성에만 저장되고 학생 화면에는 보이지 않습니다)',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var key = r.getResponseText().trim();
  if (!key) return;
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
  var test = callGemini_([{ role: 'user', parts: [{ text: '안녕이라고만 답해.' }] }], null);
  ui.alert(test ? '저장 완료! 챗봇 연결 테스트도 성공했습니다.' :
    '키는 저장했지만 테스트 호출이 실패했습니다. 키가 맞는지 확인해 주세요.');
}

function menuSetPassword() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('교사 비밀번호 설정', '수업 페이지의 [교사 전용] 탭을 열 때 쓸 비밀번호를 입력하세요.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var pw = r.getResponseText().trim();
  if (pw.length < 4) { ui.alert('4자 이상으로 정해 주세요.'); return; }
  PropertiesService.getScriptProperties().setProperty('TEACHER_PASSWORD', pw);
  ui.alert('교사 비밀번호를 저장했습니다.');
}

function menuCheck() {
  var p = PropertiesService.getScriptProperties();
  getSheet_();
  var lines = [
    '제출 시트: 준비됨',
    '제미나이 API 키: ' + (p.getProperty('GEMINI_API_KEY') ? '입력됨' : '❌ 없음 (① 메뉴에서 입력)'),
    '교사 비밀번호: ' + (p.getProperty('TEACHER_PASSWORD') ? '설정됨' : '❌ 없음 (② 메뉴에서 설정)')
  ];
  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

/* ---------------- 웹 앱 진입점 ---------------- */

function doGet() {
  return json_({ ok: true, service: 'ww2-background', ready: true });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }
  try {
    switch (data.action) {
      case 'chat': return json_(chat_(data));
      case 'polish': return json_(polish_(data));
      case 'auth': return json_({ ok: checkPassword_(data.password) });
      case 'list': return json_(list_(data));
      default: return json_(submit_(data));
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ---------------- 제출 ---------------- */

function submit_(data) {
  var row = FIELDS.map(function (f) {
    var v = data[f];
    if (f === 'timestamp' && !v) v = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy. M. d. a h:mm:ss');
    return safeCell_(v);
  });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    getSheet_().appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function list_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) return { ok: true, rows: [] };
  var values = sheet.getRange(2, 1, n, FIELDS.length).getDisplayValues();
  var rows = values.map(function (v, i) {
    var o = { id: 'row-' + (i + 2), sheetSynced: true };
    FIELDS.forEach(function (f, j) { o[f] = v[j]; });
    return o;
  }).reverse();
  return { ok: true, rows: rows };
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#efe9e0');
  }
  return sheet;
}

function safeCell_(v) {
  var s = (v === undefined || v === null) ? '' : String(v);
  if (s.length > 5000) s = s.slice(0, 5000);
  // 시트 수식으로 해석되지 않도록
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function checkPassword_(pw) {
  var saved = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD');
  return Boolean(saved) && typeof pw === 'string' && pw.trim() === saved;
}

/* ---------------- 챗봇 ---------------- */

function chat_(data) {
  var personaName = PERSONAS[data.persona] || PERSONAS.mussolini;
  var stance = clip_(data.stance || '인권과 민주주의 수호자', 40);
  var system = '당신은 중학교 역사 수업에서 학생들의 비판적 사고력을 길러 주기 위한 \'전체주의 반박 토론용 역사 AI 챗봇\'입니다.\n' +
    '현재 학생의 역할은 \'' + stance + '\'이며, 당신은 \'' + personaName + '\'의 입장을 연기하되 교육적 안전 수칙을 엄격히 지킵니다.\n' +
    '[규칙]\n' +
    '1. 혐오 표현, 특정 민족·집단 비하, 폭력 선동은 절대 하지 마세요. 교과서 사료(무솔리니의 「파시즘 독트린」: 국가가 국민을 창조하며 개인보다 국가가 우위에 있음 / 히틀러의 「나의 투쟁」: 힘의 논리와 영토 팽창 정당화, 경제 위기 극복을 위한 국가 통제)의 논리만 근거로 들어 학생의 반박에 2~3문장으로 논쟁적으로 응수하세요.\n' +
    '2. 학생이 인권, 자유, 민주주의, 세계 평화, 주권 존중 등의 타당한 근거를 들어 반박하면, 전체주의 논리의 한계나 모순이 드러나도록 움찔하며 반응하세요.\n' +
    '3. 수업과 무관한 요청(숙제 대필, 다른 주제 잡담 등)에는 역할을 유지한 채 토론 주제로 돌아오게 하세요.\n' +
    '4. 답변 마지막 줄에는 반드시 \'[재반박 힌트]: ...\' 형태로 학생이 다음 차례에 공격할 수 있는 역사적 힌트를 한 문장으로 덧붙이세요.';

  var history = Array.isArray(data.history) ? data.history.slice(-8) : [];
  var contents = history.map(function (m) {
    return { role: m.role === 'user' ? 'user' : 'model', parts: [{ text: clip_(m.text, 600) }] };
  }).filter(function (c) { return c.parts[0].text; });
  // 제미나이는 user 차례로 시작해야 함
  while (contents.length && contents[0].role !== 'user') contents.shift();
  if (!contents.length) return { ok: false, error: 'empty' };

  var text = callGemini_(contents, system);
  if (!text) return { ok: false, error: 'ai_unavailable', detail: LAST_AI_ERROR };
  var parts = text.split(/\[재반박 힌트\]\s*[:：]/);
  return { ok: true, reply: parts[0].trim(), coachTip: parts[1] ? parts[1].trim() : '' };
}

function polish_(data) {
  var msgs = Array.isArray(data.messages) ? data.messages.slice(-10).map(function (t) { return clip_(t, 600); }) : [];
  if (!msgs.length) return { ok: false, error: 'empty' };
  var stance = clip_(data.stance || '인권과 민주주의 수호자', 40);
  var prompt = '다음은 중학생이 \'' + stance + '\' 관점에서 무솔리니(파시즘)와 히틀러(나치즘)의 주장에 반박하며 채팅한 내용입니다:\n' +
    msgs.join('\n') +
    '\n\n위 학생의 채팅 내용을 바탕으로, 전체주의 국가의 주장(개인보다 국가 우위, 대외 침략 정당화)을 반박하는 논리적이고 자연스러운 3~4문장의 짧은 반박 글을 학생 본인의 어조로 다듬어 작성해 주세요. 반박 글 본문만 출력하세요.';
  var text = callGemini_([{ role: 'user', parts: [{ text: prompt }] }], null);
  if (!text) return { ok: false, error: 'ai_unavailable' };
  return { ok: true, text: text.trim() };
}

function callGemini_(contents, systemText) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('GEMINI_API_KEY');
  if (!key) { LAST_AI_ERROR = 'no_key'; return null; }
  var models = [props.getProperty('GEMINI_MODEL')].concat(DEFAULT_MODELS).filter(Boolean);
  var body = { contents: contents, generationConfig: { temperature: 0.8, maxOutputTokens: 4096 } };
  if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };

  for (var i = 0; i < models.length; i++) {
    var b = JSON.parse(JSON.stringify(body));
    if (/^gemini-3/.test(models[i])) b.generationConfig.thinkingConfig = { thinkingLevel: 'low' };
    for (var attempt = 0; attempt < 2; attempt++) {
      var t0 = Date.now();
      var res = UrlFetchApp.fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent', {
          method: 'post',
          contentType: 'application/json',
          headers: { 'x-goog-api-key': key },
          payload: JSON.stringify(b),
          muteHttpExceptions: true
        });
      var code = res.getResponseCode();
      AI_TRACE.push(models[i] + ':' + code + ':' + (Date.now() - t0) + 'ms');
      if (code !== 200) LAST_AI_ERROR = models[i] + ':' + code + ' ' + res.getContentText().slice(0, 160);
      if (code === 200) {
        var out = JSON.parse(res.getContentText());
        var c = out.candidates && out.candidates[0];
        var p = c && c.content && c.content.parts;
        var text = p ? p.map(function (x) { return x.text || ''; }).join('') : '';
        if (text) return text;
        LAST_AI_ERROR = models[i] + ':empty ' + JSON.stringify(out).slice(0, 300);
        break;
      }
      if (code === 400 && b.generationConfig.thinkingConfig) { delete b.generationConfig.thinkingConfig; continue; }
      if (code >= 500 && attempt === 0) { Utilities.sleep(1000); continue; }
      break; // 429(한도 초과)·404(모델 없음) 등은 바로 다음 모델로
    }
  }
  return null;
}

/* ---------------- 공통 ---------------- */

function clip_(s, n) {
  s = (s === undefined || s === null) ? '' : String(s);
  return s.length > n ? s.slice(0, n) : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
