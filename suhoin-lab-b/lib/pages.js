const { SPECS } = require('./forms');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const img = (w, h, t, cls = '') => `<img class="${cls}" src="/img/ph.svg?w=${w}&h=${h}&t=${encodeURIComponent(t)}" width="${w}" height="${h}" alt="${esc(t)}">`;

const MENU = [
  { t: '회사소개', base: 'company', sub: '수호인은 장애예술인과 함께합니다', items: [['overview', '기업소개'], ['greetings', 'CEO인사말'], ['history', '연혁'], ['organization', '조직도'], ['vision', 'MISSION & VISION'], ['service', '고객서비스 현장'], ['location', '오시는 길']] },
  { t: '사업소개', base: 'business', sub: '예술로 만드는 일자리', items: [['overview', '사업 소개'], ['effect', '장애예술인 고용효과'], ['program_2', '장애예술인 프로그램']] },
  { t: '장애예술인 일자리 지원', base: 'support', sub: '고용의무 이행을 돕습니다', items: [['system', '장애인고용의무제도'], ['account', '고용부담금 절감']] },
  { t: '견적문의', base: 'customer', sub: '맞춤 견적을 안내해 드립니다', items: [['inquiry', '견적문의']] },
  { t: '입사지원', base: 'employment', sub: '함께할 장애예술인을 찾습니다', items: [['overview', '입사지원 안내'], ['write', '입사지원서 작성']] },
];
const DOCS = { policy: '이용약관', private: '개인정보처리방침', antiemail: '이메일무단수집거부' };
const COMPANY = { name: '(주)수호인(학습용 더미)', addr: '서울특별시 중구 학습로 1, 5층 (더미 주소)', tel: '000-0000-0000', hours: '평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00, 주말·공휴일 휴무)' };

const p = (...a) => a.map((t) => `<p>${t}</p>`).join('');
const cards = (list) => `<div class="cards">${list.map(([h, t]) => `<div class="card"><h3>${h}</h3><p>${t}</p></div>`).join('')}</div>`;
const lorem = '학습용으로 작성한 안내 문구입니다. 실제 서비스의 문구가 아니며 화면 구성을 확인하기 위한 내용입니다.';

// ---- 계산기 ----
function calc() {
  const num = (name, label) => `<div class="row"><label for="c-${name}">${label}</label><span class="stepper"><button type="button" data-step="-1" data-for="c-${name}" aria-label="${label} 1 감소">−</button><input id="c-${name}" name="${name}" type="number" min="0" step="1" value="0"><button type="button" data-step="1" data-for="c-${name}" aria-label="${label} 1 증가">＋</button></span></div>`;
  return `<form id="calc" class="calc" novalidate>
<h3>장애인고용부담금 절감금액</h3>
<fieldset><legend>1. 사업체 구분 선택</legend>
<label><input type="radio" name="type" value="private" checked> 민간사업주</label>
<label><input type="radio" name="type" value="public"> 공공기관/지방공기업</label>
<label><input type="radio" name="type" value="gov"> 국가/자치단체(공무원 아닌 근로자)</label></fieldset>
<fieldset><legend>2. 전체 근로자수(상시근로자수)</legend>
<div class="row"><input id="c-workers" name="workers" type="number" min="0" step="1" value="0" aria-label="전체 근로자수">
${[1000, 100, 10, 1].map((n) => `<button type="button" data-add="${n}">+${n}</button>`).join('')}<button type="button" data-reset="workers">초기화</button></div></fieldset>
<fieldset><legend>3. 현재 고용된 장애인 근로자수(명)</legend>
${num('mild', '경증 장애인')}${num('severe60', '중증 장애인(월 60시간 이상)')}${num('severeUnder', '중증 장애인(월 60시간 미만)')}</fieldset>
<div class="btns"><button type="submit" class="primary">부담금 조회</button><button type="reset">재입력</button></div>
<p id="calc-msg" class="msg" role="alert"></p>
<div class="result" aria-live="polite"><h4>예상납부금액</h4><dl>
<dt>의무 고용인원</dt><dd><b id="r-obligation">0</b>명</dd>
<dt>미달 고용인원</dt><dd><b id="r-shortfall">0</b>명</dd>
<dt>장애인 고용 부담금(매월)</dt><dd><b id="r-monthly">0</b>원</dd>
${[2026, 2025, 2024, 2023].map((y) => `<dt>연간(${y}년)</dt><dd><b id="r-y${y}">0</b>원</dd>`).join('')}
<dt class="total">총 납부금액(부담금) 연간</dt><dd class="total"><b id="r-total">0</b>원</dd></dl>
<small>위 계산은 참고용으로 실제 납부금액과 차이가 있을 수 있습니다.</small></div></form>`;
}

