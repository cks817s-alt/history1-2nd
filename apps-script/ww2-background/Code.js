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
 *  - submitru: Ⅵ-01-2 「유럽 각국의 정치 체제가 변화하다」 활동 결과를 '1차시+ 정치 체제 변화 제출' 시트에 기록
 *  - submit1·submit3·submit4·submit7: 1·3·4·7차시 활동 결과를 각 차시 제출 탭에 기록
 *  - rows / grade: 교사 확인·평가 화면(teacher/)에서 차시별 제출 목록 불러오기, 평가·피드백 저장 (비밀번호 필요)
 *  - myFeedback: 학생이 학반·번호·이름으로 자기 평가·피드백 확인
 *  - artItems·artVote·artAdmin·artSet·artAdd: 국중박 유물분장 대회 반별 유물 투표 (artifact-vote/)
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
    .addItem('④ 나이스 API 키 입력', 'menuSetNeisKey')
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
    '교사 비밀번호: ' + (p.getProperty('TEACHER_PASSWORD') ? '설정됨' : '❌ 없음 (② 메뉴에서 설정)'),
    '나이스 API 키: ' + (p.getProperty('NEIS_API_KEY') ? '입력됨' : '❌ 없음 (④ 메뉴에서 입력)')
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
      case 'submit1': case 'submit3': case 'submit4': case 'submit7': case 'submittl': case 'submitru':
        var L = LESSONS[data.action.slice(6)];
        return json_(appendLesson_(data, L.sheet, L.headers, L.fields));
      case 'rows': return json_(rows_(data));
      case 'grade': return json_(grade_(data));
      case 'myFeedback': return json_(myFeedback_(data));
      case 'artItems': return json_(artItems_(data));
      case 'artVote': return json_(artVote_(data));
      case 'artAdmin': return json_(artAdmin_(data));
      case 'artSet': return json_(artSet_(data));
      case 'artAdd': return json_(artAdd_(data));
      case 'bootKeys': return json_(bootKeys_(data));
      case 'keyStatus': return json_(keyStatus_(data));
      case 'neisToday': return json_(neisToday_(data));
      case 'reflect': return json_(reflect_(data));
      case 'reflections': return json_(reflections_(data));
      case 'reflectAI': return json_(reflectAI_(data));
      case 'ideaAI': return json_(ideaAI_(data));
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
  // Ⅵ-01-2 유럽 각국의 정치 체제가 변화하다 (러시아 혁명·민주주의·참정권, russian-revolution/)
  ru: { sheet: '1차시+ 정치 체제 변화 제출', headers: ['제출일시', '학반', '번호', '이름', '피의 일요일 생각(도입)', '3월/11월 혁명 분류', '혁명 순서',
         '레닌/스탈린 분류', '여성 참정권 배경 고르기', '빈칸(맞힌 수)', 'O/X 퀴즈', '3월·11월 혁명 비교', '여성 참정권 확대 까닭', '스스로 점검'],
       fields: ['timestamp', 'className', 'studentNumber', 'studentName', 'introWhy', 'monthScore', 'orderResult',
         'leaderScore', 'suffrageWhy', 'fillScore', 'oxScore', 'revolution', 'suffrage', 'selfCheck'] },
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
         'fillScore', 'oxScore', 'asia', 'reflection', 'selfCheck'] },
  // 세계사 타임라인 지구본 — 나의 세계사 연표 만들기 (차시와 별도인 단원 공통 활동)
  tl: { sheet: '세계사 연표 제출', headers: ['제출일시', '학반', '번호', '이름', '카드 수', '동양·서양 카드', '미션', '나의 연표(카드)', '동서 비교 글', '새롭게 알게 된 점'],
        fields: ['timestamp', 'className', 'studentNumber', 'studentName', 'cardCount', 'laneCount', 'mission', 'cards', 'compare', 'reflection'] }
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
  if (s.length > 20000) s = s.slice(0, 20000);
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

/* ---------------- 국중박 유물분장 대회: 반별 유물 투표 (artifact-vote/) ----------------
 * '유물 후보' 탭: 반마다 투표할 유물 목록. 선생님이 시트에서 직접 고치거나 줄을 더해도 됩니다.
 *   (표시 칸에 X를 쓰면 학생 화면에서 숨김)
 * '유물 투표' 탭: 학생 한 명당 한 줄(반·번호). 다시 투표하면 그 줄을 고칩니다.
 * 반별 '투표 마감'·'결과 공개'는 스크립트 속성 ART_STATE에 저장합니다.
 */

