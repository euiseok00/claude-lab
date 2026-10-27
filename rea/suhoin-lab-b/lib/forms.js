// 폼 정의와 서버 검증. 화면 렌더링도 이 정의를 쓴다.
const opts = (s) => s.split(',');
const DISABILITY = opts('지체장애,지적장애,발달장애,자폐성장애,시각장애,청각장애,신장장애,정신장애,기타');

const inquiry = [
  { n: 'company', label: '기업명', type: 'text', req: 1 },
  { n: 'name', label: '담당자 이름', type: 'text', req: 1 },
  { n: 'title', label: '담당자 부서/직함', type: 'text' },
  { n: 'phone', label: '담당자 연락처', type: 'tel', req: 1, ph: '010-0000-0000' },
  { n: 'email', label: '담당자 이메일', type: 'email', req: 1 },
  { n: 'address', label: '기업주소', type: 'address', req: 1 },
  { n: 'employees', label: '상시 근로자', type: 'number', req: 1 },
  { n: 'disabled', label: '현재 고용된 장애인 수', type: 'number', req: 1 },
  { n: 'source', label: '유입경로', type: 'radio', options: opts('네이버 검색,네이버 카페,블로그 및 인스타,소개,홍보물,기타') },
  { n: 'message', label: '문의내용', type: 'textarea', req: 1, max: 2000 },
  { n: 'agree', label: '개인정보처리방침에 동의합니다.', type: 'consent', req: 1 },
];

const jobs = [
  ['예술(미술)', opts('그림,회화,서양화,동양화,수채화,유화,정물화,캘리그라피,공예,도예,도자기,조각,웹디자인,그래픽디자인,포스터제작,일러스트,서예,영상편집,캐드 디자인,재봉,기타')],
  ['예술(음악)', opts('합창,성악,영상,클래식,기타')],
  ['예술(무용)', opts('한국무용,현대무용,민속무용,실용무용(K-POP댄스/힙합),발레,기타')],
  ['예술(악기)', opts('국악기,사물놀이,핸드벨,피아노,기타(악기),첼로,바이올린,하모니카,기타')],
];

const employment = [
  { g: '개인정보', n: 'name', label: '성함', type: 'text', req: 1 },
  { n: 'phone', label: '연락처', type: 'tel', req: 1, ph: '010-0000-0000' },
  { n: 'emergency', label: '비상연락처(관계)', type: 'select', options: opts('본인,부,모,형제,자매,친인척,기타') },
  { n: 'gender', label: '성별', type: 'radio', req: 1, options: opts('남자,여자') },
  { n: 'email', label: '이메일', type: 'email', req: 1 },
  { n: 'address', label: '주소', type: 'address' },
  { g: '지원구분', n: 'kind', label: '구분', type: 'radio', req: 1, options: opts('신입,경력') },
  { n: 'hours', label: '희망근무시간', type: 'radio', options: opts('모두가능,오전만 가능,오후만 가능') },
  { n: 'basic', label: '기초생활수급자', type: 'radio', options: opts('대상,비대상') },
  { n: 'veteran', label: '보훈대상자', type: 'radio', options: opts('대상,비대상') },
  { n: 'merit', label: '국가유공자상이등급', type: 'select', options: opts('1급,2급,3급') },
  { g: '지원분야', n: 'remote', label: '재택근무', type: 'radio', options: opts('희망,비희망') },
  { n: 'jobs', label: '지원직무', type: 'checks', req: 1, groups: jobs },
  { g: '장애정보', n: 'disability', label: '주된장애', type: 'select', req: 1, options: DISABILITY },
  { n: 'disability2', label: '차상위장애', type: 'select', options: DISABILITY },
  { n: 'severe', label: '중증장애인 해당 여부', type: 'radio', options: opts('예,아니오') },
  { n: 'registered', label: '장애인복지법에 따른 최초등록일자', type: 'date' },
  { g: '경력', n: 'prevCompany', label: '회사명', type: 'text' },
  { n: 'from', label: '재직기간 입사일', type: 'date' },
  { n: 'to', label: '퇴사일', type: 'date' },
  { n: 'status', label: '재직 상태', type: 'radio', options: opts('퇴사,재직중') },
  { n: 'reason', label: '퇴사사유', type: 'select', options: opts('개인사정,이직,건강,기타') },
  { n: 'duty', label: '담당업무', type: 'select', options: opts('예술,사무보조,체육,기타') },
  { g: '동의', n: 'agree', label: '개인정보처리방침에 동의합니다.', type: 'consent', req: 1 },
];

const SPECS = { inquiry, employment };

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s && s >= '1920-01-01' && d <= new Date();
}

// 반환: { errors, data }. errors가 비어 있어야 저장한다.
function validate(kind, body) {
  const errors = {};
  const data = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: { _: '잘못된 요청입니다.' }, data };
  for (const f of SPECS[kind]) {
    let v = body[f.n];
    if (f.type === 'checks') {
      const all = f.groups.flatMap(([g, items]) => items.map((i) => g + '/' + i));
      v = Array.isArray(v) ? v : [];
      if (v.some((x) => !all.includes(x))) errors[f.n] = '잘못된 선택입니다.';
      else if (f.req && !v.length) errors[f.n] = '하나 이상 선택해 주세요.';
      else data[f.n] = v;
      continue;
    }
    if (f.type === 'consent') {
      if (v !== true && v !== 'on') errors[f.n] = '동의가 필요합니다.';
      else data[f.n] = true;
      continue;
    }
    v = typeof v === 'string' ? v.trim() : v == null ? '' : null;
    if (v === null) { errors[f.n] = '잘못된 값입니다.'; continue; }
    if (!v) { if (f.req) errors[f.n] = '필수 항목입니다.'; continue; }
    const max = f.max || 200;
    let bad = '';
    if (v.length > max) bad = `${max}자 이내로 입력해 주세요.`;
    else if (f.type === 'tel' && !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(v)) bad = '전화번호 형식이 올바르지 않습니다.';
    else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = '이메일 형식이 올바르지 않습니다.';
    else if (f.type === 'number' && !/^\d{1,7}$/.test(v)) bad = '0 이상의 정수를 입력해 주세요.';
    else if (f.type === 'date' && !validDate(v)) bad = '날짜가 올바르지 않습니다.';
    else if ((f.type === 'select' || f.type === 'radio') && !f.options.includes(v)) bad = '잘못된 선택입니다.';
    if (bad) errors[f.n] = bad;
    else data[f.n] = v;
  }
  return { errors, data };
}

module.exports = { SPECS, validate };