// ---- 폼 ----
function field(f) {
  const id = 'f-' + f.n;
  const req = f.req ? ' <em class="req" aria-hidden="true">*</em>' : '';
  const r = f.req ? ' required' : '';
  const err = `<span class="err" data-err="${f.n}" role="alert"></span>`;
  let c;
  switch (f.type) {
    case 'textarea': c = `<textarea id="${id}" name="${f.n}" rows="6" maxlength="${f.max}"${r}></textarea>`; break;
    case 'select': c = `<select id="${id}" name="${f.n}"${r}><option value="">선택</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`; break;
    case 'radio': return `<fieldset class="fld"><legend>${f.label}${req}</legend>${f.options.map((o) => `<label><input type="radio" name="${f.n}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}${err}</fieldset>`;
    case 'checks': return `<fieldset class="fld"><legend>${f.label}${req}</legend>${f.groups.map(([g, items]) => `<div class="grp"><b>${g}</b>${items.map((i) => `<label><input type="checkbox" name="${f.n}" value="${esc(g + '/' + i)}"> ${esc(i)}</label>`).join('')}</div>`).join('')}${err}</fieldset>`;
    case 'consent': return `<div class="fld"><label><input type="checkbox" name="${f.n}"> ${f.label} <a href="/doc/private" target="_blank">보기</a></label>${err}</div>`;
    case 'address': c = `<span class="addr"><input id="${id}" name="${f.n}" type="text" maxlength="200"${r}> <button type="button" data-postcode>우편번호 검색</button></span>`; break;
    default: c = `<input id="${id}" name="${f.n}" type="${f.type}"${f.type === 'number' ? ' min="0" step="1"' : f.type === 'date' ? ' min="1920-01-01"' : ' maxlength="200"'}${f.ph ? ` placeholder="${f.ph}"` : ''}${r}>`;
  }
  return `<div class="fld"><label for="${id}">${f.label}${req}</label>${c}${err}</div>`;
}
function form(kind, submit) {
  let g = '';
  const body = SPECS[kind].map((f) => {
    let h = '';
    if (f.g && f.g !== g) { g = f.g; h = `<h3 class="grp-h">${f.g}</h3>`; }
    return h + field(f);
  }).join('');
  return `<p class="notice">학습용 사이트입니다. 실제 개인정보를 입력하지 말고 더미 값만 입력하세요. 접수 내용은 이 서버에만 저장됩니다.</p>
<form class="form" data-form="${kind}" novalidate>${body}<p id="form-msg" class="msg" role="alert"></p><button type="submit" class="primary">${submit}</button></form>`;
}

