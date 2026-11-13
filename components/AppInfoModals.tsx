'use client';

import React from 'react';
import DevLogModal from '@/components/DevLogModal';
import { AiProvider, AiStatusInfo } from '@/lib/types';

interface AppInfoModalsProps {
  theme: string;
  onChangeTheme: (t: string) => void;
  searchApiType: 'aladin' | 'kakao' | 'naver';
  onChangeSearchApiType: (t: 'aladin' | 'kakao' | 'naver') => void;
  aiProvider: AiProvider;
  onChangeAiProvider: (p: AiProvider) => void;
  aiStatus: AiStatusInfo | null;
  notionPageUrl?: string;
  showSettingsModal: boolean;
  setShowSettingsModal: (v: boolean) => void;
  showDevLogModal: boolean;
  setShowDevLogModal: (v: boolean) => void;
  showPrivacyModal: boolean;
  setShowPrivacyModal: (v: boolean) => void;
  showCopyrightModal: boolean;
  setShowCopyrightModal: (v: boolean) => void;
}

/**
 * 설정, 개발로그(포스트잇 휠 캐러셀), 개인정보처리방침, 상세 저작권·레퍼런스 안내 모달 모음
 */
export default function AppInfoModals({
  theme,
  onChangeTheme,
  searchApiType,
  onChangeSearchApiType,
  aiProvider,
  onChangeAiProvider,
  aiStatus,
  notionPageUrl,
  showSettingsModal,
  setShowSettingsModal,
  showDevLogModal,
  setShowDevLogModal,
  showPrivacyModal,
  setShowPrivacyModal,
  showCopyrightModal,
  setShowCopyrightModal,
}: AppInfoModalsProps) {
  return (
    <>
      {/* 1. 설정 모달 */}
      {showSettingsModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)} />
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="section-title-row">
              <div>
                <h2>⚙️ 서재 환경 설정</h2>
                <p className="subtitle">테마, AI 엔진 및 도서 검색 엔진을 설정합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowSettingsModal(false)}>
                닫기
              </button>
            </div>

            <div className="space-y-4">
              {/* 테마 선택 */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">서재 테마 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'theme-base', name: '기본 (따뜻한 웜톤)' },
                    { id: 'theme-paper', name: '페이퍼 (종이책 감성)' },
                    { id: 'theme-forest', name: '포레스트 (차분한 녹음)' },
                    { id: 'theme-notion', name: '노션 (모던 클린)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeTheme(t.id)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        theme === t.id
                          ? 'border-amber-700 bg-amber-100 text-amber-900 shadow-sm'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI 엔진 선택 (Gemini / EXAONE) */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-700 mb-2">🤖 AI 엔진 선택 (감상문 & OCR)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeAiProvider('gemini')}
                    className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${
                      aiProvider === 'gemini'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs flex items-center justify-between">
                        <span>Google Gemini</span>
                        {aiStatus?.geminiConfigured && (
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                            연결됨
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">멀티모달 감상문 + 이미지 OCR 표준</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeAiProvider('exaone')}
                    className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${
                      aiProvider === 'exaone'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs flex items-center justify-between">
                        <span>LG EXAONE</span>
                        {aiStatus?.exaoneConfigured ? (
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                            연결됨
                          </span>
                        ) : (
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                            미설정
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">K-EXAONE 2.5 한국어 특화 감상문</p>
                    </div>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  ※ Vercel 환경변수에 <code>GEMINI_API_KEY</code> 또는 <code>EXAONE_API_KEY</code>를 등록해 사용합니다.
                </p>
              </div>

              {/* 도서 검색 엔진 선택 (알라딘/네이버 서비스 종료 고지 및 비활성화) */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-700 mb-2">도서 검색 엔진</label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'kakao',
                      title: '카카오 도서 + 국립중앙도서관 쪽수 (표준 추천)',
                      sub: '카카오 표지·서지정보와 국립중앙도서관(NL) 쪽수 자동 추출 하이브리드 연동',
                      isStandard: true,
                      disabled: false,
                    },
                    {
                      id: 'aladin',
                      title: '알라딘 TTB (서비스 종료: 2026.10.30)',
                      sub: '알라딘 오픈API 공식 서비스 제공 종료로 사용 불가',
                      isStandard: false,
                      disabled: true,
                    },
                    {
                      id: 'naver',
                      title: '네이버 검색 (서비스 종료: 2026.07.31)',
                      sub: '네이버 검색 API 도서 지원 공식 종료로 사용 불가',
                      isStandard: false,
                      disabled: true,
                    },
                  ].map((eng) => {
                    const isSelected = searchApiType === eng.id;
                    return (
                      <button
                        key={eng.id}
                        type="button"
                        disabled={eng.disabled}
                        onClick={() => !eng.disabled && onChangeSearchApiType(eng.id as any)}
                        className={`w-full p-2.5 text-left rounded-xl border transition flex flex-col ${
                          eng.disabled
                            ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200 text-stone-400'
                            : isSelected
                            ? 'border-amber-700 bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-600'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="font-extrabold text-xs">{eng.title}</span>
                          {eng.isStandard && (
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                              표준
                            </span>
                          )}
                          {eng.disabled && (
                            <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
                              종료됨
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 mt-0.5 leading-snug">{eng.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 노션 데이터베이스 바로가기 */}
              {notionPageUrl && (
                <div className="pt-2 border-t border-stone-200 flex justify-end">
                  <a
                    href={notionPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-bold hover:underline"
                  >
                    <span>노션 데이터베이스 직접 열기 ↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. 개발로그 모달 (휠 캐러셀 독 포스트잇) */}
      {showDevLogModal && <DevLogModal onClose={() => setShowDevLogModal(false)} />}

      {/* 3. 개인정보처리방침 모달 (도름스체크 법정 표준 규격) */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)} />
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="section-title-row">
              <div>
                <h2 style={{ color: 'var(--accent-dark)' }}>🛡️ 개인정보처리방침</h2>
                <p className="subtitle">북튜닝은 개인정보보호법 및 관계 법령을 준수하며 이용자의 권리를 철저히 보호합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowPrivacyModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-stone-700">
                <strong>북튜닝(Book Tuning)</strong>은 스마트 독서 서재 웹앱으로서, 주민등록번호·연락처·비밀번호 등 불필요한 개인식별정보를 일체 수집하지 않으며, 오직 이용자 본인의 안전한 독서 기록 관리만을 목적으로 합니다.
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">1. 수집하는 개인정보 항목 및 수집 방법</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li>
                    <strong>필수 수집 항목</strong>: 없음 (회원가입, 실명, 주민등록번호, 전화번호, 이메일 등 식별정보 미수집). 동명이인 구분을 위한 <strong>활동 닉네임과 4자리 PIN</strong>만 가명 처리하여 사용합니다.
                  </li>
                  <li>
                    <strong>선택 및 이용자 생성 항목</strong>: 도서 정보(제목, 저자, 출판사, 표지 이미지, 총 페이지수), 독서 기록(읽은 날짜, 누적 페이지, 독서일지, 문장수집 메모, 감상문, 첨부 사진).
                  </li>
                  <li>
                    <strong>브라우저 로컬 저장 항목</strong>: 사용자 환경설정(테마 선택값 `theme`, AI 모델 선택값 `ai_provider`, 도서 검색 엔진 선택값 `search_api_type`, 사용법 투어 완료 여부). 이는 이용자의 기기(Local Storage)에만 보관되며 외부 서버로 무단 전송되지 않습니다.
                  </li>
                  <li>
                    <strong>수집 방법</strong>: 이용자가 웹앱 화면을 통해 도서 등록, 일지 작성, 문장 메모 및 사진 업로드 시 직접 입력받아 처리합니다.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">2. 개인정보의 수집 및 이용 목적</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li><strong>스마트 서재 및 독서 현황 운영</strong>: 월별·기간별 독서 진도율 및 완독 통계 산출, 서재 Dock 및 도감 시각화, 독서일지·문장수집 타임라인 피드 제공.</li>
                  <li><strong>AI 독서 보조 서비스 제공</strong>: 이용자가 수집한 기록을 기반으로 Google Gemini AI 또는 LG EXAONE AI를 통한 독서 감상문 초안 보조 및 책 본문 사진 텍스트(OCR) 추출.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">3. 개인정보의 보유 및 이용 기간</h4>
                <p className="text-stone-600">
                  본 서비스는 자체 회원 DB 서버를 별도로 운영하지 않으며, 모든 독서 기록 데이터는 <strong>연동된 노션(Notion) 데이터베이스에 직접 안전하게 영구 저장·관리</strong>됩니다. 이용자가 웹앱 내 삭제 기능(휴지통 버튼 등)을 실행하거나 본인의 노션 페이지에서 삭제할 때까지 보관되며, 삭제 즉시 아카이브(파기) 처리됩니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">4. 제3자 제공 및 취급 위탁</h4>
                <p className="text-stone-600 mb-1">
                  북튜닝은 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 서비스 운영 및 AI 분석을 위해 아래의 신뢰할 수 있는 글로벌 전문 인프라 API를 활용합니다:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li>
                    <strong>Notion Labs, Inc. (Notion API)</strong>: 노션 데이터베이스와의 실시간 양방향 데이터 동기화 및 기록 보존.
                  </li>
                  <li>
                    <strong>Google LLC (Gemini API)</strong>: AI 독서 감상문 초안 및 사진 본문 OCR 추출 (구글 모델 학습에 이용되지 않는 전용 기업용 API 규격 준수).
                  </li>
                  <li>
                    <strong>LG AI Research (EXAONE API)</strong>: 한국어 특화 AI 감상문 초안 생성 지원.
                  </li>
                  <li>
                    <strong>Kakao Corp. & 국립중앙도서관</strong>: 도서 검색 시 입력된 도서명 및 ISBN을 바탕으로 표지 이미지와 총 페이지 수 서지정보 연동 (개인 식별정보 전송 없음).
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">5. 정보주체의 권리 및 행사 방법 (열람, 정정, 삭제)</h4>
                <p className="text-stone-600">
                  이용자는 정보주체로서 언제든지 자신의 독서 기록에 대해 열람, 정정, 삭제, 처리 정지를 요구할 수 있습니다. 웹앱 화면의 &apos;수정&apos;, &apos;삭제(🗑️)&apos; 기능을 이용하거나 연동된 노션 데이터베이스에서 100% 직접 즉시 제어할 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">6. 개인정보의 파기 절차 및 파기 방법</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li><strong>파기 절차</strong>: 이용자가 도서 상세 모달의 도서 삭제 또는 피드의 일지·문장 개별 삭제를 실행하면 노션 데이터베이스에서 즉시 영구 아카이브(삭제) 처리됩니다.</li>
                  <li><strong>파기 방법</strong>: 전자적 파일 형태로 기록된 데이터는 복구할 수 없는 기술적 방식으로 영구 삭제되며, 브라우저 로컬 데이터는 로그아웃이나 브라우저 캐시 삭제 시 즉시 소멸합니다.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">7. 아동 및 청소년 개인정보 보호</h4>
                <p className="text-stone-600">
                  본 앱은 학교, 학급 독서 활동 및 학생 등 아동·청소년이 안심하고 이용할 수 있도록 주민등록번호나 연락처 등 민감정보를 원천적으로 배제하고 설계되었습니다. 학교 현장이나 가정에서 활용 시 가명(활동 닉네임) 사용을 원칙으로 하며 안전한 독서 환경을 보장합니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">8. 개인정보의 기술적·관리적 안전성 확보 조치</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li><strong>서버 사이드 API 키 격리</strong>: 노션 통합 토큰 및 AI API 키는 Next.js 서버 백엔드(Route Handlers)에만 격리되어 브라우저 개발자도구에 일체 노출되지 않습니다.</li>
                  <li><strong>전송 구간 암호화 (HTTPS/TLS)</strong>: 웹 브라우저와 서버, 외부 공공/AI API 간의 모든 데이터 전송은 최신 TLS 암호화 프로토콜을 적용하여 도청과 변조를 방지합니다.</li>
                  <li><strong>소유권 분리 보안</strong>: 각 도서와 기록에 대해 작성자 닉네임과 PIN 검증을 거쳐 타인의 기록 훼손을 원천 차단합니다.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">9. 개인정보 보호책임자 및 고충처리</h4>
                <p className="text-stone-600">
                  북튜닝 서비스 기획 및 개인정보 보호 책임자:<br />
                  - <strong>기록조율사 서울외고 조용희</strong> (<a href="https://www.instagram.com/record_tuner/" target="_blank" rel="noreferrer" className="text-amber-800 underline font-semibold">@record_tuner</a>)<br />
                  - 문의 채널: 인스타그램 DM 또는 웹앱 푸터의 `문의` 링크를 통해 접수하며, 접수된 문의는 성실히 검토하여 신속하게 답변드립니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">10. 권익침해 구제방법</h4>
                <p className="text-stone-600 mb-1">기타 개인정보 침해에 대한 피해 구제 및 상담이 필요한 경우 아래 전문 기관에 문의하실 수 있습니다:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-stone-500 text-[11px]">
                  <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
                  <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                  <li>대검찰청 사이버수사과: (국번없이) 1301 (www.spo.go.kr)</li>
                  <li>경찰청 사이버수사국: (국번없이) 182 (ecrm.police.go.kr)</li>
                </ul>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500">
                <strong>시행일자</strong>: 2026년 11월 14일 (개정)<br />
                본 개인정보처리방침은 법령, 보안 정책 또는 웹앱 기능 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며, 개정 시 개발로그(버전 업데이트)를 통해 고지합니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 저작권 및 레퍼런스 안내 모달 */}
      {showCopyrightModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)} />
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="section-title-row">
              <div>
                <h2>⚖️ 저작권 및 레퍼런스 안내</h2>
                <p className="subtitle">기획 권리, 디자인 레퍼런스 및 외부 API 라이선스를 명시합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowCopyrightModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-950 text-xs mb-1">1. 원저작자 및 서비스 소유권 (Original Creator)</h4>
                <p>
                  본 웹앱의 서비스 기획, 화면 설계, 독서 주파수 조율 컨셉, 노션 데이터베이스 4종 연동 구조 및 AI 감상문 프롬프트에 관한 모든 권리는 <strong>&apos;기록조율사 서울외고 조용희&apos;</strong>(
                  <a
                    href="https://www.instagram.com/record_tuner/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-800 underline font-semibold"
                  >
                    @record_tuner
                  </a>
                  )에게 있습니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">2. UI/UX 디자인 및 인터랙션 레퍼런스</h4>
                <ul className="list-disc pl-4 space-y-1.5 text-stone-600">
                  <li>
                    <strong>첫 입장 화면 WebGL 셰이더 & 리퀴드 글래스 버튼</strong>: designali-in의 Three.js 기반 WebGLShader 파동 연출 및 LiquidGlassButton 컴포넌트를 기반으로 북튜닝 아틀리에 무드에 맞게 커스텀 이식했습니다.
                  </li>
                  <li>
                    <strong>macOS Dock 물결 확대(Fish-eye) 서재</strong>: Apple macOS Dock 인터랙션 메타포를 참고하여 서재 도서 호버 시 중심 도서와 인접 도서가 부드럽게 유기적으로 확대되는 인터랙션을 순수 CSS와 React로 구현했습니다.
                  </li>
                  <li>
                    <strong>Shadcn UI & 포스트잇 휠 캐러셀</strong>: shadcn/ui 및 Embla Carousel 카드 쇼케이스 패턴을 참고하여 외부 무거운 라이브러리 없이 가로 휠 스크롤 컴포넌트로 경량화하여 개발로그와 투어에 탑재했습니다.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">3. 오픈소스 소프트웨어 라이선스 (Open Source)</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                  <li><strong>Next.js (v14.2)</strong> - MIT License (© Vercel, Inc.)</li>
                  <li><strong>React & React DOM (v18.3)</strong> - MIT License (© Meta Platforms, Inc.)</li>
                  <li><strong>Three.js</strong> - MIT License (© mrdoob)</li>
                  <li><strong>Tailwind CSS (v3.4)</strong> - MIT License (© Tailwind Labs, Inc.)</li>
                  <li><strong>Notion SDK for JavaScript (@notionhq/client)</strong> - MIT License (© Notion Labs, Inc.)</li>
                  <li><strong>Lucide Icons Iconography</strong> - MIT License</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">4. 외부 API 서비스 이용약관 및 서비스 현황</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                  <li><strong>Notion API</strong>: Notion Labs, Inc. API Terms 준수 (공유 서재 4대 DB 양방향 실시간 동기화)</li>
                  <li><strong>Google Gemini API</strong>: Google APIs Terms of Service 준수 (멀티모달 1인칭 독서 감상문 및 사진 OCR)</li>
                  <li><strong>LG EXAONE API</strong>: LG AI Research 이용약관 준수 (K-EXAONE 2.5 한국어 특화 감상문 초안 생성)</li>
                  <li><strong>카카오 도서 검색 API & 국립중앙도서관 서지정보 Open API</strong>: Kakao Corp. 오픈API 및 국립중앙도서관 공공데이터 이용조건 준수 (표지·서지정보 및 쪽수 자동 추출 하이브리드 표준 연동)</li>
                  <li><strong>알라딘 도서 검색 Open API</strong>: (주)알라딘커뮤니케이션 TTB API (2026.10.30 서비스 공식 종료 고지)</li>
                  <li><strong>네이버 검색 API</strong>: NAVER Corp. 오픈API (2026.07.31 서비스 공식 종료 고지)</li>
                </ul>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500">
                💡 <strong>도서 서지 정보 및 표지 이미지 저작권</strong>
                <br />
                검색 및 서재에 노출되는 도서 표지, 도서 소개, 서지 데이터의 저작권은 해당 원저작자 및 출판사에 귀속되며, 본 서비스는 교육적·비영리 독서 기록 및 공정 이용(Fair Use) 범위 내에서만 해당 정보를 표시합니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
