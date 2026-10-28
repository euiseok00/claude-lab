# 수호인 학습용 사이트 (suhoin/plain)

Node 내장 모듈만 사용. 의존성 설치 없음. 프런트는 바닐라 JS/CSS (번들 없음, `public/` 약 12KB).

```
node server.js     # http://localhost:3000 (PORT 환경변수로 변경)
node --test test/test.js # 계산·라우트·폼 테스트
```

- 폼 접수: `data/inquiry.jsonl`, `data/employment.jsonl` (git 제외)
- 구조: `server.js` 라우팅/API, `lib/pages.js` 페이지, `lib/forms.js` 폼 정의+검증, `public/calc.js` 계산기(서버 테스트와 브라우저 공용)
- 근거와 가정: `NOTES.md`
