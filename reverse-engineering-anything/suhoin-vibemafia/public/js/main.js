// 학습용 공통 스크립트: 메뉴, 슬라이드, 계산기, 폼, 팝업. jQuery 번들(slick 포함)에 의존한다.
$(function () {
  // ---- 스크롤 등장 (vibemafia 이식): 뷰포트에 들어오면 한 번만 페이드인 ----
  document.documentElement.classList.add("js");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll("#main #content > :not(.visual), #sub #content > *, #footer").forEach((el) => { el.classList.add("reveal"); io.observe(el); });

  const device = () => ["pc", "ta", "mo"].find((d) => $("#_device_" + d).css("display") === "block") || null;
  const speed = 600;

  // ---- 레이아웃 ----
  $("#gotop").on("click", (e) => { e.preventDefault(); $("html,body").animate({ scrollTop: 0 }, speed); });

  // PC 드롭다운은 GNB 를 복제해 만든다
  $("#drdw .inner").html($("#gnb").html());
  const visible = $("#drdw .inner > li").not(".hidden-gnb").length;
  $("#drdw .inner > li").css("width", 100 / visible + "%");

  // 햄버거 버튼: PC 는 드롭다운, 그 외는 슬라이드 메뉴
  const $btn = $("#slide-btn button"), $drdw = $("#drdw"), $slide = $("#slide-menu"), $bg = $("#slide-bg");
  $btn.on("click", (e) => {
    e.preventDefault();
    if (device() === "pc") {
      const open = $btn.hasClass("on");
      $drdw.stop()[open ? "slideUp" : "slideDown"]();
      $btn.toggleClass("on", !open);
    } else if (!$slide.hasClass("on")) {
      $bg.fadeIn();
      $slide.addClass("on");
    }
  });
  $("#slide-close").on("click", (e) => { e.preventDefault(); $bg.fadeOut(); $slide.removeClass("on"); });
  $(window).on("resize load", () => { $drdw.stop().slideUp(); $btn.removeClass("on"); });

  // 모바일 메뉴 아코디언
  $(document).on("click", "#gnb-mo > li > a", function (e) {
    const $sub = $(this).parent().children("ul");
    if (!$sub.children("li").length) return;
    e.preventDefault();
    const open = $sub.is(":visible");
    $sub[open ? "slideUp" : "slideDown"](speed);
    $(this).parent().toggleClass("active", !open).siblings().removeClass("active").children("ul").slideUp(speed);
  });
  $("#gnb-mo > li.active > a").click();

  // LNB / Navigator 는 활성 GNB 항목에서 가져온다
  $("#lnb").html($("#gnb > li.active > ul").html());
  if ($("#lnb > li").length < 2) $("#lnb").remove();

  $("#navigator li.d1").append("<ul>" + $("#gnb").html() + "</ul>").find("> ul > li > ul").remove();
  $("#navigator li.d1 > a").attr("href", $("#gnb > li.active > a").attr("href"));
  $("#navigator li.d2").append("<ul>" + $("#gnb > li.active > ul").html() + "</ul>");
  $("#navigator li.d2 > a").attr("href", $("#gnb > li.active > ul > li.active > a").attr("href"));
  $(document).on("click", "#navigator > ul > li > a", function (e) {
    const $li = $(this).parent();
    if ($li.find("ul").length) e.preventDefault();
    $li.toggleClass("on").siblings().removeClass("on");
  });
  $("body").on("click", (e) => { if (!$(e.target).closest("#navigator").length) $("#navigator > ul > li").removeClass("on"); });

  // ---- 메인 슬라이드 ----
  const breaks = (n, m = n) => [{ breakpoint: 1300, settings: { swipe: true } }, { breakpoint: 750, settings: { swipe: true, slidesToShow: m } }];
  $(".visual .roll").slick({ arrows: false, dots: false, infinite: true, autoplay: true, autoplaySpeed: 2000, swipe: false, responsive: breaks(1) });
  $(".rolling .roll").slick({ arrows: false, slidesToShow: 5, autoplay: true, autoplaySpeed: 1, speed: 4000, rtl: true, cssEase: "linear", pauseOnHover: false, swipe: false, responsive: breaks(5, 3) });
  $(".slide_1").slick({ arrows: true, appendArrows: $(".arrow"), slidesToShow: 4, autoplay: true, autoplaySpeed: 4000, responsive: [{ breakpoint: 1300, settings: { slidesToShow: 3, swipe: true } }, { breakpoint: 750, settings: { slidesToShow: 2, swipe: true } }] });

  // 게시판 총 건수 (페이지네이션은 구현하지 않아 표시된 항목 수만 센다)
  $("#sb-search .total strong").text($("#sb-gallery > li").length);

  // ---- 공통 입력 ----
  $(document).on("keyup", ".onlyNumber", function () { $(this).val($(this).val().replace(/[^0-9]/g, "")); });
  $(document).on("click", ".count .minus", function () {
    const $n = $(this).siblings(".number");
    $n.val(Math.max((parseInt($n.val(), 10) || 0) - 1, 0));
  });
  $(document).on("click", ".count .plus", function () {
    const $n = $(this).siblings(".number");
    $n.val((parseInt($n.val(), 10) || 0) + 1);
  });

  // ---- 고용부담금 계산기 ----
  // 연 단가(원), 인덱스 0=2026 ... 6=2020. 출처: 원본 계산기 스크립트. 법령 개정 시 매년 갱신 필요.
  const YEARS = [26, 25, 24, 23, 22, 21, 20];
  const RATE = {
    none: [25882560, 25155240, 24728880, 24126960, 22973280, 21869760, 21543720],
    over75: [15540000, 15096000, 14844000, 14484000, 13788000, 13128000, 12936000],
    over50: [16472400, 16001760, 15734640, 15353040, 14615280, 13915680, 13712160],
    over25: [18648000, 18115200, 17812800, 17380800, 16545600, 15753600, 15523200],
    under25: [21756000, 21134400, 20781600, 20277600, 19303200, 18379200, 18110400],
  };
  const DUTY = { normal: 0.031, public: 0.038, nation: 0.038 }; // 2024년 이후 기준
  const int = (sel) => parseInt($(sel).val(), 10) || 0;
  const won = (n) => n.toLocaleString("ko-KR");

  $(".calc").on("click", function () { $("#totalWorkers").val(int("#totalWorkers") + parseInt($(this).val(), 10)); });
  $(".reset").on("click", () => $("#totalWorkers").val(0));

  $(document).on("click", ".account_btn .btn_1", function (e) {
    e.preventDefault();
    const total = int("#totalWorkers");
    if (!total) return alert("전체 근로자수를 입력해주세요.");
    if (total < 50) return alert("상시근로자 50인 미만은 장애인 의무고용이 해당되지 않습니다.");

    const duty = Math.floor(total * DUTY[$("input[name='company_type']:checked").val()]);
    const hired = int("#lightDisabled") + int("#heavyDisabledUnder60") + int("#heavyDisabledOver60") * 2; // 중증 60시간 이상은 2명 산정
    const under = Math.max(duty - hired, 0);

    let tier = "under25";
    if (hired === 0) tier = "none";
    else if (hired >= Math.floor(duty * 3 / 4)) tier = "over75";
    else if (hired >= Math.floor(duty / 2)) tier = "over50";
    else if (hired >= Math.floor(duty / 4)) tier = "over25";

    const yearly = YEARS.map((_, i) => (under ? RATE[tier][i] * under : 0));
    $("#dumyAmount").text(won(duty));
    $("#underAmount").text(won(under));
    $("#monthlyPay").text(won(yearly[0] / 12));
    YEARS.forEach((y, i) => $("#yearlyPay" + y).text(won(yearly[i])));
    $("#totalAmount").html(won(yearly[0]) + " <b>원</b>");
  });

  $(document).on("click", ".account_btn .btn_2", function (e) {
    e.preventDefault();
    $("#totalWorkers").val(0);
    $("input[name='amount']").val(0);
    $("input[name='company_type'][value='normal']").prop("checked", true);
    $("#dumyAmount,#underAmount,#monthlyPay").add(YEARS.map((y) => "#yearlyPay" + y).join(",")).text("0");
    $("#totalAmount").html("0 <b>원</b>");
  });

  // ---- 문의 / 입사지원 폼: 검증 후 /api 로 전송 (이 서버의 파일에만 저장) ----
  const PHONE = /^[0-9]+$/;
  const required = {
    "/api/inquiry": [["wm_company", "기업명을 입력해주세요."], ["wm_name", "담당자 이름을 입력해주세요."], ["wm_tel1", "연락처를 입력해주세요."], ["wm_tel2", "연락처를 입력해주세요."], ["wm_tel3", "연락처를 입력해주세요."]],
    "/api/application": [["wm_name", "성함을 입력해주세요."], ["wm_tel1", "연락처를 입력해주세요."], ["wm_tel2", "연락처를 입력해주세요."], ["wm_tel3", "연락처를 입력해주세요."], ["wm_email1", "이메일을 입력해주세요."], ["wm_email2", "이메일을 입력해주세요."], ["wm_zipcode", "주소를 입력해주세요."]],
  };
  $(document).on("change", "#wm_email_select", function () { $("#wm_email2").val($(this).val()); });

  $("form[name=writeform]").on("submit", async function (e) {
    e.preventDefault();
    const f = this, rule = required[$(f).attr("action")] || [];
    // alert 대신 폼 아래 인라인 메시지로 알린다
    let msg$ = $(f).find(".form-msg");
    if (!msg$.length) msg$ = $('<p class="form-msg" role="status"></p>').insertAfter($("#submitBtn").parent());
    const say = (t, cls = "error") => { msg$.attr("class", "form-msg " + cls).text(t); return false; };
    say("", "");
    for (const [name, msg] of rule) {
      if (!f[name] || !f[name].value.trim()) { say(msg); f[name] && f[name].focus(); return; }
    }
    for (const n of ["wm_tel1", "wm_tel2", "wm_tel3"]) {
      if (f[n] && !PHONE.test(f[n].value)) { say("연락처는 숫자로만 입력해주세요."); f[n].focus(); return; }
    }
    if ($(f).attr("action") === "/api/inquiry" && !$("input[name='wm_4[]']:checked").length) return say("유입경로를 선택해주세요.");
    if (!$("input[name=agree1]").is(":checked")) return say("개인정보처리방침에 동의해주세요.");

    const $submit = $("#submitBtn").prop("disabled", true);
    try {
      const res = await fetch($(f).attr("action"), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: $(f).serialize() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      say("접수되었습니다. (학습용: 이 컴퓨터에만 저장됩니다)", "ok");
      f.reset();
    } catch (err) {
      say(err.message || "서버에 연결할 수 없습니다.");
    }
    $submit.prop("disabled", false);
  });

  // 우편번호 검색은 외부 서비스라 제외
  window.win_zip = window.openDaumPostcode = () => alert("우편번호 검색은 외부 서비스 연동이라 학습용에서는 제외했습니다. 주소를 직접 입력하세요.");

  // ---- 메인 팝업: 오늘 하루 보지 않기 ----
  const KEY = "popup-hide-until";
  const $pop = $("#sp_popup25");
  if ($pop.length) {
    if (Date.now() < Number(localStorage.getItem(KEY) || 0)) $pop.hide();
    $("#popup-close").on("click", (e) => { e.preventDefault(); $pop.hide(); });
    $("#popup-today").on("change", function () {
      if (this.checked) localStorage.setItem(KEY, Date.now() + 24 * 3600 * 1000);
      $pop.hide();
    });
  }
});
