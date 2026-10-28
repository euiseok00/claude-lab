document.documentElement.classList.add("js");

// 공용 헤더·푸터: 페이지마다 복붙하지 않고 한곳에서 주입한다.
const ROOT = (document.body.dataset.root || ".") + "/";
const P = {
  home: "index.html",
  news: "pages/content/newsletter.html",
  lives: "pages/content/lives.html",
  vod: "pages/programs/vod-infra.html",
  mentoring: "pages/programs/mentoring.html",
  pt: "pages/programs/vibe-pt.html",
  b2b: "pages/company/b2b.html",
  community: "pages/programs/inner-circle.html",
  membership: "pages/programs/membership.html",
  brain: "pages/programs/brain.html",
  login: "pages/account/login.html",
};
const NAV = [["소개", P.home], ["뉴스레터", P.news]];
const MENU = [
  ["라이브 아카이브", P.lives],
  ["인프라 설계 VOD", P.vod],
  ["1:1 멘토링", P.mentoring],
  ["집중 코칭", P.pt],
  ["기업 문의", P.b2b],
  ["커뮤니티", P.community],
  ["멤버십", P.membership],
  ["스타터 팩", P.brain],
];
const isHere = (p) => location.pathname.endsWith("/" + p) || (p === P.home && location.pathname.endsWith("/"));
const cur = (p) => (isHere(p) ? ' aria-current="page"' : "");

const headerEl = document.getElementById("site-header");
if (headerEl) {
  headerEl.outerHTML = `
  <header class="site-header">
    <div class="container header-row">
      <a class="logo" href="${ROOT}${P.home}">PROMPT LAB</a>
      <nav class="nav" aria-label="주 메뉴">
        ${NAV.map(([t, h]) => `<a class="nav-link${isHere(h) ? " is-active" : ""}" href="${ROOT}${h}"${cur(h)}>${t}</a>`).join("")}
        <div class="dropdown">
          <button class="nav-link dropdown-toggle" type="button" aria-expanded="false" aria-controls="program-menu">
            강의·프로그램
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="dropdown-menu" id="program-menu" hidden>
            ${MENU.map(([t, h]) => `<a href="${ROOT}${h}"${cur(h)}>${t}</a>`).join("")}
          </div>
        </div>
        <span class="nav-sep" aria-hidden="true"></span>
        <a class="nav-link" href="${ROOT}${P.login}">로그인</a>
        <button class="icon-btn" id="theme-toggle" type="button" aria-label="테마 전환">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
      </nav>
    </div>
  </header>${document.body.hasAttribute("data-banner") ? '<a class="banner" href="${ROOT}${P.community}">신규 기수 모집 · 예시 일정 안내 받기 →</a>' : ""}`;
}

const footerEl = document.getElementById("site-footer");
if (footerEl) {
  footerEl.outerHTML = `
  <footer class="site-footer">
    <div class="container">
      <p>이 사이트는 레이아웃과 인터랙션을 학습하기 위한 예제이며, 실제 서비스나 기관과 무관합니다. 모든 이름, 문구, 숫자는 가상입니다.</p>
      <p class="footer-links">${MENU.map(([t, h]) => `<a href="${ROOT}${h}">${t}</a>`).join("")}</p>
    </div>
  </footer>`;
}

// 스크롤 등장: 뷰포트에 들어오면 한 번만 페이드인.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    io.unobserve(e.target);
  }
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// 드롭다운: 클릭으로 토글, 바깥 클릭이나 Esc로 닫기.
const toggle = document.querySelector(".dropdown-toggle");
const menu = document.getElementById("program-menu");
function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  menu.hidden = !open;
}
toggle.addEventListener("click", () => setMenu(menu.hidden));
document.addEventListener("click", (e) => { if (!e.target.closest(".dropdown")) setMenu(false); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); }
});

// 테마 전환: 선택값은 저장하되, 저장 실패해도 동작한다.
document.getElementById("theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
});

// 폼: 서버 없이 검증과 상태 메시지 흐름만 보여준다. data-form 속성이 있는 폼에 적용.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPOS = { "gmial.com": "gmail.com", "gmai.com": "gmail.com", "naver.con": "naver.com" };
document.querySelectorAll("form[data-form]").forEach((form) => {
  const msg = form.querySelector(".form-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    const missing = [...form.querySelectorAll("[required]")].find((f) => !f.value.trim());
    if (missing) { msg.textContent = "필수 항목을 입력해 주세요."; msg.classList.add("error"); missing.focus(); return; }
    const email = form.querySelector('input[type="email"]');
    if (email) {
      const v = email.value.trim();
      if (!EMAIL_RE.test(v)) { msg.textContent = "올바른 이메일 주소를 입력해 주세요."; msg.classList.add("error"); email.focus(); return; }
      const fix = TYPOS[v.split("@")[1].toLowerCase()];
      if (fix) { msg.textContent = `혹시 ${v.split("@")[0]}@${fix} 인가요? 맞다면 수정 후 다시 제출해 주세요.`; return; }
    }
    msg.textContent = "예제 페이지라 실제로 저장되지 않습니다. 입력 흐름만 확인되었습니다.";
    msg.classList.add("ok");
    form.reset();
  });
});

// 뉴스레터 카테고리 필터.
const tabs = document.querySelectorAll(".tab[data-cat]");
if (tabs.length) {
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t === tab)));
    document.querySelectorAll(".article[data-cat]").forEach((a) => {
      a.hidden = tab.dataset.cat !== "all" && a.dataset.cat !== tab.dataset.cat;
    });
  }));
}

// 복사 버튼: 클립보드 접근이 막혀도 실패 문구를 보여준다.
document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
  const text = document.getElementById(btn.dataset.copy).innerText;
  try { await navigator.clipboard.writeText(text); btn.textContent = "복사됨"; }
  catch { btn.textContent = "복사 실패"; }
  setTimeout(() => (btn.textContent = "복사"), 1500);
}));
