const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { calculate } = require('../public/calc');
const { serve } = require('../server');
const { ROUTES } = require('../lib/pages');

const base = { type: 'private', workers: 0, mild: 0, severe60: 0, severeUnder: 0 };
const calc = (o) => calculate({ ...base, ...o });

test('계산: 민간 100명, 장애인 0명', () => {
  const r = calc({ workers: 100 });
  assert.deepEqual([r.obligation, r.shortfall, r.monthly, r.total], [3, 3, 6470640, 77647680]);
});
test('계산: 민간 1000명, 경증10 중증5', () => {
  const r = calc({ workers: 1000, mild: 10, severe60: 5 });
  assert.deepEqual([r.obligation, r.shortfall, r.monthly], [31, 11, 15099700]);
});
test('계산: 공공 500명, 0명', () => {
  const r = calc({ type: 'public', workers: 500 });
  assert.deepEqual([r.obligation, r.shortfall, r.monthly], [19, 19, 40980720]);
});
test('계산: 경계 49/50명, 잘못된 입력', () => {
  assert.equal(calc({ workers: 49 }).obligation, 0);
  assert.ok(calc({ workers: 49 }).notice);
  assert.equal(calc({ workers: 50 }).obligation, 1);
  assert.ok(calc({ workers: '' }).error);
  assert.ok(calc({ workers: 10, mild: -1 }).error);
});

let server, port;
test.before(() => new Promise((ok) => { server = http.createServer(serve).listen(0, () => { port = server.address().port; ok(); }); }));
test.after(() => server.close());
const req = (p, opt = {}) => new Promise((ok, no) => {
  const r = http.request({ port, path: p, ...opt }, (res) => { let b = ''; res.on('data', (c) => b += c); res.on('end', () => ok({ status: res.statusCode, body: b })); });
  r.on('error', no); r.end(opt.body);
});
const post = (p, o) => req(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });

test('경로 19개 200, 없는 경로 404, 이미지 alt, LNB 강조', async () => {
  const paths = Object.keys(ROUTES);
  assert.equal(paths.length, 19);
  for (const p of paths) {
    const r = await req(p);
    assert.equal(r.status, 200, p);
    for (const tag of r.body.match(/<img [^>]*>/g) || []) assert.match(tag, /alt="[^"]+"/, p);
    if (/^\/(company|business|support|customer|employment)\//.test(p)) assert.match(r.body, new RegExp(`href="${p}" aria-current="page"`), p);
  }
  assert.equal((await req('/nope')).status, 404);
  assert.equal((await req('/static/../server.js')).status, 404);
  assert.equal((await req('/static/%2e%2e/server.js')).status, 404);
  assert.equal((await req('/__proto__')).status, 404);
});

test('폼: 빈 값 거부, 정상 값 저장', async () => {
  const file = path.join(__dirname, '..', 'data', 'inquiry.jsonl');
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').length : 0;
  assert.equal((await post('/api/inquiry', {})).status, 400);
  const ok = { company: '더미', name: '홍길동', phone: '010-0000-0000', email: 'a@b.co', address: '서울', employees: '100', disabled: '0', message: '문의', agree: true };
  assert.equal((await post('/api/inquiry', { ...ok, agree: false })).status, 400);
  assert.equal((await post('/api/inquiry', { ...ok, email: 'x' })).status, 400);
  assert.equal((await post('/api/inquiry', ok)).status, 200);
  assert.ok(fs.readFileSync(file, 'utf8').length > before);
  assert.equal((await post('/api/employment', {})).status, 400);
  const emp = { name: '홍길동', phone: '010-0000-0000', gender: '남자', email: 'a@b.co', kind: '신입', jobs: ['예술(미술)/그림'], disability: '지체장애', registered: '2020-01-31', agree: true };
  assert.equal((await post('/api/employment', emp)).status, 200);
  assert.equal((await post('/api/employment', { ...emp, registered: '2020-02-31' })).status, 400);
});

test('본문 크기 제한', async () => {
  const r = await post('/api/inquiry', { message: 'x'.repeat(70000) }).catch(() => ({ status: 413 }));
  assert.equal(r.status, 413);
});