// ---- 정적 페이지 본문 ----
const feeRows = [['의무의 3/4 이상', '1,295,000', '15,540,000'], ['1/2 이상 3/4 미만', '1,372,700', '16,472,400'], ['1/4 이상 1/2 미만', '1,554,000', '18,648,000'], ['1/4 미만', '1,813,000', '21,756,000'], ['전혀 고용하지 않음', '2,156,880', '25,882,560']];
const T = {
  'company/overview': p('수호인은 장애예술인의 창작 활동과 일자리를 연결하는 학습용 가상 기업입니다.', lorem) + cards([['예술', '창작 활동을 일자리로 연결합니다.'], ['고용', '장애인 고용의무 이행을 지원합니다.'], ['동행', '기업과 예술인이 함께 성장합니다.']]) + img(960, 320, '기업소개 이미지', 'wide'),
  'company/greetings': `<div class="two">${img(280, 340, 'CEO 사진')}<div>${p('안녕하십니까. 수호인을 찾아 주셔서 감사합니다.', '저희는 장애예술인이 재능을 발휘하고 안정적으로 일할 수 있는 환경을 만들고자 합니다.', lorem, '<b>대표이사 홍길동(더미)</b>')}</div></div>`,
  'company/history': `<ul class="timeline">${[['2026', '학습용 사이트 개설'], ['2024', '장애예술인 창작 갤러리 운영 시작'], ['2022', '고용 지원 서비스 확대'], ['2020', '법인 설립(가상)']].map(([y, t]) => `<li><b>${y}</b><span>${t}</span></li>`).join('')}</ul>`,
  'company/organization': img(960, 420, '조직도 이미지', 'wide') + p('대표이사 아래 사업본부, 경영지원팀, 예술지원팀을 둔 학습용 조직도입니다.'),
  'company/vision': p('<b>MISSION</b> 예술을 통해 장애인의 자립과 사회 참여를 돕습니다.', '<b>VISION</b> 모든 예술인이 일터에서 빛나는 사회.') + cards([['존중', '개인의 재능을 먼저 봅니다.'], ['전문', '현장에 맞는 서비스를 제공합니다.'], ['신뢰', '투명하게 소통합니다.']]),
  'company/service': p(lorem) + `<div class="cards">${[1, 2, 3].map((i) => `<div class="card">${img(280, 180, '고객서비스 현장 ' + i)}<p>현장 ${i}</p></div>`).join('')}</div>`,
  'company/location': `<div class="map">${img(960, 360, '지도 영역(플레이스홀더)', 'wide')}</div><dl class="info"><dt>주소</dt><dd>${COMPANY.addr}</dd><dt>전화</dt><dd>${COMPANY.tel}</dd><dt>영업시간</dt><dd>${COMPANY.hours}</dd></dl>`,
  'business/overview': p('수호인은 장애예술인 창작물 활용, 공연·전시 지원, 고용 컨설팅을 제공합니다.', lorem) + cards([['창작물 활용', '기업 공간과 홍보물에 예술 작품을 활용합니다.'], ['예술 일자리', '예술인의 직무를 설계합니다.'], ['고용 컨설팅', '부담금 절감 방안을 안내합니다.']]),
  'business/effect': p('장애예술인 고용은 의무 이행, 기업 이미지 개선, 조직 문화 향상에 도움이 됩니다.') + cards([['부담금 절감', '고용 인원만큼 부담금이 줄어듭니다.'], ['이미지 개선', '사회적 가치를 실천합니다.'], ['공간 가치', '예술 작품으로 공간이 달라집니다.']]),
  'business/program_2': p('장애예술인 프로그램 안내(학습용). 메뉴 이름은 원본에서 확인하지 못해 가정했습니다.', lorem) + img(960, 300, '프로그램 이미지', 'wide'),
  'support/system': p('<b>장애인고용의무제도</b>: 상시근로자 50명 이상 사업주는 정해진 비율 이상 장애인을 고용해야 합니다.', '고용의무에 못 미치면 미달 인원에 대해 매월 부담금을 냅니다.')
    + '<table><caption>연도별 의무고용률</caption><thead><tr><th>구분</th><th>2023</th><th>2024</th><th>2025</th><th>2026</th></tr></thead><tbody><tr><td>국가·자치단체, 공공기관</td><td>3.6%</td><td>3.8%</td><td>3.8%</td><td>3.8%</td></tr><tr><td>민간기업</td><td>3.1%</td><td>3.1%</td><td>3.1%</td><td>3.1%</td></tr></tbody></table>'
    + `<table><caption>2026년 미달 1명당 월 부담금</caption><thead><tr><th>고용 수준</th><th>월(원)</th><th>연(원)</th></tr></thead><tbody>${feeRows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`
    + p('<small>월 60시간 이상 근무하는 장애인이 대상이며, 중증장애인(60시간 이상)은 2명으로 계산합니다.</small>'),
  'support/account': p('근로자 수와 고용 현황을 입력하면 예상 부담금을 계산합니다.') + calc(),
  'customer/inquiry': form('inquiry', '문의하기'),
  'employment/overview': p('수호인은 장애예술인 지원자를 기다립니다(학습용 안내).', lorem) + '<ol class="steps"><li>지원서 작성</li><li>서류 검토</li><li>면접</li><li>최종 합격</li></ol><p><a class="btn primary" href="/employment/write">입사지원서 작성</a></p>',
  'employment/write': form('employment', '지원하기'),
  'doc/policy': p('제1조(목적) 이 약관은 학습용 사이트의 이용 조건을 정합니다.', '제2조(면책) 이 사이트는 학습용이며 실제 서비스가 아닙니다.', lorem),
  'doc/private': p('1. 수집 항목: 폼에 입력한 값. 2. 목적: 학습용 접수 확인. 3. 보관: 이 서버의 로컬 파일. 4. 외부 제공: 없음.', '학습용 더미 값만 입력하세요.'),
  'doc/antiemail': p('이 사이트에 게시된 이메일 주소를 무단으로 수집하는 행위를 거부합니다(학습용 문구).'),
};

