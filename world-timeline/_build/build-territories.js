// 시기별 제국 영역 데이터 만들기
// 원자료: aourednik/historical-basemaps (GPL-3.0) — 교과서(비상교육 역사①) 연표에 맞게 시기·이름을 바로잡아 사용
// 사용: node build-territories.js <out.js>
const fs = require('fs');
const cache = {};
function load(y) { return cache[y] || (cache[y] = JSON.parse(fs.readFileSync(__dirname + '/world_' + y + '.geojson'))); }

// 색: 지역 계열별
const C = {
  china: '#e11d48', korea: '#f97316', japan: '#facc15', nomad: '#a16207', india: '#16a34a',
  persia: '#9333ea', islam: '#0f9f6e', rome: '#2563eb', europe: '#38bdf8', egypt: '#d97706',
  meso: '#c026d3', ottoman: '#14b8a6', uk: '#db2777', fr: '#3b82f6', es: '#f59e0b', pt: '#84cc16',
  nl: '#fb923c', ru: '#94a3b8', us: '#06b6d4', de: '#71717a', it: '#22c55e', jp: '#facc15',
  ussr: '#ef4444', prc: '#dc2626', hun: '#78716c'
};

// r(파일, 이름 정규식, 한글 이름, 색, [기준필드])
function r(file, re, ko, c, by) { return { file, re, ko, c, by: by || 'NAME' }; }