var ART_SHEET = '유물 후보';
var ART_HEADERS = ['반', 'ID', '유물명', '국적/시대', '소장', '사진 주소', '소장품 링크', '간략 소개', '모둠의 의도', '상태', '표시'];
var VOTE_SHEET = '유물 투표';
var VOTE_HEADERS = ['투표일시', '반', '번호', '선택1', '선택2'];
var ART_CLASSES = ['1', '2', '3', '4', '5'];
var ART_MAX_NUM = 30;
var ART_MAX_PICKS = 2;
var MUSEUM_VIEW = 'https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&relicId=';

var ART_SEED = [
  ['3', 'a301', '복희와 여와', '중앙아시아 투루판 아스타나 무덤 출토', '국립중앙박물관', 'img/fuxi.jpg', MUSEUM_VIEW + '435',
    '중국 천지창조 신화에 나오는 두 신, 여와(왼쪽)와 복희(오른쪽)가 마주 본 그림이다. 두 신은 컴퍼스와 굽은 자를 들고 있는데, 둥근 하늘과 네모난 땅이라는 우주관을 나타낸다. 윗몸은 사람, 아랫몸은 뱀처럼 서로 꼬여 있다. 마로 짠 천에 그렸고 세로 188.5cm이다.',
    '분장했을 때 재미있을 것 같아서 골랐다.', '최종 선정', ''],
  ['3', 'a302', '얼굴모양 조개', '한국 · 신석기 (부산 영도구 출토)', '국립중앙박물관', 'img/shellface.jpg', MUSEUM_VIEW + '4435',
    '조개껍데기에 두 눈과 입 모양의 구멍을 뚫어 사람 얼굴처럼 만든 신석기 시대 유물이다. 높이 10.7cm, 너비 12cm이다.',
    '모둠 활동지의 후보 유물 (최종 선정 전)', '후보', ''],
  ['3', 'a303', '청자 원앙 모양 향로 뚜껑', '한국 · 고려', '국립중앙박물관', 'img/mandarin-lid.jpg', MUSEUM_VIEW + '4219',
    '연밥 위에 원앙이 앉은 모양의 향로 뚜껑이다. 향 연기가 원앙의 몸을 지나 벌린 입으로 나오도록 만들었다. 깃털을 가는 선으로 새긴 세련된 솜씨와 비색 유약으로 보아 청자가 가장 발달한 12세기 전반의 작품으로 본다.',
    '모둠 활동지의 후보 유물 (최종 선정 전)', '후보', ''],
  ['3', 'a304', '금동약사불입상', '한국 · 신라', '국립중앙박물관', 'img/yaksa.jpg', MUSEUM_VIEW + '330',
    '약그릇(약합)을 든 약사불을 금동으로 만든 작은 불상이다. 불상 높이 11.6cm로, 크고 높은 머리 위 상투(육계)와 대좌에 살짝 끌리는 긴 치마가 특징이다.',
    '모둠 활동지의 후보 유물 (최종 선정 전)', '후보', ''],
  ['3', 'a305', '농경문 청동기', '한국 · 초기 철기 (보물)', '국립중앙박물관', 'img/nonggyeong.jpg', MUSEUM_VIEW + '1991',
    '대전에서 나왔다고 전하는 청동기로 윗부분만 남아 있다. 한쪽 면에는 따비로 밭을 가는 사람, 괭이를 든 사람, 항아리에 무언가를 담는 사람이, 다른 면에는 나뭇가지 끝에 앉은 새가 새겨져 있다. 농경과 관련된 제사에 쓴 의식용 도구로 본다.',
    '모둠 활동지의 후보 유물 (최종 선정 전)', '후보', ''],
  ['4', 'a401', '요령식 동검 (비파형 동검)', '한국 · 청동기 (부여 송국리 출토)', '국립중앙박물관', 'img/bipa.jpg', MUSEUM_VIEW + '2040',
    '중국 악기 비파를 닮아 비파형 동검이라고도 부른다. 칼몸 아래쪽이 넓고 둥글며, 칼몸과 손잡이를 따로 만들어 끼우는 방식이다. 부여 송국리 돌널무덤에서 나왔고 길이 33.4cm이다.',
    '모둠 활동지의 후보 유물 (최종 선정 전)', '후보', ''],
  ['4', 'a402', '봉황 장식 비녀', '한국 · 고려', '국립중앙박물관', 'img/phoenix-pin.jpg', MUSEUM_VIEW + '1490',
    '은으로 만들고 봉황 부분만 금으로 도금한 비녀이다(길이 27.8cm). 봉황의 큰 볏과 긴 깃털을 가는 선으로 정교하게 새겼다. 금·은 비녀는 주로 상류층이, 서민은 나무·뿔·뼈 비녀를 썼다. ※ 활동지에는 대한제국으로 적었지만 국립중앙박물관 소장품 정보는 고려이다.',
    '왕실의 권위와 좋은 뜻, 황금빛의 화려한 품격을 함께 갖춘 비녀이다. 전통 혼례나 행사에 참가하면서 비녀에 관심이 생겨서 골랐다.', '최종 선정', ''],
  ['4', 'a403', '나주 신촌리 금동관', '한국 · 삼국 (국보)', '국립중앙박물관', 'img/naju-crown.jpg', MUSEUM_VIEW + '4384',
    '나주 반남면 신촌리 9호 무덤에서 나온 금동관으로, 안쪽 관과 바깥 관으로 되어 있다. 바깥 관에는 풀꽃 모양 세움 장식과 달개가 달려 있는데, 신라 관의 ‘山’ 자 모양 장식과는 다르다.',
    '예쁘고 만들기 어렵지 않다. 역사적으로 중요하다.', '후보', ''],
  ['4', 'a404', '십이지 당삼채 (개 · 호랑이)', '중국 · 당', '국립중앙박물관', 'img/zodiac-dog.jpg img/zodiac-tiger.jpg', MUSEUM_VIEW + '2930',
    '머리는 동물, 몸은 사람 모습인 당나라의 십이지상으로, 세 가지 색 유약(당삼채)을 입혔다. 열두 띠의 형상을 무덤에 묻는 풍습은 당나라 때 가장 유행했고, 무덤의 작은 감실에 동서남북 방향마다 3개씩 놓았다. 박물관에는 개·호랑이·뱀이 함께 전시되어 있다.',
    '세 마리 동물이 나란히 서 있는 모습이 관객에게 재미를 줄 것 같다. 당나라에서 십이지신이 나쁜 기운을 몰아낸다는 이유로 유행했다고 한다.', '최종 선정', ''],
  ['4', 'a405', '청자 석류 모양 주전자', '한국 · 고려', '국립중앙박물관', 'img/pomegranate.jpg', MUSEUM_VIEW + '1124',
    '석류 네 개를 이어 붙여 만든 청자 주전자이다. 석류 세 개 위에 하나를 올린 안정된 삼각 구도로, 이렇게 만든 주전자는 매우 드물다. 높이 18.3cm이다.',
    '청자의 아름다운 색을 직접 나타내 볼 수 있다. 청자의 다양한 꽃잎을 표현하며 청자의 아름다움을 깊이 관찰할 수 있다.', '최종 선정', ''],
  ['4', 'a406', '청자 오리모양 향로', '한국 · 고려', '국립중앙박물관', 'img/duck-censer.jpg', MUSEUM_VIEW + '87091',
    '뚜껑 위에 오리(원앙)가 앉은 고려 청자 향로로, 세 발 달린 몸체 위에 뚜껑을 덮었다. 전체 높이 23cm이며 박물관 고려실에 ‘청자 원앙모양 향로’라는 이름으로 전시되어 있다. ※ 활동지에 적은 국립해양유산연구소 소장품과는 다른 유물일 수 있다.',
    '처음 본 유물을 다른 사람에게 소개할 수 있을 것 같다. 유물이지만 고전스럽지 않고 귀엽고 요즘스럽다.', '후보', ''],
  ['5', 'a501', '농경문 청동기', '한국 · 초기 철기 (보물)', '국립중앙박물관', 'img/nonggyeong.jpg', MUSEUM_VIEW + '1991',
    '대전에서 나왔다고 전하는 청동기로 윗부분만 남아 있다. 한쪽 면에는 따비로 밭을 가는 사람, 괭이를 든 사람, 항아리에 무언가를 담는 사람이, 다른 면에는 나뭇가지 끝에 앉은 새가 새겨져 있다. 농경과 관련된 제사에 쓴 의식용 도구로 본다.',
    '농경과 농경 의례의 모습을 구체적으로 보여 주고, 생김새가 멋지다. 판을 이 모양으로 잘라 청색·옥색으로 칠하고 무늬를 그린 뒤, 구멍을 뚫어 얼굴을 넣어 표현하려 한다.', '최종 선정', ''],
  ['5', 'a502', '백자 청화동정추월문 항아리', '한국 · 조선 (보물)', '국립중앙박물관 (이건희 기증)', 'img/dongjeong-jar.jpg', MUSEUM_VIEW + '36551211',
    '흰 백자에 푸른 안료(청화)로 ‘동정호의 가을 달(동정추월)’ 풍경을 그린 조선 시대 항아리이다. 높이 32.5cm이며 보물로 지정되어 있다.',
    '모양이 예쁘고 무늬가 독특하며, 조선 사람들이 쓴 그릇을 알 수 있다. 큰 항아리 모양으로 몸을 만들고 흰 옷에 파란 무늬를 붙여 표현하고, 도자기 장인과 항아리를 쓰는 사람의 이야기를 연기하려 한다.', '최종 선정', '']
];

function artSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ART_SHEET);
  if (!sh) {
    sh = ss.insertSheet(ART_SHEET);
    sh.appendRow(ART_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, ART_HEADERS.length).setFontWeight('bold').setBackground('#fef3c7');
    sh.getRange(2, 1, ART_SEED.length, ART_HEADERS.length).setNumberFormat('@').setValues(ART_SEED);
  }
  return sh;
}

function voteSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(VOTE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(VOTE_SHEET);
    sh.appendRow(VOTE_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, VOTE_HEADERS.length).setFontWeight('bold').setBackground('#fef3c7');
    sh.getRange('B:E').setNumberFormat('@');
  }
  return sh;
}

function artCls_(v) {
  var c = String(v === undefined || v === null ? '' : v).replace(/[^0-9]/g, '');
  if (ART_CLASSES.indexOf(c) < 0) throw new Error('반을 다시 골라 주세요.');
  return c;
}

function artList_(cls) {
  var vals = artSheet_().getDataRange().getDisplayValues();
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i];
    if (String(r[0]).replace(/[^0-9]/g, '') !== cls) continue;
    if (!r[1] || !r[2]) continue;
    if (String(r[10]).trim().toUpperCase() === 'X') continue;
    out.push({ id: String(r[1]).trim(), name: r[2], era: r[3], owner: r[4], img: r[5], link: r[6],
      intro: r[7], intent: r[8], status: r[9] });
  }
  return out;
}

