/**
 * 1차시 「제2차 세계 대전의 배경」 수업 서버 (구글 시트에 연결된 Apps Script 웹 앱)
 *
 * 하는 일
 *  - submit : 학생 탐구 결과를 '2차시 제출' 시트에 한 줄씩 기록
 *  - chat   : 무솔리니·히틀러 반박 토론 챗봇 (제미나이 API 키는 서버에만 보관)
 *  - polish : 채팅 내용을 반박 글로 다듬기
 *  - auth   : 교사 비밀번호 확인
 *  - list   : 교사 화면에 제출 현황 불러오기 (비밀번호 필요)
 *  - submit5: 5차시 「인권 회복과 평화 실현」 활동 결과를 '5차시 제출' 시트에 기록
 *  - submit6: 6차시 「아시아와 아프리카의 민족 운동」 활동 결과를 '6차시 제출' 시트에 기록
 *  - submit1·submit3·submit4·submit7: 1·3·4·7차시 활동 결과를 각 차시 제출 탭에 기록
 *  - rows / grade: 교사 확인·평가 화면(teacher/)에서 차시별 제출 목록 불러오기, 평가·피드백 저장 (비밀번호 필요)
 *  - myFeedback: 학생이 학반·번호·이름으로 자기 평가·피드백 확인
 *
 * 설정은 시트 상단 메뉴 [📚 수업 설정]에서 합니다. (API 키·비밀번호는 코드에 적지 않습니다)
 */

var SHEET_NAME = '2차시 제출';
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
      case 'submit5': return json_(submit5_(data));
      case 'submit6': return json_(submit6_(data));
      case 'submit1': case 'submit3': case 'submit4': case 'submit7':
        var L = LESSONS[data.action.slice(6)];
        return json_(appendLesson_(data, L.sheet, L.headers, L.fields));
      case 'rows': return json_(rows_(data));
      case 'grade': return json_(grade_(data));
      case 'myFeedback': return json_(myFeedback_(data));
      default: return json_(submit_(data));
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ---------------- 5차시 제출 ---------------- */

var SHEET5_NAME = '5차시 제출';
var HEADERS5 = ['제출일시', '학반', '번호', '이름', '빈칸(맞힌 수)', '숨은 숫자', '연맹/연합 분류',
  '아이히만 반박 글', '다큐 주제', 'S#1 참상', 'S#2 추모 공간', 'S#3 평화를 위한 노력', '스스로 점검'];
var FIELDS5 = ['timestamp', 'className', 'studentNumber', 'studentName', 'fillScore', 'puzzle', 'sortScore',
  'eichmann', 'topic', 'scene1', 'scene2', 'scene3', 'selfCheck'];

function submit5_(data) {
  if (!data.studentName || !String(data.studentName).trim()) return { ok: false, error: 'no_name' };
  data.timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var row = FIELDS5.map(function (f) { return safeCell_(data[f]); });
  // '2-3' 같은 학반이 날짜로 바뀌지 않도록 글자로 고정
  if (/^[0-9]/.test(row[1])) row[1] = "'" + row[1];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET5_NAME) || ss.insertSheet(SHEET5_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS5);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS5.length).setFontWeight('bold').setBackground('#fef3c7');
    }
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, timestamp: data.timestamp };
}

/* ---------------- 6차시 제출 ---------------- */

var SHEET6_NAME = '6차시 제출';
var HEADERS6 = ['제출일시', '학반', '번호', '이름', '빈칸(맞힌 수)', '문자표 찾기', '인물-나라 분류', '영국의 약속 분류',
  '3·1 운동과 5·4 운동의 관련성', '팔레스타인 갈등의 원인', '전체주의 서술', '한 줄 성찰', '스스로 점검'];
var FIELDS6 = ['timestamp', 'className', 'studentNumber', 'studentName', 'fillScore', 'wordSearch', 'peopleScore', 'promiseScore',
  'link31', 'palestine', 'totalitarian', 'reflection', 'selfCheck'];

function submit6_(data) {
  return appendLesson_(data, SHEET6_NAME, HEADERS6, FIELDS6);
}

/* ---------------- 1·3·4·7차시 제출 + 교사 평가 ---------------- */