// 각 시기: [시작, 끝) 연도(기원전은 음수) — 교과서 연표 기준
const S = [
  { from: -3500, to: -1200, title: '고대 문명의 형성', rules: [
    r('bc1500', /^Egypt$/, '이집트', C.egypt), r('bc1500', /^Babylonia$/, '바빌로니아', C.meso), r('bc1500', /^Hittites$/, '히타이트', C.persia)] },
  { from: -1200, to: -550, title: '고대 제국과 폴리스의 등장', rules: [
    r('bc1000', /^Egypt$/, '이집트', C.egypt), r('bc1000', /^Assyria$/, '아시리아', C.meso),
    r('bc1000', /^Greek city-states$/, '그리스(폴리스)', C.rome)] },
  { from: -550, to: -334, title: '페르시아 제국과 그리스', rules: [
    r('bc500', /^Achaemenid Empire$/, '페르시아 제국(아케메네스 왕조)', C.persia), r('bc500', /^Greek city-states$/, '그리스(폴리스)', C.rome),
    r('bc500', /^Carthaginian Empire$/, '카르타고', C.egypt),
    r('bc500', /^Zhou states$/, '주(춘추 전국 시대)', C.china), r('bc500', /^Magadha$/, '마가다', C.india)] },
  { from: -334, to: -317, title: '알렉산드로스 제국', rules: [
    r('bc323', /^Empire of Alexander$/, '알렉산드로스 제국', C.rome), r('bc323', /^Rome$/, '로마', C.europe),
    r('bc323', /^Carthaginian Empire$/, '카르타고', C.egypt), r('bc323', /^(Zhou states|Qin)$/, '전국 시대 중국', C.china),
    r('bc323', /^Magadha$/, '마가다', C.india)] },
  { from: -317, to: -221, title: '헬레니즘 세계와 마우리아 왕조', rules: [
    r('bc300', /^Mauryan Empire$/, '마우리아 왕조', C.india), r('bc300', /^Seleucid Kingdom$/, '셀레우코스 왕조', C.persia),
    r('bc300', /^Ptolemaic Kingdom$/, '프톨레마이오스 왕조', C.egypt), r('bc300', /^Roman Republic$/, '로마(공화정)', C.rome),
    r('bc300', /^Carthaginian Empire$/, '카르타고', C.egypt), r('bc300', /^(Zhou states|Qin)$/, '전국 시대 중국', C.china),
    r('bc400', /^Gojoseon$/, '고조선', C.korea)] },
  { from: -221, to: -202, title: '진의 중국 통일', rules: [
    r('bc200', /^Han Empire$/, '진(秦)', C.china), r('bc200', /^Xiongnu$/, '흉노', C.nomad), r('bc200', /^Mauryan Empire$/, '마우리아 왕조', C.india),
    r('bc200', /^Rome$/, '로마(공화정)', C.rome), r('bc200', /^Carthage$/, '카르타고', C.egypt),
    r('bc200', /^Parthia$/, '파르티아', C.persia), r('bc200', /^Seleucid Kingdom$/, '셀레우코스 왕조', C.persia),
    r('bc200', /^Ptolemaic Kingdom$/, '프톨레마이오스 왕조', C.egypt), r('bc400', /^Gojoseon$/, '고조선', C.korea)] },
  { from: -202, to: -27, title: '한과 로마 공화정', rules: [
    r('bc100', /^Han Empire$/, '한', C.china), r('bc100', /^Xiongnu$/, '흉노', C.nomad), r('bc100', /^Roman Republic$/, '로마(공화정)', C.rome),
    r('bc100', /^Parthia$/, '파르티아', C.persia), r('bc100', /^Seleucid Kingdom$/, '셀레우코스 왕조', C.persia),
    r('bc100', /^Ptolemaic Kingdom$/, '프톨레마이오스 왕조', C.egypt)] },
  { from: -27, to: 25, title: '로마 제국과 한', rules: [
    r('bc1', /^Roman Empire$/, '로마 제국', C.rome), r('bc1', /^Han$/, '한', C.china), r('bc1', /^Parthian Empire$/, '파르티아', C.persia),
    r('bc1', /^Xiongnu$/, '흉노', C.nomad), r('bc1', /^Koguryo$/, '고구려', C.korea), r('bc1', /^Silla$/, '신라', C.korea)] },
  { from: 25, to: 220, title: '로마의 평화와 후한·쿠샨 왕조', rules: [
    r('100', /^Roman Empire$/, '로마 제국', C.rome), r('100', /^Han$/, '후한', C.china), r('100', /^Kushan Empire$/, '쿠샨 왕조', C.india),
    r('100', /^Parthian Empire$/, '파르티아', C.persia), r('100', /^Koguryo$/, '고구려', C.korea), r('100', /^Paekche$/, '백제', C.korea),
    r('100', /^Silla$/, '신라', C.korea)] },
  { from: 220, to: 320, title: '중국의 분열과 사산 왕조 페르시아', rules: [
    r('300', /^Rome \(/, '로마 제국', C.rome), r('300', /^Jin$/, '진(晉)', C.china), r('300', /^Parthian Empire$/, '사산 왕조 페르시아', C.persia),
    r('300', /^Koguryo$/, '고구려', C.korea), r('300', /^Paekche$/, '백제', C.korea), r('300', /^Silla$/, '신라', C.korea)] },
  { from: 320, to: 395, title: '굽타 왕조와 로마 제국', rules: [
    r('400', /^(Western|Eastern) Roman Empire$/, '로마 제국', C.rome), r('400', /^Gupta Empire$/, '굽타 왕조', C.india),
    r('400', /^Persia$/, '사산 왕조 페르시아', C.persia), r('400', /^Jin$/, '동진', C.china), r('400', /^Hunnic Empire$/, '훈족', C.hun),
    r('400', /^Koguryo$/, '고구려', C.korea), r('400', /^Paekche$/, '백제', C.korea), r('400', /^Silla$/, '신라', C.korea)] },
  { from: 395, to: 439, title: '로마 제국의 분열', rules: [
    r('400', /^Western Roman Empire$/, '서로마 제국', C.europe), r('400', /^Eastern Roman Empire$/, '동로마(비잔티움) 제국', C.rome),
    r('400', /^Gupta Empire$/, '굽타 왕조', C.india), r('400', /^Persia$/, '사산 왕조 페르시아', C.persia), r('400', /^Jin$/, '동진', C.china),
    r('400', /^Hunnic Empire$/, '훈족', C.hun), r('400', /^Koguryo$/, '고구려', C.korea), r('400', /^Paekche$/, '백제', C.korea), r('400', /^Silla$/, '신라', C.korea)] },
  { from: 439, to: 476, title: '남북조 시대', rules: [
    r('500', /^Toba Wei$/, '북위(북조)', C.nomad), r('500', /^Jin Empire$/, '남조', C.china),
    r('400', /^Western Roman Empire$/, '서로마 제국', C.europe), r('500', /^Eastern Roman Empire$/, '동로마(비잔티움) 제국', C.rome),
    r('500', /^Gupta Empire$/, '굽타 왕조', C.india), r('500', /^Sasanian Empire$/, '사산 왕조 페르시아', C.persia),
    r('500', /^Koguryo$/, '고구려', C.korea), r('500', /^Paekche$/, '백제', C.korea), r('500', /^Silla$/, '신라', C.korea)] },
  { from: 476, to: 589, title: '서로마 멸망 이후', rules: [
    r('500', /^Toba Wei$/, '북조', C.nomad), r('500', /^Jin Empire$/, '남조', C.china), r('500', /^Eastern Roman Empire$/, '비잔티움 제국', C.rome),
    r('500', /^Franks$/, '프랑크 왕국', C.europe), r('500', /^Gupta Empire$/, '굽타 왕조', C.india), r('500', /^Sasanian Empire$/, '사산 왕조 페르시아', C.persia),
    r('500', /^Koguryo$/, '고구려', C.korea), r('500', /^Paekche$/, '백제', C.korea), r('500', /^Silla$/, '신라', C.korea), r('500', /^Yamato$/, '왜', C.japan)] },
  { from: 589, to: 618, title: '수의 중국 통일', rules: [
    r('600', /^Sui Empire$/, '수', C.china), r('600', /^Eastern Roman Empire$/, '비잔티움 제국', C.rome), r('600', /^Frankish Kingdom$/, '프랑크 왕국', C.europe),
    r('600', /^Sasanian Empire$/, '사산 왕조 페르시아', C.persia), r('600', /^Koguryo$/, '고구려', C.korea), r('600', /^Paekche$/, '백제', C.korea),
    r('600', /^Silla$/, '신라', C.korea), r('600', /^Yamato$/, '왜', C.japan)] },
  { from: 618, to: 661, title: '당의 건국과 이슬람교의 등장', rules: [
    r('600', /^Sui Empire$/, '당', C.china), r('600', /^Eastern Roman Empire$/, '비잔티움 제국', C.rome), r('600', /^Frankish Kingdom$/, '프랑크 왕국', C.europe),
    r('600', /^Sasanian Empire$/, '사산 왕조 페르시아', C.persia), r('600', /^Koguryo$/, '고구려', C.korea), r('600', /^Paekche$/, '백제', C.korea),
    r('600', /^Silla$/, '신라', C.korea), r('600', /^Yamato$/, '왜(일본)', C.japan)] },
  { from: 661, to: 750, title: '당과 우마이야 왕조', rules: [
    r('700', /^Sui Empire$/, '당', C.china), r('700', /^Umayyad Caliphate$/, '우마이야 왕조', C.islam), r('700', /^Eastern Roman Empire$/, '비잔티움 제국', C.rome),
    r('700', /^Frankish Kingdom$/, '프랑크 왕국', C.europe), r('900', /^Silla$/, '신라', C.korea), r('900', /^Balhae$/, '발해', C.korea), r('700', /^Yamato$/, '일본', C.japan)] },
  { from: 750, to: 907, title: '당과 아바스 왕조, 카롤루스 대제', rules: [
    r('800', /^Tang Empire$/, '당', C.china), r('800', /^Abbasid Caliphate$/, '아바스 왕조', C.islam), r('800', /^Byzantine Empire$/, '비잔티움 제국', C.rome),
    r('800', /^Carolingian Empire$/, '프랑크 왕국', C.europe), r('900', /^Silla$/, '신라', C.korea), r('900', /^Balhae$/, '발해', C.korea), r('800', /^Japan$/, '일본', C.japan)] },
  { from: 907, to: 960, title: '5대 10국과 거란', rules: [
    r('900', /^Tang Empire$/, '5대 10국', C.china), r('900', /^Khitans$/, '거란(요)', C.nomad), r('900', /^Abbasid Caliphate$/, '아바스 왕조', C.islam),
    r('900', /^Byzantine Empire$/, '비잔티움 제국', C.rome), r('900', /^Carolingian Empire$/, '프랑크 왕국(분열)', C.europe),
    r('1000', /^Korea$/, '고려', C.korea), r('900', /^Yamato$/, '일본', C.japan)] },
  { from: 960, to: 1100, title: '송과 요, 셀주크 튀르크', rules: [
    r('1000', /^Song Empire$/, '송', C.china), r('1000', /^Liao$/, '요(거란)', C.nomad), r('1000', /^Korea$/, '고려', C.korea),
    r('1000', /^Imperial Japan/, '일본', C.japan), r('1000', /^Byzantine Empire$/, '비잔티움 제국', C.rome), r('1000', /^Holy Roman Empire$/, '신성 로마 제국', C.europe),
    r('1000', /^Fatimid Caliphate$/, '파티마 왕조', C.islam), r('1000', /^Caliphate of Córdoba$/, '후우마이야 왕조', C.islam),
    r('1100', /^Seljuk Empire$/, '셀주크 튀르크', C.ottoman)] },
  { from: 1100, to: 1127, title: '십자군 전쟁과 송·요', rules: [
    r('1100', /^Song Empire$/, '북송', C.china), r('1100', /^Liao$/, '요(거란)', C.nomad), r('1100', /^Korea$/, '고려', C.korea),
    r('1100', /^Imperial Japan/, '일본', C.japan), r('1100', /^Byzantine Empire$/, '비잔티움 제국', C.rome), r('1100', /^Holy Roman Empire$/, '신성 로마 제국', C.europe),
    r('1100', /^Seljuk Empire$/, '셀주크 튀르크', C.ottoman), r('1100', /^Fatimid Caliphate$/, '파티마 왕조', C.islam)] },
  { from: 1127, to: 1206, title: '남송과 금', rules: [
    r('1200', /^Song Empire$/, '남송', C.china), r('1200', /^Liao$/, '금', C.nomad), r('1200', /^Goryeo$/, '고려', C.korea),
    r('1200', /^Imperial Japan/, '일본', C.japan), r('1200', /^Byzantine Empire$/, '비잔티움 제국', C.rome),
    r('1200', /^Holy Roman Empire$/, '신성 로마 제국', C.europe)] },
  { from: 1206, to: 1271, title: '몽골 제국의 성립', rules: [
    r('1200', /^Mongol Empire$/, '몽골 제국', C.nomad), r('1200', /^Song Empire$/, '남송', C.china), r('1200', /^Liao$/, '금(1234 멸망)', C.china),
    r('1200', /^Goryeo$/, '고려', C.korea), r('1279', /^Shogun Japan/, '일본(가마쿠라 막부)', C.japan), r('1200', /^Byzantine Empire$/, '비잔티움 제국', C.rome),
    r('1200', /^Holy Roman Empire$/, '신성 로마 제국', C.europe), r('1200', /^Sultanate of Delhi$/, '델리 술탄 왕조', C.india)] },
  { from: 1271, to: 1368, title: '원과 몽골의 울루스', rules: [
    r('1300', /^Great Khanate$/, '원', C.nomad), r('1300', /^Ilkhanate$/, '일 칸국', C.nomad), r('1300', /^Khanate of the Golden Horde$/, '킵차크 칸국', C.nomad),
    r('1300', /^Chagatai Khanate$/, '차가타이 칸국', C.nomad), r('1200', /^Goryeo$/, '고려', C.korea), r('1300', /^Shogun Japan/, '일본(막부)', C.japan),
    r('1300', /^Mamluke Sultanate$/, '맘루크 왕조', C.islam), r('1300', /^Byzantine Empire$/, '비잔티움 제국', C.rome),
    r('1300', /^Holy Roman Empire$/, '신성 로마 제국', C.europe)] },
  { from: 1368, to: 1453, title: '명의 건국과 오스만 제국의 성장', rules: [
    r('1500', /^Ming Chinese Empire$/, '명', C.china), r('1500', /^Korea$/, '조선(1392~)', C.korea), r('1400', /^Shogun Japan/, '일본(무로마치 막부)', C.japan),
    r('1400', /^Timurid Empire$/, '티무르 왕조', C.persia), r('1400', /^Ottoman Empire$/, '오스만 제국', C.ottoman),
    r('1400', /^Byzantine Empire$/, '비잔티움 제국', C.rome), r('1400', /^Holy Roman Empire$/, '신성 로마 제국', C.europe),
    r('1400', /^Mamluke Sultanate$/, '맘루크 왕조', C.islam), r('1400', /^Sultanate of Delhi$/, '델리 술탄 왕조', C.india)] },
  { from: 1453, to: 1526, title: '신항로 개척의 시대', rules: [
    r('1500', /^Ming Chinese Empire$/, '명', C.china), r('1500', /^Korea$/, '조선', C.korea), r('1500', /^Japan$/, '일본(무로마치 막부)', C.japan),
    r('1500', /^Ottoman Empire$/, '오스만 제국', C.ottoman), r('1500', /^Holy Roman Empire$/, '신성 로마 제국', C.europe),
    r('1500', /^Mamluke Sultanate$/, '맘루크 왕조', C.islam), r('1500', /^Sultanate of Delhi$/, '델리 술탄 왕조', C.india),
    r('1500', /^Portugal$/, '포르투갈', C.pt), r('1500', /^Castille$/, '에스파냐(카스티야)', C.es), r('1500', /^England$/, '영국', C.uk), r('1500', /^France$/, '프랑스', C.fr)] },
  { from: 1526, to: 1644, title: '무굴 제국과 명, 에스파냐의 식민지', rules: [
    r('1600', /^Ming Chinese Empire$/, '명', C.china), r('1600', /^Korea$/, '조선', C.korea), r('1600', /^Japan/, '일본(1603 에도 막부)', C.japan),
    r('1600', /^Mughal Empire$/, '무굴 제국', C.india), r('1600', /^Safavid Empire$/, '사파비 왕조', C.persia), r('1600', /^Ottoman Empire$/, '오스만 제국', C.ottoman),
    r('1600', /^Holy Roman Empire$/, '신성 로마 제국', C.europe), r('1600', /^(Spain|Viceroyalty of New Spain|Cuba \(Spain\)|Hispaniola \(Spain\))$/, '에스파냐와 식민지', C.es),
    r('1600', /^Portugal$/, '포르투갈', C.pt), r('1600', /^England and Ireland$/, '영국', C.uk), r('1600', /^France$/, '프랑스', C.fr)] },
  { from: 1644, to: 1776, title: '청과 에도 막부, 유럽의 식민지 경쟁', rules: [
    r('1700', /^Manchu Empire$/, '청', C.china), r('1700', /^Korea$/, '조선', C.korea), r('1700', /^Tokugawa shogunate$/, '일본(에도 막부)', C.japan),
    r('1700', /^Mughal Empire$/, '무굴 제국', C.india), r('1700', /^Safavid Empire$/, '사파비 왕조', C.persia), r('1700', /^Ottoman Empire$/, '오스만 제국', C.ottoman),
    r('1700', /^Holy Roman Empire$/, '신성 로마 제국', C.europe), r('1700', /Spanish Habsburg/, '에스파냐와 식민지', C.es, 'SUBJECTO'),
    r('1700', /^(Portugal|Portuguese Brazil)$/, '포르투갈과 식민지', C.pt), r('1700', /^England and Ireland$/, '영국', C.uk), r('1700', /^England$/, '영국 식민지', C.uk, 'SUBJECTO'),
    r('1700', /^(France|New France)$/, '프랑스와 식민지', C.fr)] },
  { from: 1776, to: 1840, title: '시민 혁명과 라틴 아메리카의 독립', rules: [
    r('1815', /^Manchu Empire$/, '청', C.china), r('1815', /^Korea$/, '조선', C.korea), r('1815', /^Japan$/, '일본(에도 막부)', C.japan),
    r('1815', /^Ottoman Empire$/, '오스만 제국', C.ottoman), r('1815', /^Russian Empire$/, '러시아 제국', C.ru), r('1815', /^United States$/, '미국', C.us),
    r('1815', /^(United Kingdom|United Kingdom of Great Britain and Ireland)$/, '영국과 식민지', C.uk, 'SUBJECTO'),
    r('1815', /^France$/, '프랑스', C.fr), r('1815', /^Spain$/, '에스파냐와 식민지', C.es, 'SUBJECTO'), r('1815', /^Portugal$/, '포르투갈과 식민지', C.pt, 'SUBJECTO'),
    r('1815', /^Austrian Empire$/, '오스트리아 제국', C.europe), r('1815', /^Prussia$/, '프로이센', C.de)] },
  { from: 1840, to: 1880, title: '아편 전쟁과 국민 국가의 성장', rules: [
    r('1880', /^Manchu Empire$/, '청', C.china), r('1880', /^Korea$/, '조선', C.korea), r('1880', /^Imperial Japan$/, '일본', C.jp),
    r('1880', /^Ottoman Empire$/, '오스만 제국', C.ottoman), r('1880', /^Russian Empire$/, '러시아 제국', C.ru), r('1880', /^United States of America$/, '미국', C.us),
    r('1880', /^(United Kingdom|United Kingdom of Great Britain and Ireland)$/, '영국과 식민지', C.uk, 'SUBJECTO'), r('1880', /^British Raj$/, '영국령 인도', C.uk),
    r('1880', /^France$/, '프랑스와 식민지', C.fr, 'SUBJECTO'), r('1880', /^Germany$/, '독일(1871 통일)', C.de), r('1880', /^Italy$/, '이탈리아', C.it),
    r('1880', /^Austria Hungary$/, '오스트리아·헝가리', C.europe)] },
  { from: 1880, to: 1914, title: '제국주의 열강의 침략', rules: [
    r('1900', /^Manchu Empire$/, '청', C.china), r('1900', /^Korea$/, '조선(대한 제국)', C.korea), r('1900', /^Imperial Japan$/, '일본', C.jp),
    r('1900', /^Ottoman Empire$/, '오스만 제국', C.ottoman), r('1900', /^Russian Empire$/, '러시아 제국', C.ru), r('1900', /^United States of America$/, '미국', C.us),
    r('1900', /^(United Kingdom|United Kingdom of Great Britain and Ireland)$/, '영국과 식민지', C.uk, 'SUBJECTO'),
    r('1900', /^France$/, '프랑스와 식민지', C.fr, 'SUBJECTO'), r('1900', /^Germany$/, '독일과 식민지', C.de, 'SUBJECTO'),
    r('1900', /^Portugal$/, '포르투갈과 식민지', C.pt, 'SUBJECTO'), r('1900', /^Italy$/, '이탈리아와 식민지', C.it, 'SUBJECTO'),
    r('1900', /^Netherlands$/, '네덜란드와 식민지', C.nl, 'SUBJECTO'), r('1900', /^Austria Hungary$/, '오스트리아·헝가리', C.europe)] },
  { from: 1914, to: 1919, title: '제1차 세계 대전', rules: [
    r('1914', /^Empire of Japan$/, '일본(식민지 포함)', C.jp), r('1914', /^Ottoman Empire$/, '오스만 제국', C.ottoman), r('1914', /^Russian Empire$/, '러시아 제국', C.ru),
    r('1914', /^United States$/, '미국', C.us), r('1914', /^(United Kingdom|United Kingdom of Great Britain and Ireland)$/, '영국과 식민지', C.uk, 'SUBJECTO'),
    r('1914', /^France$/, '프랑스와 식민지', C.fr, 'SUBJECTO'), r('1914', /^(German Empire|Germany)$/, '독일과 식민지', C.de, 'SUBJECTO'),
    r('1914', /^Austro-Hungarian Empire$/, '오스트리아·헝가리', C.europe), r('1914', /^(Kingdom of Italy|Italy)$/, '이탈리아와 식민지', C.it, 'SUBJECTO')] },
  { from: 1919, to: 1937, title: '베르사유 체제와 대공황', rules: [
    r('1920', /^Empire of Japan$/, '일본(식민지 포함)', C.jp, 'SUBJECTO'), r('1920', /^(USSR|White Russia|South Russia)$/, '소련(1922 수립)', C.ussr), r('1920', /^United States$/, '미국', C.us),
    r('1920', /^United Kingdom/, '영국과 식민지', C.uk, 'SUBJECTO'), r('1920', /^France$/, '프랑스와 식민지', C.fr, 'SUBJECTO'),
    r('1920', /^(Germany|East Prussia)$/, '독일', C.de), r('1920', /^Italy$/, '이탈리아와 식민지', C.it, 'SUBJECTO'), r('1938', /^Turkey$/, '튀르키예 공화국(1923~)', C.ottoman)] },
  { from: 1937, to: 1945, title: '중일 전쟁과 제2차 세계 대전', rules: [
    r('1938', /^Empire of Japan$/, '일본(식민지·점령지 포함)', C.jp, 'SUBJECTO'), r('1938', /^USSR$/, '소련', C.ussr), r('1938', /^United States$/, '미국', C.us),
    r('1938', /^United Kingdom/, '영국과 식민지', C.uk, 'SUBJECTO'), r('1938', /^France$/, '프랑스와 식민지', C.fr, 'SUBJECTO'),
    r('1938', /^Germany$/, '독일', C.de), r('1938', /^Italy$/, '이탈리아와 식민지', C.it, 'SUBJECTO')] },
  { from: 1945, to: 1991, title: '냉전 체제 (빨강: 공산주의 진영 · 하늘: 자본주의 진영)', rules: [
    r('1960', /^USSR$/, '소련', C.ussr), r('1960', /^China$/, '중화 인민 공화국', C.prc), r('1960', /^Mongolia$/, '몽골', C.ussr),
    r('1960', /^Korea, Democratic/, '북한', C.ussr), r('1960', /^East Germany$/, '동독', C.ussr),
    r('1960', /^United States$/, '미국', C.us), r('1960', /^Korea, Republic of$/, '대한민국', C.us), r('1960', /^Japan$/, '일본', C.us),
    r('1960', /^West Germany$/, '서독', C.us), r('1960', /^United Kingdom$/, '영국', C.us), r('1960', /^France$/, '프랑스', C.us)] },
  { from: 1991, to: 2031, title: '냉전 이후와 세계화', rules: [
    r('1994', /^Russia$/, '러시아', C.ru), r('1994', /^China$/, '중국', C.prc), r('1994', /^United States$/, '미국', C.us),
    r('1994', /^Korea, Republic of$/, '대한민국', C.korea), r('1994', /^Korea, Democratic/, '북한', C.ru), r('1994', /^Japan$/, '일본', C.jp),
    r('1994', /^(Germany|France|United Kingdom|Italy|Spain|Portugal|Netherlands|Belgium|Luxembourg|Denmark|Ireland|Greece|Austria|Sweden|Finland)$/, '유럽 연합(EU)', C.europe)] }
];

// ---- 단순화 ----
function sqd(p, a, b) { let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y; if (dx || dy) { const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy); if (t > 1) { x = b[0]; y = b[1]; } else if (t > 0) { x += dx * t; y += dy * t; } } dx = p[0] - x; dy = p[1] - y; return dx * dx + dy * dy; }
function dp(pts, tol) { const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]]; while (st.length) { const [f, l] = st.pop(); let md = 0, idx = 0; for (let i = f + 1; i < l; i++) { const d = sqd(pts[i], pts[f], pts[l]); if (d > md) { md = d; idx = i; } } if (md > tol * tol) { keep[idx] = 1; st.push([f, idx], [idx, l]); } } return pts.filter((_, i) => keep[i]); }
function area(ring) { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); return Math.abs(a / 2); }
function simpRing(ring) { const s = dp(ring, 0.12).map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]); return s.length >= 4 ? s : null; }
function polys(geom) { return geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : []; }

