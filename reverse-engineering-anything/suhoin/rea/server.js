// 학습용 서버: public/ 정적 제공(확장자 없는 URL 지원) + 문의/입사지원 접수. 의존성 없음. 실행: node server.js
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const DATA = path.join(__dirname, "data"); // shortcut: JSONL 파일 저장, 조회/동시 쓰기가 필요해지면 SQLite 로 교체
const MAX_BODY = 20_000;

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject" };

const digits = (v) => /^[0-9]+$/.test(v ?? "");
const filled = (v) => typeof v === "string" && v.trim() !== "";

// 접수 종류별 필수값 검사. 통과하면 null, 아니면 오류 문구.
const forms = {
  "/api/inquiry": (b) =>
    !filled(b.wm_company) ? "기업명을 입력해주세요."
    : !filled(b.wm_name) ? "담당자 이름을 입력해주세요."
    : !(digits(b.wm_tel1) && digits(b.wm_tel2) && digits(b.wm_tel3)) ? "연락처는 숫자로만 입력해주세요."
    : !b.agree1 ? "개인정보처리방침에 동의해주세요." : null,
  "/api/application": (b) =>
    !filled(b.wm_name) ? "성함을 입력해주세요."
    : !(digits(b.wm_tel1) && digits(b.wm_tel2) && digits(b.wm_tel3)) ? "연락처는 숫자로만 입력해주세요."
    : !filled(b.wm_email1) || !filled(b.wm_email2) ? "이메일을 입력해주세요."
    : !filled(b.wm_zipcode) ? "주소를 입력해주세요."
    : !b.agree1 ? "개인정보처리방침에 동의해주세요." : null,
};

function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

// 같은 이름이 여러 번 오면(체크박스 wm_4[]) 배열로 모은다.
function parseForm(raw) {
  const out = {};
  for (const [k, v] of new URLSearchParams(raw)) out[k] = k in out ? [].concat(out[k], v) : v;
  return out;
}

function receive(req, res, validate, file) {
  let raw = "";
  req.on("data", (c) => {
    raw += c;
    if (raw.length > MAX_BODY) { json(res, 413, { error: "요청이 너무 큽니다." }); req.destroy(); }
  });
  req.on("end", () => {
    if (res.writableEnded) return;
    const body = parseForm(raw);
    const err = validate(body);
    if (err) return json(res, 400, { error: err });
    fs.mkdirSync(DATA, { recursive: true });
    fs.appendFileSync(path.join(DATA, file), JSON.stringify({ at: new Date().toISOString(), ...body }) + "\n");
    json(res, 200, { ok: true });
  });
}

function serveStatic(req, res) {
  let url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url === "/employment/write2") url = "/employment/write"; // 원본의 별칭
  const candidates = [url, url + ".html", path.join(url, "index.html")];
  for (const c of candidates) {
    const file = path.join(PUBLIC, c);
    if (!file.startsWith(PUBLIC)) break; // ../ 경로 차단
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      return fs.createReadStream(file).pipe(res);
    }
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("페이지를 찾을 수 없습니다.");
}

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  if (req.method === "POST" && forms[pathname]) {
    return receive(req, res, forms[pathname], pathname === "/api/inquiry" ? "inquiries.jsonl" : "applications.jsonl");
  }
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
  json(res, 405, { error: "method not allowed" });
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
