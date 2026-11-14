'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Camera, ArrowRight, Settings, HelpCircle, UserCheck, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
import { WebGLShader } from '@/components/ui/web-gl-shader';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { User, UserRole } from '@/lib/types';

interface LandingGateProps {
  initialNickname?: string;
  initialPin?: string;
  onLoginSuccess: (user: User) => void;
  onBrowseGuest: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenCopyright: () => void;
}

type GateMode = 'login' | 'register';

export function LandingGate({
  initialNickname = '',
  initialPin = '',
  onLoginSuccess,
  onBrowseGuest,
  onOpenTutorial,
  onOpenSettings,
  onOpenPrivacy,
  onOpenCopyright,
}: LandingGateProps) {
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || '';

  // 1. 모드 상태: 'login'(로그인) vs 'register'(새 계정 만들기)
  const [mode, setMode] = useState<GateMode>('login');

  // 2. 역할 서브탭: 'student'(학생) vs 'teacher'(교사)
  const [role, setRole] = useState<UserRole>('student');

  // 3. 입력 필드 상태
  const [nameInput, setNameInput] = useState(initialNickname);
  const [pinInput, setPinInput] = useState(initialPin);
  const [studentNumInput, setStudentNumInput] = useState('');
  const [classCodeInput, setClassCodeInput] = useState('');
  const [teacherSecretInput, setTeacherSecretInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 학급 초대코드 입력 시 6자리 자동 포맷팅 (예: BT7821 입력 시 BT-7821로 자동 변환)
  const handleClassCodeChange = (val: string) => {
    const raw = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (raw.length <= 2) {
      setClassCodeInput(raw);
    } else if (raw.length <= 6) {
      setClassCodeInput(`${raw.slice(0, 2)}-${raw.slice(2)}`);
    } else {
      setClassCodeInput(`${raw.slice(0, 2)}-${raw.slice(2, 6)}`);
    }
  };

  useEffect(() => {
    setNameInput(initialNickname);
    setPinInput(initialPin);
  }, [initialNickname, initialPin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = nameInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanName) {
      setErrorMsg('이름을 입력해 주세요.');
      return;
    }
    if (!cleanPin || cleanPin.length < 4) {
      setErrorMsg('4자리 숫자 비밀번호(PIN)를 입력해 주세요.');
      return;
    }

    if (mode === 'register') {
      if (role === 'student') {
        if (!studentNumInput.trim()) {
          setErrorMsg('학번을 입력해 주세요 (예: 30215).');
          return;
        }
        if (!classCodeInput.trim()) {
          setErrorMsg('선생님께 받은 학급 인증코드(6자리)를 입력해 주세요.');
          return;
        }
      } else if (role === 'teacher') {
        if (!teacherSecretInput.trim()) {
          setErrorMsg('선생님 전용 교사 인증코드를 입력해 주세요.');
          return;
        }
      }
    } else if (mode === 'login') {
      if (role === 'student' && !studentNumInput.trim()) {
        setErrorMsg('학번을 입력해 주세요.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload: any = {
        role,
        name: cleanName,
        pin: cleanPin,
      };

      if (role === 'student') {
        payload.studentNumber = studentNumInput.trim();
        if (mode === 'register') {
          payload.classCode = classCodeInput.trim().toUpperCase();
        }
      } else if (role === 'teacher' && mode === 'register') {
        payload.teacherSecretCode = teacherSecretInput.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || '인증 처리에 실패했습니다. 다시 확인해 주세요.');
        return;
      }

      // 인증 성공
      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMsg('서버와 통신하는 도중 오류가 발생했습니다. 네트워크를 확인해 주세요.');
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
              {schoolName ? `${schoolName} 독서 서재` : '노션 공유 독서 아틀리에'} · v4.5.0
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
            <span>서재 환경 설정</span>
          </button>
        </div>
      </header>

      {/* 중앙 히어로 & 입장 프레임 */}
      <div className="relative z-10 w-full px-4 py-6 sm:py-8 flex items-center justify-center">
        <div className="relative border border-white/20 p-2 w-full mx-auto max-w-2xl rounded-2xl bg-black/30 backdrop-blur-sm shadow-2xl">
          <main className="relative border border-white/15 rounded-xl px-4 py-6 sm:px-8 sm:py-8 overflow-hidden bg-black/40">
            {/* 상단 타이틀 */}
            <h1 className="mb-2 text-white text-center text-3xl sm:text-5xl font-extrabold tracking-tighter leading-tight">
              Tuning Your Life
            </h1>
            <p className="text-white/80 text-center text-xs sm:text-sm font-medium mb-5">
              {schoolName ? `${schoolName} ` : ''}독서로 생각의 주파수를 맞춰가는 공간
            </p>

            {/* 1. 상단 2대 모드 탭 스위처: [로그인] ↔ [새 계정 만들기] */}
            <div className="max-w-md mx-auto mb-4 p-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>로그인</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  mode === 'register'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>새 계정 만들기</span>
              </button>
            </div>

            {/* 2. 학생 / 교사 역할 서브탭 스위처 */}
            <div className="max-w-md mx-auto mb-5 flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setErrorMsg('');
                }}
                className={`px-4 py-2 rounded-full border transition flex items-center gap-1.5 font-bold cursor-pointer ${
                  role === 'student'
                    ? '!bg-sky-500/30 !border-sky-400 !text-sky-100 shadow-md ring-1 ring-sky-400/40'
                    : '!bg-white/5 !border-white/20 !text-white/70 hover:!text-white'
                }`}
              >
                <UserCheck className="w-4 h-4 text-sky-300" />
                <span>🧑‍🎓 학생 {mode === 'register' ? '가입' : '입장'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('teacher');
                  setErrorMsg('');
                }}
                className={`px-4 py-2 rounded-full border transition flex items-center gap-1.5 font-bold cursor-pointer ${
                  role === 'teacher'
                    ? '!bg-amber-500/30 !border-amber-400 !text-amber-100 shadow-md ring-1 ring-amber-400/40'
                    : '!bg-white/5 !border-white/20 !text-white/70 hover:!text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>👩‍🏫 교사 {mode === 'register' ? '가입' : '입장'}</span>
              </button>
            </div>

            {/* 3. 로그인 / 가입 폼 카드 */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="rounded-2xl bg-[#fdfbf7] text-[#221d18] p-5 shadow-2xl border border-[#e8ded2]">
                {/* 에러 메시지 배너 */}
                {errorMsg && (
                  <div className="mb-3.5 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-semibold leading-relaxed">
                    🚨 {errorMsg}
                  </div>
                )}

                {/* 모드별 안내 캡션 */}
                <div className="mb-3 text-xs text-stone-500 border-b border-stone-200 pb-2">
                  {mode === 'login' ? (
                    role === 'student' ? (
                      <span>📌 <strong>학번</strong>과 <strong>이름</strong>, <strong>4자리 PIN</strong>으로 로그인합니다.</span>
                    ) : (
                      <span>📌 선생님의 <strong>이름</strong>과 <strong>비밀번호(PIN)</strong>로 로그인합니다.</span>
                    )
                  ) : role === 'student' ? (
                    <span>✨ 선생님께 안내받은 <strong>학급 코드</strong>와 <strong>학번</strong>을 입력해 주세요.</span>
                  ) : (
                    <span>🔐 선생님 전용 <strong>교사 인증코드</strong>를 입력해 주세요.</span>
                  )}
                </div>

                <div className="space-y-3 text-left">
                  {/* [학생 가입 시] 학급 인증코드 입력란 */}
                  {mode === 'register' && role === 'student' && (
                    <label className="block text-xs font-bold text-stone-700">
                      학급 인증코드 (6자리) <span className="text-red-500">*</span>
                      <input
                        type="text"
                        placeholder="예: BT-7821 (하이픈 자동 완성)"
                        value={classCodeInput}
                        onChange={(e) => handleClassCodeChange(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 font-mono tracking-wider focus:border-emerald-600 focus:outline-none"
                        required
                      />
                    </label>
                  )}

                  {/* [교사 가입 시] 교사 인증코드 입력란 */}
                  {mode === 'register' && role === 'teacher' && (
                    <label className="block text-xs font-bold text-stone-700">
                      교사 마스터 인증코드 <span className="text-red-500">*</span>
                      <input
                        type="password"
                        placeholder="선생님들 간 공유된 인증키 입력"
                        value={teacherSecretInput}
                        onChange={(e) => setTeacherSecretInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
                        required
                      />
                    </label>
                  )}

                  {/* [학생 공통] 학번 입력란 (가입 & 로그인) */}
                  {role === 'student' && (
                    <label className="block text-xs font-bold text-stone-700">
                      학번 <span className="text-red-500">*</span>
                      <input
                        type="text"
                        placeholder="예: 30215 (숫자 5자리)"
                        value={studentNumInput}
                        onChange={(e) => setStudentNumInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none"
                        required
                      />
                    </label>
                  )}

                  {/* 이름 입력란 */}
                  <label className="block text-xs font-bold text-stone-700">
                    이름 <span className="text-red-500">*</span>
                    <input
                      type="text"
                      placeholder={role === 'student' ? '학생 이름 입력' : '선생님 성함 입력'}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none"
                      required
                    />
                  </label>

                  {/* 4자리 PIN 비밀번호 */}
                  <label className="block text-xs font-bold text-stone-700">
                    비밀번호 (4자리 PIN) <span className="text-red-500">*</span>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="숫자 4자리"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 tracking-widest placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none"
                      required
                    />
                  </label>
                </div>

                {/* 제출 버튼: 명확한 고대비 딥 에메랄드 / 포레스트 그린 버튼 */}
                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full justify-center !py-3.5 !px-5 text-sm font-bold shadow-lg rounded-xl flex items-center gap-2 cursor-pointer transition active:scale-[0.99] border-0 !bg-[#1b4332] hover:!bg-[#2d6a4f] !text-white"
                  >
                    <span>
                      {submitting
                        ? '확인 중...'
                        : mode === 'register'
                        ? (role === 'student' ? '🧑‍🎓 우리 반 서재 참여하기' : '👩‍🏫 교사 등록 및 입장')
                        : '📖 서재로 들어가기'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </div>

                {/* 게스트 둘러보기 버튼: 파란 박스 제거, 깔끔한 스톤 버튼 */}
                <div className="mt-3.5 text-center">
                  <button
                    type="button"
                    onClick={onBrowseGuest}
                    className="w-full !bg-stone-100 hover:!bg-stone-200 !text-stone-700 hover:!text-stone-900 border !border-stone-300 font-bold text-xs !py-2.5 !px-4 rounded-xl transition inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>👀 로그인 없이 둘러보기 (게스트 모드)</span>
                  </button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>

      {/* 하단 푸터 바: 기록조율사 표기 복원 & 정돈된 링크 배치 */}
      <footer className="relative z-10 w-full py-5 px-4 text-center text-xs text-white/75 border-t border-white/10 flex flex-col items-center justify-center gap-2">
        <div className="font-medium text-white/80">
          © {new Date().getFullYear()} {schoolName || '북튜닝'}. All rights reserved.
        </div>
        <div className="text-[11px] text-white/60 font-normal">
          만든이. 기록조율사 서울외고 조용희 @record_tuner
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="!bg-transparent !p-0 !text-white/70 hover:!text-white underline text-xs cursor-pointer border-0"
          >
            개인정보처리방침
          </button>
          <span className="text-white/30">·</span>
          <button
            type="button"
            onClick={onOpenCopyright}
            className="!bg-transparent !p-0 !text-white/70 hover:!text-white underline text-xs cursor-pointer border-0"
          >
            저작권 및 레퍼런스 안내
          </button>
        </div>
      </footer>
    </div>
  );
}
