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

      {/* 3. 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)} />
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-title-row">
              <div>
                <h2>🛡️ 개인정보처리방침</h2>
                <p className="subtitle">북튜닝 공유서재의 개인정보 보호 및 처리 방침입니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowPrivacyModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p>
                <strong>1. 수집 항목 및 방법</strong>
                <br />
                본 공유 서재는 최소한의 식별 정보인 &apos;활동 닉네임&apos;, 동명이인 구분을 위한 &apos;4자리 PIN&apos;, 그리고 사용자가 직접 등록하는 &apos;독서 기록(진도율, 감상록, 문장수집 메모)&apos;만을 처리합니다. 실명 대신 가명(닉네임) 사용을 원칙으로 합니다.
              </p>
              <p>
                <strong>2. 수집 및 이용 목적</strong>
                <br />
                수집된 정보는 공유 서재 내 본인 기록 관리, 구성원 간의 독서 진도 공유 및 Gemini / EXAONE AI를 통한 맞춤형 1인칭 독서 감상문 초안 생성을 위해서만 활용됩니다.
              </p>
              <p>
                <strong>3. 보유 및 파기</strong>
                <br />
                사용자의 독서 데이터는 모임 운영 기간 또는 노션 데이터베이스 삭제 시까지 보관되며, 사용자가 앱 내에서 기록을 삭제할 경우 노션 데이터베이스에서도 즉시 파기됩니다.
              </p>
              <p>
                <strong>4. 외부 API 처리 위탁</strong>
                <br />
                독서 기록의 영구 저장을 위해 &apos;Notion API&apos;로 전송되며, AI 감상문 및 사진 OCR 기능을 이용할 때 선택에 따라 &apos;Google Gemini API&apos; 또는 &apos;LG EXAONE API&apos;에 프롬프트가 전송됩니다. 해당 서비스 제공업체는 명시된 목적 외에 데이터를 보관하거나 훈련에 활용하지 않습니다.
              </p>
              <p>
                <strong>5. 이용자의 권리</strong>
                <br />
                사용자는 언제든지 자신의 도서, 일지, 문장수집을 열람·수정·삭제할 수 있으며, 로그아웃 기능을 통해 접속 세션을 브라우저에서 완전히 소멸시킬 수 있습니다.
              </p>
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
