const http = require('http');
const fs = require('fs');
const path = require('path');
const { ROUTES, notFound } = require('./lib/pages');
const { validate } = require('./lib/forms');

const PUBLIC = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const MAX_BODY = 64 * 1024;
const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const send = (res, code, type, body) => {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
};
const json = (res, code, o) => send(res, code, 'application/json', JSON.stringify(o));
const clamp = (v, lo, hi, d) => Math.min(hi, Math.max(lo, parseInt(v, 10) || d));

function placeholder(q) {
  const w = clamp(q.get('w'), 16, 2000, 200), h = clamp(q.get('h'), 16, 2000, 120);
  const t = (q.get('t') || '').slice(0, 40).replace(/[&<>"']/g, '');
  const size = Math.max(10, Math.min(24, Math.floor(w / 12)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#dfe6ee"/><path d="M0 0L${w} ${h}M${w} 0L0 ${h}" stroke="#c3ccd6"/><text x="50%" y="50%" fill="#5a6877" font-family="sans-serif" font-size="${size}" text-anchor="middle" dominant-baseline="middle">${t}</text></svg>`;
}

function readBody(req, res, cb) {
  let size = 0;
  let over = false;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) {
      if (!over) json(res, 413, { ok: false, errors: { _: '요청이 너무 큽니다.' } });
      over = true;
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (over) return;
    try { cb(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
    catch { json(res, 400, { ok: false, errors: { _: '잘못된 요청입니다.' } }); }
  });
}

function submit(kind, req, res) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { ok: false, errors: { _: 'JSON만 받습니다.' } });
  const fail = () => json(res, 500, { ok: false, errors: { _: '저장에 실패했습니다.' } });
  readBody(req, res, (body) => {
    const { errors, data } = validate(kind, body);
    if (Object.keys(errors).length) return json(res, 400, { ok: false, errors });
    fs.mkdir(DATA, { recursive: true }, (e) => {
      if (e) return fail();
      const line = JSON.stringify({ at: new Date().toISOString(), ...data }) + '\n';
      fs.appendFile(path.join(DATA, kind + '.jsonl'), line, (e2) => (e2 ? fail() : json(res, 200, { ok: true })));
    });
  });
}

function serve(req, res) {
  const url = new URL(req.url, 'http://x');
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'text/plain', 'bad request'); }
  if (p.length > 1) p = p.replace(/\/+$/, '');

  if (req.method === 'POST' && (p === '/api/inquiry' || p === '/api/employment')) return submit(p.slice(5), req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'text/plain', 'method not allowed');

  if (p === '/img/ph.svg') return send(res, 200, 'image/svg+xml', placeholder(url.searchParams));
  if (p.startsWith('/static/')) {
    const file = path.resolve(PUBLIC, p.slice(8));
    if (!file.startsWith(PUBLIC + path.sep)) return send(res, 404, 'text/plain', 'not found');
    return fs.readFile(file, (e, buf) => {
      if (e) return send(res, 404, 'text/plain', 'not found');
      res.writeHead(200, { 'Content-Type': (TYPES[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
      res.end(buf);
    });
  }
  const page = Object.hasOwn(ROUTES, p) && ROUTES[p];
  return page ? send(res, 200, 'text/html', page()) : send(res, 404, 'text/html', notFound());
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  http.createServer(serve).listen(port, () => console.log(`http://localhost:${port}`));
}
module.exports = { serve };
