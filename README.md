# 📚 북튜닝 (Book Tuning) v4.3

> **"책을 읽고 기록하며, 내 삶과 생각의 주파수를 맞춰가는 공간"**  
> 구글 시트(GAS)를 완전히 걷어내고 **노션(Notion)을 단독 실시간 데이터베이스(DB)로 활용**하는 Next.js 14 풀스택 독서 기록 웹앱입니다.

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Notion API](https://img.shields.io/badge/Notion%20API-v2.2-white?logo=notion)](https://developers.notion.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Google%20Gemini-AI%20OCR%20%26%20Report-blue?logo=google)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning&env=NOTION_API_KEY,NOTION_BOOK_DB_ID,NOTION_LOG_DB_ID,NOTION_INSIGHT_DB_ID,NOTION_USER_DB_ID,GEMINI_API_KEY&envDescription=%EB%85%B8%EC%85%98%20API%20%ED%86%A0%ED%81%B0%EA%B3%BC%20%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4%2032%EC%9E%90%EB%A6%AC%20ID%20%EB%B0%8F%20Gemini%20API%20%ED%82%A4%EB%5B%ED%95%84%EC%88%98%5D%EB%A5%BC%20%EC%9E%85%EB%A0%A5%ED%95%98%EC%84%B8%EC%9A%94&envLink=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning%23step-2-%EB%85%B8%EC%85%98notion-%ED%85%9C%ED%94%8C%EB%A6%BF-%EB%B3%B5%EC%A0%9C-%EB%B0%8F-api-%ED%82%A4-%EB%B0%9C%EA%B8%89)

---

## ✨ 핵심 기능 (Key Features)

1. **⚡ 노션 단독 백엔드 (Real-time Notion DB)**
   - 중간 단계였던 구글 스프레드시트(GAS)를 완전히 제거하여 데이터 불일치 문제를 원천 해소했습니다.
   - 웹앱에서 도서/기록을 등록·수정하면 노션에 실시간 반영(PUT)되고, 삭제 시 노션 공식 API(`archived: true`)를 통해 **노션 데이터베이스에서 즉시 사라져 휴지통으로 안전하게 이동**합니다.
   - 도서 삭제 시 연관된 모든 독서일지와 문장수집까지 노션에서 함께 추적하여 일괄 삭제(종속 정리)합니다.

2. **🔒 다중 사용자 & 도서 소유권 분리 보안**
   - **동명이인 방지 및 본인 인증**: `활동 닉네임 + 4자리 PIN` 기반으로 하나의 노션 데이터베이스를 공유하면서도 각자의 독서 포트폴리오를 구축합니다.
   - **철저한 소유권 보호**: 본인이 등록한 도서에 대해서만 진도 기록, 문장 수집, 도서 수정/삭제, 감상문 저장이 가능합니다.
   - **커뮤니티 둘러보기**: 타인의 도서는 열람과 공감(❤️ 좋아요)만 가능한 '읽기 전용'으로 보호됩니다.

3. **🔍 도서 검색 3대 엔진 & 확인 등록 폼**
   - **카카오 + 국립중앙도서관(추천)**: 카카오 도서 검색에 국립중앙도서관 오픈API를 매칭하여 총 페이지수를 자동 추출합니다.
   - **알라딘 API**: 알라딘 상품 조회(ItemLookUp)를 병렬 호출하여 실제 페이지수(예: 272쪽)를 100% 자동 파싱합니다.
   - **네이버 API**: 네이버 도서 검색 엔진을 통한 고화질 표지 및 메타데이터 지원.
   - **도서 정보 확인 및 등록**: 검색 결과를 클릭하면 바로 저장되지 않고, 표지 미리보기·ISBN·도서명·저자·출판사·**전체 쪽수(수정 가능)**를 확인한 뒤 등록합니다.

4. **📷 사진 업로드 & Gemini Vision OCR**
   - 책 속의 인상 깊은 문장이나 손글씨 메모를 스마트폰으로 촬영해 올리면, **Gemini 2.5 Flash Vision** 모델이 한국어 텍스트를 오타 없이 즉시 추출합니다.

5. **🤖 Gemini AI 1인칭 독서 감상문 생성**
   - 사용자가 기록한 일지와 문장수집 메모들을 분석하여 독자의 어조로 작성된 **1인칭 맞춤형 독후감 초안**을 생성하고, 버튼 하나로 노션 도서 본문에 콜아웃 블록으로 영구 저장합니다.

6. **📱 PWA & 모바일 반응형 최적화**
   - 모바일 브라우저(Safari, Chrome)에서 **[홈 화면에 추가]**를 누르면 앱 아이콘과 함께 스마트폰 전용 네이티브 앱처럼 동작합니다.
   - 좁은 화면(360px ~ 480px)에서도 화면 깨짐이나 틀어짐 없는 반응형 CSS가 완비되어 있습니다.

7. **📊 독서 진도율 실시간 롤업 & 랭킹보드**
   - 누적 완독 권수, 읽은 페이지 수 기반의 실시간 랭킹보드 및 책 표지별 실시간 진도율(%) 프로그레스 바를 제공합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Serverless Route Handlers (`app/api/*`)
- **Database**: Notion Database (`@notionhq/client` v2.2)
- **AI & OCR**: Google Gemini 2.5 Flash API
- **Book Search**: Kakao Books API, Aladin TTB API, Naver Search API, 국립중앙도서관 오픈API
- **Deployment**: Vercel (클라우드 무중단 자동 배포)

---

## 🚀 깃허브 복제(Fork) 및 배포 가이드

북튜닝은 SaaS 서비스가 아닌 **개인/그룹이 직접 배포하여 소유하는 오픈소스 웹앱**입니다. 아래 순서대로 진행하시면 누구나 5분 안에 나만의 독서 웹앱을 배포할 수 있습니다.

### STEP 1. 깃허브 저장소 복제 (Fork)
1. 상단 우측의 **[Fork]** 버튼을 클릭합니다.
2. 자신의 GitHub 계정(Repository Name: `book-tuning`)으로 포크(복제)합니다.
3. 이제 여러분의 개인 깃허브 저장소에 북튜닝 전체 소스코드가 안전하게 저장됩니다.

---

### STEP 2. 공식 배포용 노션 템플릿 복제 및 API 연결

직접 데이터베이스를 만들 필요 없이, 미리 모든 스키마와 양방향 관계형이 완벽하게 세팅된 공식 노션 템플릿을 복제하여 1초 만에 준비할 수 있습니다.

👉 **[📚 북튜닝(Book Tuning) 개인 독서 기록장 (배포용) (웹앱 연동) 복제하기 ↗](https://app.notion.com/p/record-tuner/Book-Tuning-36c9a42118958035be6cf82a7f33d8fb?source=copy_link)**

#### 1) 템플릿 복제 (Duplicate)
1. 위 링크를 열고 노션 우측 상단의 **[복제(Duplicate)]** 버튼을 클릭하여 본인의 노션 워크스페이스로 가져옵니다.
2. 복제된 페이지 안에는 연동에 필요한 4개의 데이터베이스가 이미 완벽하게 구성되어 있습니다.

#### 2) 노션 API 내부 통합(토큰) 만들기
1. [노션 개발자 포털 (My Integrations)](https://www.notion.so/my-integrations)에 접속합니다.
2. **[+ 새 통합 만들기]**를 클릭합니다.
3. 이름(예: `북튜닝 봇`)을 입력하고 **[저장]**합니다.
4. 발급된 **내부 통합 Secret 토큰**(`ntn_...` 또는 `secret_...`)을 복사해 둡니다. (➔ `NOTION_API_KEY`)

#### 3) 복제한 노션 페이지에 통합 봇 초대
복제한 **[북튜닝 개인 독서 기록장]** 최상위 페이지 우측 상단의 `···` (더보기) ➔ **[연결 추가 (Add connections)]**를 클릭하고, 방금 만든 **북튜닝 봇**을 선택하여 연결합니다. (하위 4개 데이터베이스까지 자동으로 권한이 부여됩니다.)

#### 4) 4대 데이터베이스 32자리 ID 확인
복제된 페이지 내 4개 데이터베이스의 표 제목 우측 `···` ➔ **[링크 복사]**를 누르면 URL을 얻을 수 있습니다:

| 데이터베이스 | 역할 및 포함 열 |
| :--- | :--- |
| **도서 DB** | 도서 정보, 책 제목, 저자, 출판사, 페이지수, 표지, 기록자, 공감수 등 |
| **독서일지 DB** | 일자별 진도 페이지 및 독서 소감 |
| **문장수집 DB** | 인상 깊은 문장, 발췌 페이지, 책 속 사진 |
| **사용자 DB** | 활동 닉네임, 동명이인 방지 4자리 PIN, 3개 DB 양방향 관계형 |

> 💡 **32자리 DB ID 찾는 법**:  
> 브라우저 주소창(또는 복사한 링크)에서 `notion.so/워크스페이스이름/` 뒤부터 `?v=` 직전까지의 32자리 영문/숫자가 해당 DB의 ID입니다.  
> 예: `https://www.notion.so/workspace/33f9a4211895829a9cdf017dc886e012?v=...` ➔ `33f9a4211895829a9cdf017dc886e012`

---

### STEP 3. Vercel 원클릭 클라우드 배포

가장 간편한 방법은 아래 **[Deploy with Vercel]** 버튼을 누르는 것입니다. 클릭 한 번으로 저장소 복제부터 필수 환경변수 입력 안내까지 한 번에 진행됩니다:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning&env=NOTION_API_KEY,NOTION_BOOK_DB_ID,NOTION_LOG_DB_ID,NOTION_INSIGHT_DB_ID,NOTION_USER_DB_ID,GEMINI_API_KEY&envDescription=%EB%85%B8%EC%85%98%20API%20%ED%86%A0%ED%81%B0%EA%B3%BC%20%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4%2032%EC%9E%90%EB%A6%AC%20ID%20%EB%B0%8F%20Gemini%20API%20%ED%82%A4%EB%5B%ED%95%84%EC%88%98%5D%EB%A5%BC%20%EC%9E%85%EB%A0%A5%ED%95%98%EC%84%B8%EC%9A%94&envLink=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning%23step-2-%EB%85%B8%EC%85%98notion-%ED%85%9C%ED%94%8C%EB%A6%BF-%EB%B3%B5%EC%A0%9C-%EB%B0%8F-api-%ED%82%A4-%EB%B0%9C%EA%B8%89)

*(또는 Vercel 대시보드에서 직접 가져올 경우)*:
1. [Vercel](https://vercel.com/)에 로그인하고 **[Add New...]** ➔ **[Project]**를 클릭합니다.
2. STEP 1에서 Fork한 본인의 `book-tuning` 저장소를 찾아 **[Import]**를 클릭합니다.
3. **Environment Variables** 토글을 열고 아래 환경 변수들을 입력합니다:

| 환경 변수 Key | 설명 | 필수 여부 |
| :--- | :--- | :--- |
| `NOTION_API_KEY` | 노션 내부 통합 Secret 토큰 (`ntn_...`) | **필수** |
| `NOTION_BOOK_DB_ID` | 노션 도서 DB의 32자리 ID | **필수** |
| `NOTION_LOG_DB_ID` | 노션 독서일지 DB의 32자리 ID | **필수** |
| `NOTION_INSIGHT_DB_ID` | 노션 문장수집 DB의 32자리 ID | **필수** |
| `NOTION_USER_DB_ID` | 노션 사용자 DB의 32자리 ID | **필수 (소유권 관리)** |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) 무료 API 키 | **필수 (AI/OCR)** |
| `KAKAO_REST_API_KEY` | [카카오 Developers](https://developers.kakao.com/) REST API 키 | 권장 (도서검색) |
| `NL_API_KEY` | [국립중앙도서관](https://www.nl.go.kr/) 오픈API 인증키 | 선택 (쪽수 연동) |
| `ALADIN_API_KEY` | [알라딘 TTB](https://www.aladin.co.kr/ttb/wmain.aspx) 인증키 | 선택 (알라딘 검색) |
| `NAVER_CLIENT_ID` | [네이버 Developers](https://developers.naver.com/) Client ID | 선택 (네이버 검색) |
| `NAVER_CLIENT_SECRET` | 네이버 개발자 Client Secret | 선택 (네이버 검색) |
| `NEXT_PUBLIC_NOTION_DATABASE_URL` | 푸터의 '노션 데이터베이스 열기 ↗' 바로가기 웹 링크 (비워두면 버튼 자동 숨김) | 선택 (개인정보 보호) |

> 💡 **노션 바로가기 버튼 안내**:  
> 웹앱 하단의 `노션 데이터베이스 열기 ↗` 버튼 링크는 코드에 하드코딩되지 않고 `NEXT_PUBLIC_NOTION_DATABASE_URL` 환경변수를 통해서만 동작합니다. 이 값을 비워두면 버튼 자체가 화면에서 사라지므로, 개인 노션 주소가 외부에 노출되지 않습니다.

> 💡 **꿀팁**: 프로젝트 루트의 `.env.example` 형식대로 키=값을 메모장에 복사한 뒤, Vercel 첫 번째 Key 칸에 붙여넣으면 Vercel이 모든 항목을 자동으로 인식해 일괄 채워줍니다!

4. **[Deploy]** 버튼을 누르면 약 1분 후 나만의 전용 웹앱 도메인(`https://your-project.vercel.app`)이 생성됩니다! 🎉

---

## 💻 로컬 개발 환경 실행 방법

로컬 PC에서 수정하고 실행해보려면:

```bash
# 1. 포크한 저장소 복제
git clone https://github.com/YOUR_GITHUB_ID/book-tuning.git
cd book-tuning

# 2. 의존성 패키지 설치
npm install

# 3. 로컬 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열고 본인의 API 키와 노션 DB ID 입력

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

---

## 📜 저작권 및 이용 권리 안내

- **기획 및 핵심 설계**: 기록조율사 조용희 선생님 (서울외고)
- **인스타그램**: [@record_tuner](https://www.instagram.com/record_tuner/)
- **라이선스**: 본 프로젝트는 오픈소스로 공개되어 있으며, 교육적 목적 및 개인 독서 모임용으로 자유롭게 포크하여 배포·사용할 수 있습니다. 단, 상업적 재판매나 출처 없는 무단 도용은 금지됩니다.
