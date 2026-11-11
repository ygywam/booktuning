import { NextResponse } from 'next/server';
import { getAiStatusSummary } from '../../../lib/ai';

export const dynamic = 'force-dynamic';

// 서버 환경변수 내 AI API 키 연결 여부만 안전하게 반환 (실제 키 값 비노출)
export async function GET() {
  return NextResponse.json({
    ok: true,
    ...getAiStatusSummary(),
  });
}