function artStateAll_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('ART_STATE') || '{}'); }
  catch (e) { return {}; }
}

function artState_(cls) {
  var s = artStateAll_()[cls] || {};
  return { closed: !!s.closed, reveal: !!s.reveal };
}

function artVotes_(cls) {
  var vals = voteSheet_().getDataRange().getDisplayValues();
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    if (vals[i][1] !== cls) continue;
    out.push({ row: i + 1, time: vals[i][0], num: vals[i][2], picks: [vals[i][3], vals[i][4]].filter(Boolean) });
  }
  return out;
}

function artTally_(items, votes) {
  var count = {};
  items.forEach(function (it) { count[it.id] = 0; });
  votes.forEach(function (v) { v.picks.forEach(function (p) { if (p in count) count[p]++; }); });
  return count;
}

function artItems_(data) {
  var cls = artCls_(data.cls);
  var items = artList_(cls);
  var state = artState_(cls);
  var res = { ok: true, cls: cls, items: items, state: state, maxPicks: ART_MAX_PICKS };
  var votes = null;
  if (data.num) {
    votes = artVotes_(cls);
    var mine = votes.filter(function (v) { return v.num === String(data.num); })[0];
    res.myVote = mine ? mine.picks : [];
  }
  if (state.reveal) {
    votes = votes || artVotes_(cls);
    res.results = { count: artTally_(items, votes), voters: votes.length };
  }
  return res;
}

