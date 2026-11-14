# 📚 북튜닝 (Book Tuning) v4.5

> **"책을 읽고 기록하며, 내 삶과 생각의 주파수를 맞춰가는 공간"**  
> 구글 시트(GAS)를 완전히 걷어내고 **노션(Notion)을 단독 실시간 데이터베이스(DB)로 활용**하는 Next.js 14 풀스택 독서 기록 웹앱입니다.  
> v4.5에서는 학급 서재와 교사 모임 서재의 완벽한 분리 연동, 나만의 독서 감상문 직접 작성, Google Gemini 기반 책 사진 고정밀 OCR 수집 기능이 안정화되었습니다.

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Notion API](https://img.shields.io/badge/Notion%20API-v2.2-white?logo=notion)](https://developers.notion.com/)
[![Gemini OCR](https://img.shields.io/badge/Vision%20OCR-Google%20Gemini-blue)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning&env=NOTION_API_KEY,NOTION_BOOK_DB_ID,NOTION_LOG_DB_ID,NOTION_INSIGHT_DB_ID,NOTION_USER_DB_ID,GEMINI_API_KEY&envDescription=%EB%85%B8%EC%85%98%20API%20%ED%86%A0%ED%81%B0%EA%B3%BC%20%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4%2032%EC%9E%90%EB%A6%AC%20ID%20%EB%B0%8F%20Gemini%20API%20%ED%82%A4%EB%5B%ED%95%84%EC%88%98%5D%EB%A5%BC%20%EC%9E%85%EB%A0%A5%ED%95%98%EC%84%B8%EC%9A%94&envLink=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning%23step-2-%EB%85%B8%EC%85%98notion-%ED%85%9C%ED%94%8C%EB%A6%BF-%EB%B3%B5%EC%A0%9C-%EB%B0%8F-api-%ED%82%A4-%EB%B0%9C%EA%B8%89)

---

## ✨ 핵심 기능 (Key Features)

### 1. 🗂️ 개인 대시보드 4대 탭 구조 (v4.4 신규)
- 🏠 **홈**:
  - **표준 알약 검색바**: 카카오 도서 검색 + 국립중앙도서관(NL) 쪽수 자동 매핑 및 수동 직접 등록 지원
  - **지금 읽는 책**: 미완독 도서 카드와 세그먼트 프로그레스 바로 진도율 직관 표시
  - **월 독서기록 달력**: 7열 달력 그리드와 일자별 독서 기록 팝오버, 월간 요약 통계(기록 일수·누적 쪽수·완독 권수) 및 이번 달 완독 목표
  - **최근 독서기록**: 가장 최근 작성된 일지와 문장 수집을 카드 형태로 미리보기
- 📚 **서재**:
  - `[내 서재]`와 `[구성원 전체 서재]` 탭 분리
  - 마우스 휠 및 좌우 드래그 가로 스크롤 서가
  - 상태별(전체/읽는 중/완독) 필터 및 제목·저자 검색
- 💬 **피드**:
  - 함께 참여하는 모든 구성원의 독서일지와 문장수집을 시간순으로 열람하고 원클릭 공감(❤️)
- 🐾 **도감**:
  - 진도율 100%를 달성한 완독 도서의 표지만 모아보는 개인 독서 완독 컬렉션 갤러리

### 2. ⚡ 노션 단독 백엔드 (Real-time Notion DB)
- 중간 구글 시트(GAS) 없이 노션 API 4종 데이터베이스를 직접 조회·수정합니다.
- 웹앱에서 도서·일지·문장 등록/수정 시 노션에 실시간 반영되며, 삭제 시 `archived: true`로 노션 휴지통에 안전 이동합니다. 도서 삭제 시 종속된 일지/문장까지 일괄 정리됩니다.

### 3. 🔒 다중 사용자 및 도서 소유권 분리 보안
- **동명이인 방지 및 본인 인증**: `활동 닉네임 + 4자리 PIN` 기반으로 하나의 노션 데이터베이스를 공유하면서도 각자의 포트폴리오를 유지합니다.
- **철저한 소유권 보호**: 본인이 등록한 도서에 대해서만 진도 기록, 문장 수집, 도서 수정/삭제가 가능하며 타인의 도서는 읽기 전용으로 안전하게 보호됩니다.

### 4. 📸 책 사진 본문 OCR 및 나만의 감상문 직접 작성
- **Google Gemini 비전 OCR**: 책 속 인상 깊은 구절을 직접 타이핑할 필요 없이 스마트폰 카메라 사진이나 캡처 이미지를 첨부하면 고정밀 AI로 텍스트를 자동 추출하여 문장 수집에 기록합니다.
- **나만의 독서 감상문 직접 작성**: AI 초안에 의존하지 않고, 자신이 축적한 진도 일지와 발췌 문장을 되짚어보며 진솔한 1인칭 독서 감상문을 정성껏 작성하고 노션에 안전하게 저장합니다.

### 5. 🎨 Three.js WebGL 입장 화면 & 스포트라이트 사용법
- **감성 파동 입장 게이트**: Three.js `WebGLShader` 파동 배경과 `LiquidButton` 기반의 감성적인 진입 화면
- **스포트라이트 사용법 투어**: 화면을 어둡게 흐리고(Dimmed Blur) 따라다니는 포스트잇 핀으로 7단계 핵심 기능을 안내
- **북튜닝 소개 영상**: 튜토리얼 마지막 단계에서 앱 내 자체 플레이어로 북튜닝 홍보/가이드 영상을 바로 시청 가능

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React
- **Graphics & 3D**: Three.js, Raw WebGL Shader, CSS GPU 하드웨어 가속
- **Backend**: Next.js Serverless Route Handlers (`app/api/*`)
- **Database**: Notion Database (`@notionhq/client` v2.2)
- **AI Vision OCR**: Google Gemini Vision (`gemini-3.7-flash`)
- **Book Search**: Kakao Books API, 국립중앙도서관 오픈API
- **Deployment**: Vercel (클라우드 무중단 자동 배포)

---

## 🚀 깃허브 복제(Fork) 및 배포 가이드

### STEP 1. 깃허브 저장소 복제 (Fork)
1. 상단 우측의 **[Fork]** 버튼을 클릭하여 본인의 GitHub 계정으로 저장소를 복제합니다.

---

### STEP 2. 공식 배포용 노션 템플릿 복제 및 API 연결

👉 **[📚 북튜닝(Book Tuning) 배포용 노션 템플릿 복제하기 ↗](https://app.notion.com/p/record-tuner/Book-Tuning-36c9a42118958035be6cf82a7f33d8fb?source=copy_link)**

1. 링크를 열고 노션 우측 상단의 **[복제(Duplicate)]** 버튼을 눌러 본인의 노션 워크스페이스로 복제합니다.
2. [노션 개발자 포털 (My Integrations)](https://www.notion.so/my-integrations)에서 **[+ 새 통합 만들기]**(예: `북튜닝 봇`)를 생성하고 **내부 통합 Secret 토큰**(`ntn_...`)을 복사합니다.
3. 복제한 노션 페이지 우측 상단의 `···` ➔ **[연결 추가 (Add connections)]**에서 방금 만든 봇을 연결합니다.
4. 페이지 안의 4개 데이터베이스 URL에서 **32자리 ID**를 확인합니다:
   - 도서 DB ID (`NOTION_BOOK_DB_ID`)
   - 독서일지 DB ID (`NOTION_LOG_DB_ID`)
   - 문장수집 DB ID (`NOTION_INSIGHT_DB_ID`)
   - 사용자 DB ID (`NOTION_USER_DB_ID`)

---

### STEP 3. Vercel 원클릭 클라우드 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning&env=NOTION_API_KEY,NOTION_BOOK_DB_ID,NOTION_LOG_DB_ID,NOTION_INSIGHT_DB_ID,NOTION_USER_DB_ID,GEMINI_API_KEY&envDescription=%EB%85%B8%EC%85%98%20API%20%ED%86%A0%ED%81%B0%EA%B3%BC%20%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4%2032%EC%9E%90%EB%A6%AC%20ID%20%EB%B0%8F%20Gemini%20API%20%ED%82%A4%EB%5B%ED%95%84%EC%88%98%5D%EB%A5%BC%20%EC%9E%85%EB%A0%A5%ED%95%98%EC%84%B8%EC%9A%94&envLink=https%3A%2F%2Fgithub.com%2Fygywam%2Fbooktuning%23step-2-%EB%85%B8%EC%85%98notion-%ED%85%9C%ED%94%8C%EB%A6%BF-%EB%B3%B5%EC%A0%9C-%EB%B0%8F-api-%ED%82%A4-%EB%B0%9C%EA%B8%89)

#### Vercel 환경 변수 (Environment Variables)

| 환경 변수 Key | 설명 | 필수 여부 |
| :--- | :--- | :--- |
| `NOTION_API_KEY` | 노션 내부 통합 Secret 토큰 (`ntn_...`) | **필수** |
| `NOTION_BOOK_DB_ID` | 노션 도서 데이터베이스 32자리 ID | **필수** |
| `NOTION_LOG_DB_ID` | 노션 독서일지 데이터베이스 32자리 ID | **필수** |
| `NOTION_INSIGHT_DB_ID` | 노션 문장수집 데이터베이스 32자리 ID | **필수** |
| `NOTION_USER_DB_ID` | 노션 사용자 데이터베이스 32자리 ID | **필수** |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) 무료 API 키 (책 사진 본문 OCR용) | **선택 (OCR 사용 시)** |
| `GEMINI_MODEL` | 사용할 Gemini 모델 ID (기본값: `gemini-3.7-flash`) | 선택 |
| `KAKAO_REST_API_KEY` | [카카오 Developers](https://developers.kakao.com/) REST API 키 | 권장 (도서검색) |
| `NL_API_KEY` | [국립중앙도서관](https://www.nl.go.kr/) 오픈API 인증키 | 선택 (쪽수 연동) |
| `NEXT_PUBLIC_NOTION_DATABASE_URL` | 푸터의 '노션 데이터베이스 열기 ↗' 바로가기 링크 (미입력 시 버튼 숨김) | 선택 (개인정보 보호) |
| `NEXT_PUBLIC_SCHOOL_NAME` | 우리 학교 이름 (예: `서울외고`). 설정 시 앱 이름이 `서울외고 북튜닝`으로 자동 브랜딩 | **선택 (학교별 배포)** |

---

### 🏫 STEP 4. 학교별 맞춤형 배포(White-label) 및 Vercel 도메인 설정

북튜닝은 전국의 초·중·고등학교 및 교육 기관에서 학교 자체의 독립된 독서 서재 앱으로 운영할 수 있도록 설계되었습니다.

1. **학교명 환경 변수 세팅**:
   - Vercel 프로젝트 대시보드의 **Settings ➔ Environment Variables**에 `NEXT_PUBLIC_SCHOOL_NAME`을 추가하고 학교 이름(예: `서울외고`)을 입력합니다.
   - 배포 후 접속하면 상단 마스트헤드, 브라우저 탭, 입장 게이트에 **`서울외고 북튜닝`**으로 자동 표기됩니다.
2. **학교 전용 Vercel 도메인 권장 양식**:
   - Vercel의 **Settings ➔ Domains**에서 도메인을 아래와 같은 표준 형식으로 세팅하는 것을 강력히 권장합니다:
   - 🌐 **권장 형식**: `booktuning-(학교영문약칭).vercel.app`
   - 💡 **실제 예시**:
     - 서울외국어고등학교: `booktuning-sfl.vercel.app`
     - 대전고등학교: `booktuning-dj.vercel.app`
     - 경기중학교: `booktuning-gg.vercel.app`
   - 이렇게 세팅하면 학생들과 학부모, 동료 교사들이 주소를 보았을 때 학교 공식 독서 플랫폼으로 친근하고 신뢰감 있게 인식합니다.

> 💡 **검색 서비스 안내**: 알라딘(2026.10.30 종료) 및 네이버(2026.07.31 종료) 도서 검색 API는 서비스 공식 종료에 따라 설정에서 비활성화되어 있으며, 카카오 도서 검색과 국립중앙도서관(NL) 총 페이지수 자동 매핑 엔진이 기본 표준으로 작동합니다.

---

## 💻 로컬 개발 환경 실행

```bash
# 1. 저장소 클론
git clone https://github.com/ygywam/booktuning.git
cd booktuning

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

## 📜 저작권 및 외부 레퍼런스 라이선스 고지 (Copyright & References)

북튜닝은 오픈소스 커뮤니티의 훌륭한 프로젝트들을 존중하며 아래의 저작권과 라이선스를 준수합니다:

| 구분 | 컴포넌트 / 리소스 | 원저작자 / 출처 | 라이선스 / 비고 |
| :--- | :--- | :--- | :--- |
| **기획 & 설계** | 북튜닝(Book Tuning) 전체 기획 및 구조 | 조용희 선생님 (서울외고, [@record_tuner](https://www.instagram.com/record_tuner/)) | All Rights Reserved |
| **입장 화면** | Three.js WebGL 파동 셰이더 (`web-gl-shader.tsx`) | [designali-in](https://designali.in) | MIT License |
| **입장 화면** | 리퀴드 글래스 버튼 (`liquid-glass-button.tsx`) | [designali-in](https://designali.in) | MIT License |
| **서재 & 개발로그** | macOS Dock 스타일 휠 캐러셀 및 피시아이 인터랙션 | Apple macOS Dock 인터랙션 패턴 및 북튜닝 커스텀 | Custom CSS/JS |
| **도서 검색** | 카카오 도서 검색 API (표지·서지정보) | Kakao Corp. | Kakao Open API Terms |
| **서지 쪽수** | 국립중앙도서관(NL) 서지정보 오픈API | 국립중앙도서관 (대한민국 정부) | 공공데이터 활성화 공공누리 |
| **AI 비전 OCR** | Gemini Vision OCR (`gemini-3.7-flash`) | Google DeepMind | Google AI Studio Terms |
| **백엔드 SDK** | Notion Client SDK (`@notionhq/client`) | Notion Labs, Inc. | MIT License |
| **아이콘** | Lucide React Icons | Lucide Project | ISC License |
| **디자인 시스템** | Tailwind CSS & Impeccable Design Token | Tailwind Labs | MIT License |

---

## 📄 라이선스 및 학교별 이용 권한 (License & Education Use)

- 본 프로젝트는 오픈소스로 공개되어 있으며, **전국의 초·중·고등학교 및 교육 기관에서 학교 단위 및 학급 독서 모임용으로 자유롭게 포크하여 배포·수정·사용**할 수 있습니다.
- 환경 변수(`NEXT_PUBLIC_SCHOOL_NAME`)를 통해 학교명을 자유롭게 지정하고 전용 도메인(`booktuning-(학교명).vercel.app`)으로 브랜딩하여 운영할 수 있습니다.
- 단, 원저작자(기록조율사 서울외고 조용희 선생님, [@record_tuner](https://www.instagram.com/record_tuner/))의 기획 출처 표기를 보존해야 하며, 상업적 재판매나 유료 서비스화는 금지됩니다.
