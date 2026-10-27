(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const won = (n) => n.toLocaleString('ko-KR');

  // 전체 메뉴
  const btn = $('#menuBtn'), panel = $('#menuPanel');
  function menu(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('lock', open);
    (open ? $('#menuClose') : btn).focus();
  }
  btn.onclick = () => menu(panel.hidden);
  $('#menuClose').onclick = () => menu(false);
  panel.onclick = (e) => { if (e.target === panel) menu(false); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) menu(false); });
  $('#topBtn').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

  // 슬라이드
  $$('.slider').forEach((el) => {
    const slides = $$('.slide', el);
    let i = 0, timer;
    const show = (n) => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('on', k === i)); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), +el.dataset.auto); };
    $('[data-prev]', el).onclick = () => { show(i - 1); auto(); };
    $('[data-next]', el).onclick = () => { show(i + 1); auto(); };
    show(0); auto();
  });

  // 팝업: 닫기는 이번 방문만, 오늘 하루 보지 않기는 날짜 기준으로 유지
  const pop = $('#popup');
  if (pop) {
    const today = new Date().toLocaleDateString('sv');
    const KEY = 'popupHideDate';
    let hidden = false;
    try { hidden = localStorage.getItem(KEY) === today; } catch (e) { /* 저장소 사용 불가 시 매번 표시 */ }
    pop.hidden = hidden;
    $('#popClose').onclick = () => { pop.hidden = true; };
    $('#popToday').onclick = () => {
      try { localStorage.setItem(KEY, today); } catch (e) { /* 무시 */ }
      pop.hidden = true;
    };
  }

  // 계산기
  const calc = $('#calc');
  if (calc) {
    const f = calc.elements;
    const set = (id, v) => { $('#' + id).textContent = won(v); };
    const out = (r) => {
      set('r-obligation', r.obligation); set('r-shortfall', r.shortfall); set('r-monthly', r.monthly);
      Object.entries(r.annual).forEach(([y, v]) => set('r-y' + y, v));
      set('r-total', r.total);
    };
    $$('[data-add]', calc).forEach((b) => b.onclick = () => { f.workers.value = (+f.workers.value || 0) + +b.dataset.add; });
    $('[data-reset]', calc).onclick = () => { f.workers.value = 0; };
    $$('[data-step]', calc).forEach((b) => b.onclick = () => {
      const input = $('#' + b.dataset.for);
      input.value = Math.max(0, (+input.value || 0) + +b.dataset.step);
    });
    calc.onsubmit = (e) => {
      e.preventDefault();
      const r = Calc.calculate({ type: f.type.value, workers: f.workers.value, mild: f.mild.value, severe60: f.severe60.value, severeUnder: f.severeUnder.value });
      $('#calc-msg').textContent = r.error || r.notice;
      if (!r.error) out(r);
    };
    calc.onreset = () => {
      $('#calc-msg').textContent = '';
      setTimeout(() => out({ obligation: 0, shortfall: 0, monthly: 0, annual: { 2026: 0, 2025: 0, 2024: 0, 2023: 0 }, total: 0 }));
    };
  }

  // 폼
  const form = $('form[data-form]');
  if (form) {
    $('[data-postcode]', form)?.addEventListener('click', () => {
      $('#form-msg').textContent = '우편번호 검색은 외부 연동이라 제공하지 않습니다. 주소를 직접 입력해 주세요.';
    });
    form.onsubmit = async (e) => {
      e.preventDefault();
      const msg = $('#form-msg');
      $$('[data-err]', form).forEach((s) => { s.textContent = ''; });
      msg.textContent = '';
      const body = {};
      for (const el of form.elements) {
        if (!el.name || el.type === 'submit' || el.type === 'button') continue;
        if (el.type === 'checkbox' && el.name !== 'agree') { (body[el.name] ||= []); if (el.checked) body[el.name].push(el.value); }
        else if (el.type === 'checkbox') body[el.name] = el.checked;
        else if (el.type === 'radio') { if (el.checked) body[el.name] = el.value; }
        else body[el.name] = el.value;
      }
      try {
        const res = await fetch('/api/' + form.dataset.form, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const r = await res.json();
        if (r.ok) { form.reset(); msg.textContent = '접수되었습니다. 감사합니다.'; msg.scrollIntoView({ block: 'center' }); return; }
        Object.entries(r.errors).forEach(([k, v]) => { const s = $(`[data-err="${k}"]`, form); if (s) s.textContent = v; else msg.textContent = v; });
        if (!msg.textContent) msg.textContent = '입력 내용을 확인해 주세요.';
        const first = $('[data-err]:not(:empty)', form);
        first?.closest('.fld')?.querySelector('input,select,textarea')?.focus();
      } catch (err) {
        msg.textContent = '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      }
    };
  }
})();
