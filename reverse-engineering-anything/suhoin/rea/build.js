// content/ 조각 + 공통 레이아웃 -> public/ 정적 페이지. 실행: node build.js
const fs = require("node:fs");
const path = require("node:path");

const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
const meta = JSON.parse(read("content/meta.json"));
const gnb = read("content/gnb.html");
const quick = read("content/quick.html").replace(/href="[^"]*"/g, 'href="#"'); // 외부 링크 제외
const footer = maskFooter(read("content/footer.html"));

// slug -> 경로. employment_write2 는 /employment/write 로 노출한다.
const routes = { index: "/" };
for (const slug of Object.keys(meta)) routes[slug] = "/" + slug.replace("_write2", "_write").replace("_", "/");

// 해당 페이지 전용 CSS (원본 superboard skin)
const sb = ["/superboard/css/sb_common.css", "/superboard/css/sb_board.css"];
const skins = {
  board_work: [...sb, "/superboard/skin/board/gallery/style.css"],
  company_history: [...sb, "/superboard/skin/history/basic/style.css"],
  company_location: [...sb, "/superboard/skin/location/basic/style.css"],
  customer_inquiry: [...sb, "/superboard/skin/online/basic/style.css"],
  employment_write2: [...sb, "/superboard/skin/online/basic2/style.css"],
};

// 푸터의 실제 사업자 정보와 외부 링크는 학습용 더미로 바꾼다.
function maskFooter(html) {
  return html
    .replace(/href="https?:[^"]*"/g, 'href="#"')
    .replace(/<a href="tel:[^"]*">[^<]*<\/a>/, '<a href="#">000-000-0000</a>')
    .replace(/팩스 : [\d-]+/, "팩스 : 000-000-0000")
    .replace(/이메일 : [^<\s]+/, "이메일 : sample@example.com")
    .replace(/<address>[\s\S]*?<\/address>/, "<address>회사명 : 수호인(학습용)<hr>대표 : 홍길동<hr />주소 : 서울특별시 학습구 예제로 1<hr />사업자번호 : 000-00-00000</address>");
}

// 현재 경로의 메뉴 항목에 active 를 붙인다 (LNB/Navigator 가 이 표시를 읽는다).
function markActive(route) {
  const target = route === "/employment/write" ? "/employment/overview" : route;
  return gnb
    .replace(/(<li class="[^"]*?)\s*\bactive\b/g, "$1") // 추출 원본에 남은 active 제거
    .split(/\n(?=<li class=)/)
    .map((block) => {
      if (!block.includes(`href="${target}"`)) return block;
      return block
        .replace(/^<li class="/, '<li class="active ')
        .replace(new RegExp(`<li class="([^"]*)">(\\s*<a href="${target}")`), '<li class="$1 active">$2');
    })
    .join("\n");
}

function page(slug) {
  const route = routes[slug];
  const isMain = slug === "index";
  const m = meta[slug];
  const nav = markActive(route);
  const css = ["/css/common.css", "/css/global.css", "/css/respond.css", "/css/lab.css", ...(skins[slug] || [])];

  const body = isMain
    ? read("content/index.main.html")
    : `<section id="sub">
  <div class="sub-vis" style="background-image: url('${m.bg}');">
    <h2>${m.h2}${m.em ? `<em>${m.em}</em>` : ""}</h2>
    <div class="lnbWrap"><ul id="lnb"></ul></div>
  </div>
  <div id="navigator"><ul>
    <li><a href="/"><i class="axi axi-home"></i></a></li>
    <li class="d1"><a href="#">${m.nav[0]}</a></li>
    <li class="d2"><a href="#">${m.nav[1]}</a></li>
  </ul></div>
  <div id="content">${read(`content/${slug}.html`)}</div>
</section>`;

  const popup = isMain
    ? `<div class="sp-pop" id="sp_popup25">
  <p>학습용 사이트입니다. 실제 기업과 무관하며 입력한 정보는 이 컴퓨터에만 저장됩니다.</p>
  <ul class="btns"><li><a href="#close" id="popup-close">닫기</a></li>
  <li><label><input type="checkbox" id="popup-today"> 오늘 하루 보지 않기</label></li></ul>
</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ko" class="kor">
<head>
<meta charset="utf-8">
<title>수호인 (학습용)</title>
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=3, user-scalable=no">
${css.map((h) => `<link rel="stylesheet" href="${h}">`).join("\n")}
<script src="/js/jquery.min.js"></script>
<script src="/js/main.js" defer></script>
</head>
<body${isMain ? "" : ' class="sub"'}>
<div id="wrap">
<div id="_device_pc"></div><div id="_device_ta"></div><div id="_device_mo"></div>
<header id="header"><div class="inner">
  <h1 class="logo"><a href="/">수호인</a></h1>
  <ul id="gnb">${nav}</ul>
  <div id="slide-btn"><button><span></span></button>Open menu</div>
</div></header>
<div id="drdw"><ul class="inner"></ul></div>
<div id="slide-menu"><div class="tit"><a href="#" id="slide-close"></a></div><ul id="gnb-mo">${nav}</ul></div>
<div id="slide-bg"></div>
<div class="quick">${quick}</div>
${body}
<footer id="footer">${footer}</footer>
${popup}
</div>
</body>
</html>
`;
}

for (const slug of Object.keys(routes)) {
  const out = path.join(__dirname, "public", routes[slug] === "/" ? "index.html" : routes[slug] + ".html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page(slug));
}
console.log(`built ${Object.keys(routes).length} pages`);
