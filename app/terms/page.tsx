import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 이용약관 - 북튜닝 (Book Tuning)',
  description: '북튜닝 독서 기록 웹앱의 서비스 이용약관 안내입니다.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || '';
  const serviceName = schoolName ? `${schoolName} 북튜닝` : '북튜닝 (Book Tuning)';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-10">
        {/* 상단 네비게이션 */}
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-stone-200">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>서재 홈으로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>{serviceName}</span>
          </div>
        </div>

        {/* 타이틀 */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            서비스 이용약관
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {serviceName} 서비스 이용약관
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600">
            본 약관은 {serviceName}(이하 &apos;서비스&apos;)의 이용 조건 및 절차, 이용자와 서비스 제공자의 권리·의무 및 책임사항을 규정합니다.
          </p>
        </div>

        {/* 본문 약관 조항 */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제1조 (목적)</h2>
            <p>
              본 약관은 이용자가 {serviceName}가 제공하는 노션(Notion) 데이터베이스 기반 실시간 독서 기록, 서재 열람, 진도 일지 및 문장 수집 등의 웹 기반 서비스를 이용함에 있어 필요한 기본 사항을 정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제2조 (용어의 정의)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong>&apos;서비스&apos;</strong>라 함은 노션 데이터베이스와 연동되어 독서 진도 기록, 문장 수집, 도서 검색, 학급 서재 공유 기능을 제공하는 웹 애플리케이션을 의미합니다.</li>
              <li><strong>&apos;이용자&apos;</strong>라 함은 본 약관에 따라 서비스를 이용하는 교사, 학생 및 일반 독서자를 의미합니다.</li>
              <li><strong>&apos;활동 닉네임 및 PIN&apos;</strong>이라 함은 회원가입 없이 이용자를 식별하고 본인 도서의 수정·삭제 권한을 인증하기 위해 설정하는 닉네임과 4자리 비밀번호를 의미합니다.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제3조 (약관의 효력 및 변경)</h2>
            <p>
              본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경된 약관은 웹앱 공지 또는 개발로그를 통해 고지합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제4조 (서비스의 제공 및 학교별 자율 배포)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스는 연중무휴 1일 24시간 제공을 원칙으로 하되, 노션 API 및 호스팅 플랫폼(Vercel 등)의 정기 점검 또는 장애 발생 시 일시적으로 중단될 수 있습니다.</li>
              <li>본 서비스는 오픈소스 소프트웨어로서 전국의 초·중·고등학교 및 교육 기관에서 학교 단위로 자유롭게 복제(Fork)하여 학교 전용 도메인으로 자율 배포 및 운영할 수 있습니다.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제5조 (이용자의 의무 및 계정 보호)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>이용자는 본인의 활동 닉네임과 4자리 PIN을 안전하게 관리해야 하며, 제3자에게 양도하거나 대여할 수 없습니다.</li>
              <li>이용자는 타인의 명의를 도용하거나 타인의 독서 기록을 무단으로 변경·삭제해서는 안 됩니다.</li>
              <li>타인에게 불쾌감을 주는 비방, 욕설, 유해 콘텐츠를 독서 일지나 문장 수집에 등록하는 행위는 엄격히 금지됩니다.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제6조 (저작권의 귀속 및 권리 보호)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스의 전체 기획, 설계, UI/UX 구조 및 연동 컨셉에 관한 권리는 원저작자(기록조율사 서울외고 조용희 @record_tuner)에게 있습니다.</li>
              <li>이용자가 작성한 독서일지, 문장수집, 독서 감상문의 저작권은 해당 작성자 본인에게 귀속되며 연동된 노션 데이터베이스에 안전하게 보관됩니다.</li>
              <li>검색 및 화면에 표출되는 도서 표지, 서지 정보의 저작권은 해당 출판사 및 저작권자에게 있으며, 교육적 공정 이용(Fair Use) 범위 내에서만 인용 및 표시됩니다.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제7조 (개인정보 및 독서 기록의 보호)</h2>
            <p>
              서비스는 주민등록번호, 연락처 등 민감한 개인 식별정보를 일절 수집하지 않으며, 가명(활동 닉네임) 체계를 기반으로 안전하게 운영됩니다. 자세한 사항은 별도의 <Link href="/" className="underline font-semibold text-amber-800">개인정보처리방침</Link>을 따릅니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제8조 (면책 조항)</h2>
            <p>
              서비스는 노션 API, 외부 도서 검색 API, AI 비전 OCR API의 일시적 장애나 서비스 종료로 인해 발생하는 부수적 손해에 대해 책임을 지지 않습니다. 또한 이용자가 본인의 PIN을 분실하여 발생하는 기록 접근 제한에 대해 고의 또는 중과실이 없는 한 책임을 부담하지 않습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">제9조 (문의처)</h2>
            <p>
              서비스 이용에 관한 문의, 제안 및 권리 침해 신고는 기획자 인스타그램(<a href="https://www.instagram.com/record_tuner/" target="_blank" rel="noreferrer" className="underline font-semibold text-amber-800">@record_tuner</a>) 또는 웹앱 내 문의 창구를 통해 접수하실 수 있습니다.
            </p>
          </section>
        </div>

        {/* 부칙 */}
        <div className="mt-8 pt-6 border-t border-stone-200 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>공고일자: 2026년 11월 18일 · 시행일자: 2026년 11월 18일</span>
          <Link href="/" className="text-amber-800 hover:underline font-semibold">
            홈으로 이동 ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