// 차시별 제출 탭. 모든 탭의 앞 4칸은 제출일시·학반·번호·이름으로 같고,
// 교사 평가(평가·피드백·평가일시)는 각 탭의 맨 오른쪽 칸에 기록한다.
var LESSONS = {
  1: { sheet: '1차시 제출', headers: ['제출일시', '학반', '번호', '이름', '마스터 퀴즈', '사료 배지', '베르사유 조약 생각 쓰기'],
       fields: ['timestamp', 'className', 'studentNumber', 'studentName', 'quizScore', 'badges', 'essay'] },
  2: { sheet: SHEET_NAME, headers: HEADERS, fields: FIELDS },
  3: { sheet: '3차시 제출', headers: ['제출일시', '학반', '번호', '이름', '핵심 정리 퀴즈', '둘러본 사건 수', '가장 중요한 사건과 까닭'],
       fields: ['timestamp', 'className', 'studentNumber', 'studentName', 'quizScore', 'visited', 'essay'] },
  4: { sheet: '4차시 제출', headers: ['제출일시', '학반', '번호', '이름', '빈칸(맞힌 수)', '확인 퀴즈', '전쟁 범죄를 알리는 글', '스스로 점검'],
       fields: ['timestamp', 'className', 'studentNumber', 'studentName', 'fillScore', 'quizScore', 'essay', 'selfCheck'] },
  5: { sheet: SHEET5_NAME, headers: HEADERS5, fields: FIELDS5 },
  6: { sheet: SHEET6_NAME, headers: HEADERS6, fields: FIELDS6 },
  7: { sheet: '7차시 제출', headers: ['제출일시', '학반', '번호', '이름', '우주 경쟁의 까닭(도입)', '대립 구도 표', '독일 분단 순서', '냉전/열전 분류',
         '빈칸(맞힌 수)', 'O/X 퀴즈', '아시아의 냉전 서술', '한 줄 성찰', '스스로 점검'],
       fields: ['timestamp', 'className', 'studentNumber', 'studentName', 'spaceWhy', 'blocScore', 'orderResult', 'coldHot',
         'fillScore', 'oxScore', 'asia', 'reflection', 'selfCheck'] }
};
var GRADE_HEADERS = ['평가', '피드백', '평가일시'];

function lessonSheet_(n) {
  var L = LESSONS[n];
  if (!L) return null;
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(L.sheet);
}

// 평가 칸 위치(1부터): 머리글에 '평가'가 없으면 마지막 칸 뒤에 세 칸을 만든다
function gradeCol_(sheet, create) {
  var w = Math.max(sheet.getLastColumn(), 1);
  var head = sheet.getRange(1, 1, 1, w).getDisplayValues()[0];
  var i = head.indexOf(GRADE_HEADERS[0]);
  if (i > -1) return i + 1;
  if (!create) return 0;
  sheet.getRange(1, w + 1, 1, 3).setValues([GRADE_HEADERS]).setFontWeight('bold').setBackground('#d1fae5');
  return w + 1;
}

// 교사 화면: 한 차시의 제출 목록(최신순). 학생 글과 평가를 함께 돌려준다.
function rows_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var L = LESSONS[data.lesson];
  if (!L) return { ok: false, error: 'no_lesson' };
  var sheet = lessonSheet_(data.lesson);
  if (!sheet || sheet.getLastRow() < 2) return { ok: true, headers: L.headers, rows: [] };
  var gc = gradeCol_(sheet, false);
  var w = Math.max(sheet.getLastColumn(), L.headers.length);
  var head = sheet.getRange(1, 1, 1, w).getDisplayValues()[0];
  var vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, w).getDisplayValues();
  var nf = gc ? gc - 1 : L.headers.length;
  var rows = vals.map(function (v, i) {
    return { row: i + 2, values: v.slice(0, nf), grade: gc ? v[gc - 1] : '', feedback: gc ? v[gc] : '', gradedAt: gc ? v[gc + 1] : '' };
  }).filter(function (r) { return r.values.join('').trim(); }).reverse();
  return { ok: true, headers: head.slice(0, nf), rows: rows };
}

// 교사 화면: 평가·피드백 저장
function grade_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var sheet = lessonSheet_(data.lesson);
  var row = parseInt(data.row, 10);
  if (!sheet || !(row >= 2) || row > sheet.getLastRow()) return { ok: false, error: 'no_row' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var gc = gradeCol_(sheet, true);
    var at = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(row, gc, 1, 3).setValues([[safeCell_(clip_(data.grade, 20)), safeCell_(clip_(data.feedback, 1000)), at]]);
    return { ok: true, gradedAt: at };
  } finally {
    lock.releaseLock();
  }
}

// 학생 화면: 내 마지막 제출의 평가·피드백 (학반·번호·이름이 모두 같아야 보여 준다)
function myFeedback_(data) {
  var L = LESSONS[data.lesson];
  var sheet = lessonSheet_(data.lesson);
  if (!L || !sheet || sheet.getLastRow() < 2) return { ok: true, found: false };
  function n(s) { return String(s || '').replace(/[\s'’-]/g, '').toLowerCase(); }
  var gc = gradeCol_(sheet, false);
  var w = Math.max(sheet.getLastColumn(), 4);
  var vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, w).getDisplayValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    var v = vals[i];
    if (n(v[1]) === n(data.className) && n(v[2]) === n(data.studentNumber) && n(v[3]) === n(data.studentName)) {
      return { ok: true, found: true, timestamp: v[0], grade: gc ? v[gc - 1] : '', feedback: gc ? v[gc] : '' };
    }
  }
  return { ok: true, found: false };
}

// 차시별 제출 공통: 이름 확인 → 시각 기록 → 해당 탭에 한 줄 추가(없으면 머리글과 함께 탭 생성)
function appendLesson_(data, sheetName, headers, fields) {
  if (!data.studentName || !String(data.studentName).trim()) return { ok: false, error: 'no_name' };
  data.timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var row = fields.map(function (f) { return safeCell_(data[f]); });
  if (/^[0-9]/.test(row[1])) row[1] = "'" + row[1];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#fef3c7');
    }
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, timestamp: data.timestamp };
}

/* ---------------- 제출 ---------------- */

function submit_(data) {
  var row = FIELDS.map(function (f) {
    var v = data[f];
    if (f === 'timestamp' && !v) v = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
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