// ---- 레이아웃 ----
function layout({ title, body, nav = '', crumb = '', lnb = '', head = '', home = false }) {
  const gnb = MENU.map((m) => `<li><a href="/${m.base}/${m.items[0][0]}"${nav === m.base ? ' aria-current="true"' : ''}>${m.t}</a></li>`).join('');
  const all = MENU.map((m) => `<div><h2>${m.t}</h2><ul>${m.items.map(([k, n]) => `<li><a href="/${m.base}/${k}">${n}</a></li>`).join('')}</ul></div>`).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} - 수호인(학습용)</title><link rel="stylesheet" href="/static/style.css"></head><body${home ? ' class="home"' : ''}>
<header class="hd"><a class="logo" href="/">수호인</a><nav class="gnb" aria-label="대메뉴"><ul>${gnb}</ul></nav><button id="menuBtn" class="burger" aria-expanded="false" aria-controls="menuPanel" aria-label="전체 메뉴 열기">☰</button></header>
<div id="menuPanel" class="panel" hidden><div class="panel-in"><button id="menuClose" class="close" aria-label="전체 메뉴 닫기">✕</button>${all}</div></div>
<aside class="quick" aria-label="빠른 링크"><a href="/customer/inquiry">견적문의</a><a href="/employment/write">입사지원</a><a href="/support/account">부담금 계산</a></aside>
${head}<main>${crumb}${lnb}${body}</main>
<footer class="ft"><div class="ft-top"><b>문의 전화 ${COMPANY.tel}</b><span>${COMPANY.hours}</span></div>
<ul class="ft-links"><li><a href="/company/overview">회사소개</a></li><li><a href="/doc/private">개인정보처리방침</a></li><li><a href="/doc/antiemail">이메일무단수집거부</a></li><li><a href="/doc/policy">이용약관</a></li><li><a href="/company/location">오시는 길</a></li></ul>
<address>${COMPANY.name} | ${COMPANY.addr} | 대표 홍길동 | 사업자등록번호 000-00-00000</address><button id="topBtn" class="top">맨 위로</button></footer>
<script src="/static/calc.js"></script><script src="/static/app.js"></script></body></html>`;
}

function sub({ title, subtitle, nav, items, cur, body }) {
  const m = MENU.find((x) => x.base === nav);
  const crumb = `<div class="visual"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p>${img(320, 120, '장식 이미지')}</div><nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>${m ? ` &gt; <a href="/${m.base}/${m.items[0][0]}">${m.t}</a>` : ''} &gt; <span>${esc(title)}</span></nav>`;
  const lnb = items ? `<nav class="lnb" aria-label="소메뉴"><ul>${items.map(([k, n]) => `<li><a href="/${nav}/${k}"${k === cur ? ' aria-current="page" class="on"' : ''}>${n}</a></li>`).join('')}</ul></nav>` : '';
  return layout({ title, nav, crumb, lnb, body: `<section class="content">${body}</section>` });
}

function home() {
  const slides = (n, w, h, t) => [...Array(n)].map((_, i) => `<div class="slide">${img(w, h, `${t} ${i + 1}`, 'wide')}</div>`).join('');
  const arrows = '<button class="prev" data-prev aria-label="이전">‹</button><button class="next" data-next aria-label="다음">›</button>';
  const body = `
