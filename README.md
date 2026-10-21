# 📚 북튜닝 (Book Tuning) - 노션 백엔드 독서 웹앱

노션 데이터베이스(Notion DB)를 백엔드로 활용하여 독서 기록, 문장 수집, Gemini AI 독후감을 관리하는 웹 앱입니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🚀 3분 원클릭 배포 방법

### STEP 1. 노션 템플릿 복제
1. 본인의 노션 계정에 접속합니다.
2. 배포된 [북튜닝 노션 템플릿]을 연 후 우측 상단의 **[복제(Duplicate)]**를 클릭합니다.

### STEP 2. Vercel 배포 버튼 클릭
1. 위 **[Deploy with Vercel]** 버튼을 클릭합니다.
2. 본인의 GitHub 계정을 연동합니다.

### STEP 3. 환경 변수(Environment Variables) 입력
Vercel 배포 화면에서 아래 환경 변수 값들을 입력합니다:

| 환경 변수 이름 | 설명 |
| :--- | :--- |
| `NOTION_API_KEY` | 노션 내 API 통합(Integrations)에서 발급받은 Secret 토큰 |
| `NOTION_BOOK_DB_ID` | 노션 도서 DB 페이지 URL의 32자리 아이디 |
| `NOTION_LOG_DB_ID` | 노션 독서일지 DB 페이지 URL의 32자리 아이디 |
| `NOTION_INSIGHT_DB_ID` | 노션 문장수집 DB 페이지 URL의 32자리 아이디 |
| `GEMINI_API_KEY` | Google AI Studio에서 무료 발급받은 API 키 |
| `KAKAO_REST_API_KEY` | 카카오 Developers에서 발급받은 REST API 키 |

3. **[Deploy]** 버튼을 누르면 나만의 전용 독서 웹앱 URL이 자동으로 생성됩니다!