function artVote_(data) {
  var cls = artCls_(data.cls);
  var num = parseInt(data.num, 10);
  if (!(num >= 1 && num <= ART_MAX_NUM)) throw new Error('번호를 다시 골라 주세요.');
  var picks = (Array.isArray(data.picks) ? data.picks : []).map(String)
    .filter(function (p, i, a) { return p && a.indexOf(p) === i; });
  if (picks.length < 1 || picks.length > ART_MAX_PICKS) throw new Error('유물을 1~' + ART_MAX_PICKS + '개 골라 주세요.');
  var ids = artList_(cls).map(function (it) { return it.id; });
  for (var i = 0; i < picks.length; i++) {
    if (ids.indexOf(picks[i]) < 0) throw new Error('목록에 없는 유물이 있어요. 새로고침해 주세요.');
  }
  if (artState_(cls).closed) throw new Error('투표가 마감되었어요.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = voteSheet_();
    var mine = artVotes_(cls).filter(function (v) { return v.num === String(num); })[0];
    var row = [Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'), cls, String(num), picks[0], picks[1] || ''];
    if (mine) sh.getRange(mine.row, 1, 1, row.length).setValues([row]);
    else sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, picks: picks };
}

function artAdmin_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'auth' };
  var cls = artCls_(data.cls);
  var items = artList_(cls);
  var votes = artVotes_(cls);
  return { ok: true, cls: cls, items: items, state: artState_(cls),
    count: artTally_(items, votes),
    voters: votes.map(function (v) { return { num: v.num, picks: v.picks, time: v.time }; }) };
}

function artSet_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'auth' };
  var cls = artCls_(data.cls);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var all = artStateAll_();
    var s = all[cls] || {};
    if (typeof data.closed === 'boolean') s.closed = data.closed;
    if (typeof data.reveal === 'boolean') s.reveal = data.reveal;
    all[cls] = s;
    PropertiesService.getScriptProperties().setProperty('ART_STATE', JSON.stringify(all));
  } finally {
    lock.releaseLock();
  }
  return { ok: true, state: artState_(cls) };
}

function artAdd_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'auth' };
  var cls = artCls_(data.cls);
  var name = clip_(data.name, 80).trim();
  if (!name) throw new Error('유물명을 써 주세요.');
  var sh = artSheet_();
  var id = 'a' + cls + Utilities.getUuid().slice(0, 6);
  var row = [cls, id, name, clip_(data.era, 80), clip_(data.owner, 80) || '국립중앙박물관', clip_(data.img, 500),
    clip_(data.link, 500), clip_(data.intro, 1000), clip_(data.intent, 1000), clip_(data.status, 20) || '후보', ''];
  sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row.map(safeCell_)]);
  return { ok: true, id: id };
}


/* ---------------- 수업 성찰 · 나이스 · 아이디어 (교사 화면 「수업 성찰」 탭) ---------------- */
// 키는 코드에 적지 않고 스크립트 속성(NEIS_API_KEY, GEMINI_API_KEY)에만 둡니다.

var NEIS_SCHOOL = { OFFICE: 'E10', SCHOOL: '7341084', SUBJECT: '역사' };
var REFLECT_SHEET = '수업 성찰';
var REFLECT_HEADERS = ['기록일시', '수업한 날', '반', '교시', '수업(차시)', '좋았던 점', '부족한 점', '다음에 바꿀 것', '수업 아이디어'];
var REFLECT_FIELDS = ['timestamp', 'date', 'cls', 'period', 'lesson', 'good', 'weak', 'change', 'idea'];

function menuSetNeisKey() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('나이스 API 키 입력', 'open.neis.go.kr 에서 발급한 인증키를 붙여 넣으세요.\n(키는 이 스크립트의 속성에만 저장되고 화면 파일에는 들어가지 않습니다)', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var key = r.getResponseText().trim();
  if (!key) return;
  PropertiesService.getScriptProperties().setProperty('NEIS_API_KEY', key);
  ui.alert('나이스 API 키를 저장했습니다.');
}

