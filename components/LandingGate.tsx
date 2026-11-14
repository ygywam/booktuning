'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Camera, ArrowRight, Settings, HelpCircle } from 'lucide-react';
import { WebGLShader } from '@/components/ui/web-gl-shader';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface LandingGateProps {
  initialNickname?: string;
  initialPin?: string;
  onEnterWithProfile: (nickname: string, pin: string) => Promise<boolean>;
  onBrowseGuest: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenCopyright: () => void;
}

/**
 * WebGLShader 파동 배경 기반 'Tuning Your Life' 입장 화면
 */
export function LandingGate({
  initialNickname = '',
  initialPin = '',
  onEnterWithProfile,
  onBrowseGuest,
  onOpenTutorial,
  onOpenSettings,
  onOpenPrivacy,
  onOpenCopyright,
}: LandingGateProps) {
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || '';
  const [nickInput, setNickInput] = useState(initialNickname);
  const [pinInput, setPinInput] = useState(initialPin);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNickInput(initialNickname);
    setPinInput(initialPin);
  }, [initialNickname, initialPin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickInput.trim()) {
      alert('활동할 닉네임을 입력해 주세요.');
      return;
    }
    if (!pinInput.trim() || pinInput.trim().length < 4) {
      alert('본인 확인용 4자리 숫자 비밀번호(PIN)를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await onEnterWithProfile(nickInput.trim(), pinInput.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-black text-white">
      {/* Three.js 파동 셰이더 배경 */}
      <WebGLShader />

      {/* 텍스트 가독성을 위한 은은한 비네팅 오버레이 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75"
      />

      {/* 상단 유틸 바 */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/icon.svg"
            alt="북튜닝 로고"
            className="w-8 h-8 rounded-lg shadow-md border border-white/20"
          />
          <div className="flex flex-col">
            <span className="text-xs font-extrabold tracking-widest uppercase text-white/90">
              {schoolName ? `${schoolName} BOOK TUNING` : 'BOOK TUNING'}
            </span>
            <span className="text-[11px] text-white/55">
              {schoolName ? `${schoolName} 노션 독서 서재` : '노션 공유 독서 아틀리에'} · v4.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-slot="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/20"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>사용법</span>
          </button>
          <button
            type="button"
            data-slot="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/20"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>AI · 검색 설정</span>
          </button>
        </div>
      </header>

      {/* 중앙 히어로 & 입장 카드 프레임 */}
      <div className="relative z-10 w-full px-4 py-8 flex items-center justify-center">
        <div className="relative border border-white/20 p-2 w-full mx-auto max-w-3xl rounded-2xl bg-black/30 backdrop-blur-sm shadow-2xl">
          <main className="relative border border-white/15 rounded-xl px-4 py-8 sm:px-8 sm:py-10 overflow-hidden bg-black/35">
            {/* 라이브 동기화 상태 표시 */}
            <div className="mb-4 flex items-center justify-center gap-2 text-center">
              <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-emerald-400">
                노션 실시간 동기화 · 누구나 닉네임으로 참여하는 공유 서재
              </p>
            </div>

            {/* 메인 슬로건 (요청 문구: Tuning Your Life) */}
            <h1 className="mb-3 text-white text-center text-4xl sm:text-6xl md:text-[clamp(3rem,6.5vw,4.75rem)] font-extrabold tracking-tighter leading-[1.06]">
              Tuning Your Life
            </h1>

            {/* 서브 카피 (의미 있는 독서로 삶을 기록하세요) */}
            <p className="text-white/90 px-2 text-center text-base sm:text-lg font-semibold">
              의미 있는 독서로 삶을 기록하세요
            </p>
            <p className="text-white/65 px-2 mt-2 text-center text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              문장과 독서 진도를 차곡차곡 남기는 공유 서재 공간입니다.{' '}
              <br className="hidden sm:inline" />
              회원가입 절차 없이 닉네임과 4자리 PIN으로 노션 서재가 즉시 생성·연결됩니다.
            </p>

            {/* 핵심 기능 필 배지 */}
            <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-white/85">
                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                실시간 노션 공유 서재
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-white/85">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300" />
                Gemini · EXAONE AI 감상문
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-white/85">
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
                페이지 사진 OCR
              </span>
            </div>

            {/* 닉네임 & 4자리 PIN 입장 폼 (고대비 밝은 크림 카드 + 리퀴드 글래스 입장 버튼) */}
            <form onSubmit={handleSubmit} className="mt-7 max-w-md mx-auto">
              <div className="rounded-2xl bg-[#fdfbf7]/95 text-[#221d18] p-5 shadow-xl border border-[#e8ded2]">
                {initialNickname && (
                  <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 font-medium">
                    최근 접속 프로필(<strong>{initialNickname}</strong>)이 불러와졌습니다. 바로 입장하거나 다른 닉네임으로 전환할 수 있습니다.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <label className="block text-xs font-bold text-[#4a4036]">
                    활동할 닉네임
                    <input
                      type="text"
                      placeholder="예: 책벌레 (2~10자)"
                      value={nickInput}
                      onChange={(e) => setNickInput(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#d8cbbd] bg-white px-3.5 py-2.5 text-sm text-[#221d18] placeholder:text-[#9c9083] focus:border-[#965327] focus:outline-none"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-[#4a4036]">
                    4자리 PIN (동명이인 구분)
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="숫자 4자리"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#d8cbbd] bg-white px-3.5 py-2.5 text-sm text-[#221d18] placeholder:text-[#9c9083] focus:border-[#965327] focus:outline-none"
                      required
                    />
                  </label>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-[#6c5f53]">
                  ※ 처음 쓰는 닉네임이면 노션 사용자 DB에 새 계정이 자동 등록되며, 기존 닉네임은 입력한 PIN으로 본인 확인 후 입장합니다.
                </p>
              </div>

              {/* LiquidButton 메인 CTA */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <LiquidButton
                  type="submit"
                  size="xl"
                  disabled={submitting}
                  className="text-white border border-white/40 rounded-full px-10 font-bold text-base shadow-lg"
                >
                  <span>{submitting ? '서재 연결 중...' : '서재 입장하기'}</span>
                  <ArrowRight className="w-4 h-4" />
                </LiquidButton>

                <button
                  type="button"
                  data-slot="button"
                  onClick={onBrowseGuest}
                  className="bg-transparent text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline py-1 px-2"
                >
                  계정 입력 없이 커뮤니티 서재 먼저 둘러보기 →
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      {/* 하단 운영 & 약관 푸터 */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-6 pt-2 text-center text-xs text-white/60 space-y-1.5">
        <p>
          운영: <strong className="text-white/85">조용희</strong>(서울외고, 활동명: 기록조율사 ·{' '}
          <a
            href="https://www.instagram.com/record_tuner/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 hover:underline"
          >
            @record_tuner
          </a>
          )
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px]">
          <button
            type="button"
            data-slot="button"
            onClick={onOpenPrivacy}
            className="bg-transparent p-0 text-white/60 hover:text-white underline-offset-2 hover:underline font-normal"
          >
            개인정보처리방침
          </button>
          <span className="text-white/25">|</span>
          <button
            type="button"
            data-slot="button"
            onClick={onOpenCopyright}
            className="bg-transparent p-0 text-white/60 hover:text-white underline-offset-2 hover:underline font-normal"
          >
            저작권 및 이용 안내
          </button>
        </div>
      </footer>
    </div>
  );
}
