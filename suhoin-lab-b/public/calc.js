// 고용부담금 계산. 서버 테스트와 브라우저가 같은 파일을 쓴다. 근거는 NOTES.md.
(function (root, factory) {
  if (typeof module === 'object') module.exports = factory();
  else root.Calc = factory();
})(this, function () {
  const YEARS = [2026, 2025, 2024, 2023];
  const MIN_WAGE = { 2023: 9620, 2024: 9860, 2025: 10030, 2026: 10320 };
  const RATE = {
    private: { 2023: 0.031, 2024: 0.031, 2025: 0.031, 2026: 0.031 },
    public: { 2023: 0.036, 2024: 0.038, 2025: 0.038, 2026: 0.038 },
    gov: { 2023: 0.036, 2024: 0.038, 2025: 0.038, 2026: 0.038 },
  };
  const MAX = 10000000;

  // 미달 1명당 월 부담금. 고용 비율(고용/의무)이 낮을수록 높은 배수를 쓴다.
  function unitFee(year, counted, obligation) {
    const wage = MIN_WAGE[year] * 209;
    if (counted <= 0) return wage;
    const base = Math.ceil((wage * 0.6) / 1000) * 1000;
    const r = counted / obligation;
    const pct = r >= 0.75 ? 100 : r >= 0.5 ? 106 : r >= 0.25 ? 120 : 140;
    return Math.round((base * pct) / 100);
  }

  function parse(v) {
    if (v === '' || v == null) return NaN;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= MAX ? n : NaN;
  }

  function calculate(input) {
    if (!RATE[input.type]) return { error: '사업체 구분을 선택해 주세요.' };
    const workers = parse(input.workers);
    if (Number.isNaN(workers)) return { error: '전체 근로자 수를 0 이상의 정수로 입력해 주세요.' };
    const mild = parse(input.mild === '' ? 0 : input.mild);
    const s60 = parse(input.severe60 === '' ? 0 : input.severe60);
    const sUnder = parse(input.severeUnder === '' ? 0 : input.severeUnder);
    if ([mild, s60, sUnder].some(Number.isNaN)) return { error: '장애인 근로자 수는 0 이상의 정수로 입력해 주세요.' };

    const counted = mild + s60 * 2 + sUnder;
    const rows = {};
    for (const y of YEARS) {
      const obligation = workers >= 50 ? Math.floor(workers * RATE[input.type][y]) : 0;
      const shortfall = Math.max(0, obligation - counted);
      const monthly = shortfall ? shortfall * unitFee(y, counted, obligation) : 0;
      rows[y] = { obligation, shortfall, monthly, annual: monthly * 12 };
    }
    const cur = rows[YEARS[0]];
    return {
      eligible: workers >= 50,
      notice: workers >= 50 ? '' : '상시근로자 50명 이상 사업체가 장애인 고용의무 대상입니다.',
      obligation: cur.obligation,
      shortfall: cur.shortfall,
      monthly: cur.monthly,
      annual: Object.fromEntries(YEARS.map((y) => [y, rows[y].annual])),
      total: cur.annual,
    };
  }

  return { calculate, YEARS };
});