// 한 번만 쓰는 키 옮기기: 코드에는 무작위 토큰의 해시만 있고, 한 번 쓰면 잠깁니다.
var BOOT_HASH = '845ce3b01e3aeb793f730c7aabd844fa46ffa13e85570b2516d9493b133a884c';
function bootKeys_(data) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('BOOT_USED_' + BOOT_HASH.slice(0, 8))) return { ok: false, error: 'used' };
  var h = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(data.token || ''), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
  if (h !== BOOT_HASH) return { ok: false, error: 'unauthorized' };
  var neis = String(data.neis || '').trim(), gem = String(data.gemini || '').trim();
  if (neis) props.setProperty('NEIS_API_KEY', neis);
  if (gem) props.setProperty('GEMINI_API_KEY', gem);
  props.setProperty('BOOT_USED_' + BOOT_HASH.slice(0, 8), new Date().toISOString());
  return { ok: true, neis: !!neis, gemini: !!gem };
}

function keyStatus_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var p = PropertiesService.getScriptProperties();
  return { ok: true, neis: !!p.getProperty('NEIS_API_KEY'), gemini: !!p.getProperty('GEMINI_API_KEY') };
}

function neisGet_(service, params) {
  var key = PropertiesService.getScriptProperties().getProperty('NEIS_API_KEY');
  if (!key) throw new Error('no_neis_key');
  var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var url = 'https://open.neis.go.kr/hub/' + service + '?KEY=' + encodeURIComponent(key) + '&Type=json&pIndex=1&pSize=1000'
    + '&ATPT_OFCDC_SC_CODE=' + NEIS_SCHOOL.OFFICE + '&SD_SCHUL_CODE=' + NEIS_SCHOOL.SCHOOL + '&' + q;
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('neis_http_' + res.getResponseCode());
  var json = JSON.parse(res.getContentText());
  if (json[service]) return json[service][1].row || [];
  if (json.RESULT && json.RESULT.CODE === 'INFO-200') return []; // 자료 없음
  throw new Error('neis_' + (json.RESULT ? json.RESULT.CODE : 'unknown'));
}

// 고른 날(기본 오늘)의 역사 수업 시간표 + 그날부터 3주 학사 일정
function neisToday_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var tz = 'Asia/Seoul';
  var ymd = /^\d{8}$/.test(String(data.ymd || '')) ? String(data.ymd) : Utilities.formatDate(new Date(), tz, 'yyyyMMdd');
  var cache = CacheService.getScriptCache(), ck = 'neis_' + ymd, hit = cache.get(ck);
  if (hit) return JSON.parse(hit);
  var out = { ok: true, ymd: ymd, lessons: [], events: [] };
  try {
    var rows = neisGet_('misTimetable', { ALL_TI_YMD: ymd });
    var seen = {};
    rows.forEach(function (r) {
      var sub = String(r.ITRT_CNTNT || '').trim();
      if (sub.indexOf(NEIS_SCHOOL.SUBJECT) === -1) return;
      var k = r.GRADE + '-' + r.CLASS_NM + '_' + r.PERIO;
      if (seen[k]) return; seen[k] = 1;
      out.lessons.push({ cls: r.GRADE + '-' + r.CLASS_NM, period: Number(r.PERIO), subject: sub });
    });
    out.lessons.sort(function (a, b) { return a.period - b.period || a.cls.localeCompare(b.cls); });
    var from = new Date(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8));
    var to = new Date(from.getTime() + 21 * 864e5);
    var ev = neisGet_('SchoolSchedule', { AA_FROM_YMD: ymd, AA_TO_YMD: Utilities.formatDate(to, tz, 'yyyyMMdd') });
    var es = {};
    ev.forEach(function (r) {
      var name = String(r.EVENT_NM || '').trim();
      if (!name || name === '토요휴업일') return;
      var k = r.AA_YMD + name; if (es[k]) return; es[k] = 1;
      out.events.push({ ymd: String(r.AA_YMD), name: name });
    });
    out.events.sort(function (a, b) { return a.ymd.localeCompare(b.ymd); });
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
  cache.put(ck, JSON.stringify(out), 1800);
  return out;
}

function reflectSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(REFLECT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(REFLECT_SHEET);
    sh.appendRow(REFLECT_HEADERS); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, REFLECT_HEADERS.length).setFontWeight('bold').setBackground('#FFF3B0');
  }
  return sh;
}

