# TASKS

## 1단계: 분석 및 아키텍처 정립 (완료)
- [x] backup(v4.2) GAS 코드와 현재 Next.js 코드 전수 비교 분석
- [x] 노션 3개 DB 프로퍼티 매핑 및 데이터 호환성 검증
- [x] 미비점 리포트 및 100% 이관 계획 수립 (사용자 승인 완료)

## 2단계: 백엔드 API 완비 (노션 단독 백엔드 구축 완료)
- [x] 사용자 인증/등록 API 구현 (`/api/users` - 닉네임 + PIN 기반 사용자 DB 조회/생성)
- [x] 기존 데이터 원클릭 사용자 관계형 자동 마이그레이션 API 구현 (`/api/users/migrate`)
- [x] 노션 도서 목록 조회 API 확장 (진도율·최근 진도쪽수·좋아요 집계 실시간 롤업)
- [x] 도서 상세 통합 타임라인 API 구현 (도서별 독서일지+문장수집 통합 쿼리 및 본문 감상문 파싱)
- [x] 도서 CRUD 완성 (`POST/PUT/DELETE /api/books`, 사용자 Relation 연결 지원)
- [x] 독서일지(진도) CRUD 완성 (`POST/PUT/DELETE /api/logs`)
- [x] 문장수집(인사이트) CRUD 완성 (`POST/PUT/DELETE /api/insights`, 사진 연동)
- [x] 공감(좋아요) 토글 API 구현 (`POST /api/like`, `공감수`/`공감한 사람` 동기화)
- [x] 나의 독서 감상문 노션 본문 블록 저장 API 구현 (`POST /api/my-report`)
- [x] 도서 검색 API 고도화 (`GET /api/search-books` - 국립중앙도서관 쪽수 자동 파싱 연동)
- [x] 이미지 업로드 & Gemini OCR API 구현 (`POST /api/ocr` - 문장 사진 텍스트 자동 추출)

## 3단계: 프론트엔드 기능 100% 복원 (완료)
- [x] 닉네임 로그인 / 온보딩 모달 (다중 사용자 프로필 및 PIN 지원)
- [x] 도서 수동 직접 등록 모달 복원
- [x] 도서 상세 모달 3개 탭(통합 타임라인, AI 감상문, 나의 감상문) 완벽 연동
- [x] 랭킹보드(완독 권수 / 독서 페이지 랭킹) 렌더링
- [x] 도서 및 기록 수정/삭제 UI 연동
- [x] 문장수집 사진 첨부 및 Gemini OCR 원클릭 추출 연동
- [x] 튜토리얼 / 사용 가이드 5단계 슬라이더 모달 복원
- [x] 테마 및 설정 모달 기능 보강 (원클릭 마이그레이션 버튼 포함)

## 4단계: 검증 및 배포 준비 (완료)
- [x] Next.js 프로덕션 빌드 (`npm run build`) 15개 라우트 전원 통과 확인
- [x] 실제 노션 DB 연동 검증 (`GET /api/books`, `GET /api/timeline`, `POST /api/users`)
- [x] 국립중앙도서관 쪽수 자동 파싱 검증 (어린왕자 136쪽 확인)
- [x] `.env.example` 마스킹, `.env.local` 분리, `.gitignore` 신설 완료
- [ ] 노션 신규 사용자 DB 생성 가이드 및 Vercel 배포 가이드 문서화 (사용자 안내)