<section class="slider banner" data-auto="4000" aria-label="롤링 배너"><div class="slides">${slides(3, 1200, 380, '배너')}</div>${arrows}</section>
<section class="content intro"><h2>예술이 일이 되는 곳, 수호인</h2>${p('장애예술인의 창작과 고용을 함께 지원하는 학습용 사이트입니다.')}<a class="btn" href="/company/overview">회사소개</a></section>
<section class="content two"><div><h2>ABOUT US</h2>${p('수호인은 기업과 장애예술인을 연결합니다.', lorem)}</div>${img(480, 280, 'ABOUT US 이미지')}</section>
<section class="content"><h2>장애예술인 창작활동 갤러리</h2><div class="slider gallery" data-auto="3500" aria-label="갤러리"><div class="slides">${slides(4, 960, 360, '작품')}</div>${arrows}</div></section>
<section class="content"><h2>서비스 안내</h2><ul class="icons">${['창작물 활용', '예술 일자리', '고용 컨설팅', '부담금 절감'].map((t) => `<li>${img(64, 64, t + ' 아이콘')}<span>${t}</span></li>`).join('')}</ul>
<div class="shortcuts"><a class="box" href="/customer/inquiry">견적문의 바로가기</a><a class="box" href="/employment/write">입사지원 바로가기</a></div></section>
<section class="content"><h2>고용부담금 계산기</h2>${calc()}</section>
<section class="content"><h2>협력사</h2><div class="marquee" aria-label="협력사"><div class="track">${[0, 1].map(() => [1, 2, 3, 4, 5, 6].map((i) => img(140, 56, '협력사 로고 ' + i)).join('')).join('')}</div></div></section>`;
  const popup = '<div id="popup" class="popup" role="dialog" aria-label="안내" hidden><h2>안내</h2><p>이 사이트는 학습용입니다. 실제 개인정보를 입력하지 마세요.</p><div><button id="popToday">오늘 하루 보지 않기</button><button id="popClose">닫기</button></div></div>';
  return layout({ title: '메인', body, home: true, head: popup });
}

const ROUTES = { '/': home };
MENU.forEach((m) => m.items.forEach(([k, n]) => {
  const key = `${m.base}/${k}`;
  ROUTES['/' + key] = () => sub({ title: n, subtitle: m.sub, nav: m.base, items: m.items, cur: k, body: T[key] });
}));
Object.entries(DOCS).forEach(([k, n]) => {
  ROUTES['/doc/' + k] = () => sub({ title: n, subtitle: '학습용 문서입니다', body: T['doc/' + k] });
});

const notFound = () => sub({ title: '페이지를 찾을 수 없습니다', subtitle: '404', body: p('요청한 주소가 없습니다.', '<a href="/">메인으로 돌아가기</a>') });

module.exports = { ROUTES, notFound };