function reflect_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  if (![data.good, data.weak, data.change, data.idea].some(function (v) { return String(v || '').trim(); })) return { ok: false, error: 'empty' };
  data.timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  var row = REFLECT_FIELDS.map(function (f) { return safeCell_(clip_(data[f], 2000)); });
  if (/^[0-9]/.test(row[2])) row[2] = "'" + row[2];
  if (/^[0-9]{4}-/.test(row[1])) row[1] = "'" + row[1];
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { reflectSheet_().appendRow(row); } finally { lock.releaseLock(); }
  return { ok: true, timestamp: data.timestamp };
}

function reflectRows_(n) {
  var sh = reflectSheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  var start = Math.max(2, last - n + 1);
  return sh.getRange(start, 1, last - start + 1, REFLECT_HEADERS.length).getDisplayValues().reverse().map(function (v) {
    var o = {}; REFLECT_FIELDS.forEach(function (f, i) { o[f] = v[i]; }); return o;
  });
}

function reflections_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  return { ok: true, rows: reflectRows_(60) };
}

var AI_TEACHER_SYS = '너는 대한민국 중학교 역사 교사의 수업 개선을 돕는 동료 교사다. 2022 개정 교육과정 중학교 역사①(비상교육 교과서)을 가르친다. ' +
  '교과서에 없는 역사적 사실을 새로 만들어 내지 말고, 수업 방법·활동 구성·평가에 대해서만 제안한다. 한국어로, 짧고 구체적으로 쓴다.';

function reflectAI_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var rows = reflectRows_(15);
  if (data.lesson) rows = rows.filter(function (r) { return r.lesson === data.lesson; }).concat(rows.filter(function (r) { return r.lesson !== data.lesson; })).slice(0, 15);
  if (!rows.length) return { ok: false, error: 'no_rows' };
  var notes = rows.map(function (r, i) {
    return '기록 ' + (i + 1) + ') ' + r.date + ' ' + r.cls + ' ' + r.lesson + '\n좋았던 점: ' + r.good + '\n부족한 점: ' + r.weak + '\n바꿀 것: ' + r.change + '\n아이디어: ' + r.idea;
  }).join('\n\n');
  var prompt = '아래는 내가 최근에 쓴 수업 성찰 기록이다.' + (data.lesson ? ' 특히 「' + data.lesson + '」 수업을 중심으로 본다.' : '') + '\n\n' + notes +
    '\n\n기록에서 되풀이되는 문제와 좋았던 점을 짚고, 다음 수업에서 바로 해 볼 수 있는 개선안 3가지를 제안해 줘. ' +
    '형식: 먼저 "한 줄 진단:" 한 줄, 그다음 "1." "2." "3." 번호마다 제안 제목 한 줄 + 어떻게 하는지 2문장 + 어느 기록에서 나온 제안인지(예: 기록 2·5). 마크다운 기호(** 등)는 쓰지 마.';
  var text = callGemini_([{ role: 'user', parts: [{ text: prompt }] }], AI_TEACHER_SYS);
  if (!text) return { ok: false, error: 'ai_unavailable' };
  return { ok: true, text: text.trim(), count: rows.length };
}

function ideaAI_(data) {
  if (!checkPassword_(data.password)) return { ok: false, error: 'unauthorized' };
  var idea = clip_(data.idea, 1500).trim();
  if (!idea) return { ok: false, error: 'empty' };
  var prompt = '수업 아이디어 메모: ' + idea + (data.lesson ? '\n적용할 수업: ' + data.lesson : '') +
    '\n\n이 메모를 45분 수업 안에서 쓸 수 있는 활동으로 다듬어 줘. 형식(마크다운 기호 없이): ' +
    '"활동 이름:" 한 줄 / "목표:" 한 줄 / "진행(시간):" 3~4단계 / "준비물:" 한 줄 / "바로 평가할 점:" 한 줄 / "주의할 점:" 한 줄. ' +
    '역사적 사실은 교과서에서 확인하라고 덧붙이고, 새 사실을 지어내지 마.';
  var text = callGemini_([{ role: 'user', parts: [{ text: prompt }] }], AI_TEACHER_SYS);
  if (!text) return { ok: false, error: 'ai_unavailable' };
  return { ok: true, text: text.trim() };
}