const out = [];
let totalWarn = [];
for (const s of S) {
  const ents = [];
  for (const rule of s.rules) {
    const g = load(rule.file);
    const feats = g.features.filter(f => rule.re.test(String(f.properties[rule.by] || '')) || (rule.by === 'SUBJECTO' && rule.re.test(String(f.properties.NAME || ''))));
    if (!feats.length) { totalWarn.push(s.from + ' ' + rule.ko + ' (' + rule.file + ') 없음'); continue; }
    let ent = ents.find(e => e.n === rule.ko);
    if (!ent) { ent = { n: rule.ko, c: rule.c, p: [] }; ents.push(ent); }
    for (const f of feats) for (const poly of polys(f.geometry)) {
      if (area(poly[0]) < 0.4) continue;
      const outer = simpRing(poly[0]); if (!outer) continue;
      const holes = poly.slice(1).filter(h => area(h) > 2).map(simpRing).filter(Boolean);
      ent.p.push([outer, ...holes]);
    }
    if (!ent.p.length) totalWarn.push(s.from + ' ' + rule.ko + ' 도형 없음');
  }
  out.push({ from: s.from, to: s.to, title: s.title, e: ents.filter(e => e.p.length) });
}
const js = '// 시기별 제국 영역(대략적 범위). 원자료: historical-basemaps (A. Ourednik, GPL-3.0), 교과서 연표에 맞춰 시기·이름 조정\nwindow.TERRITORIES=' + JSON.stringify(out) + ';\n';
fs.writeFileSync(process.argv[2], js);
console.log('size', (js.length / 1024).toFixed(0) + 'KB'); console.log(totalWarn.join('\n'));
