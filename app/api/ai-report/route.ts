import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: false,
    error: 'AI 감상문 기능이 비활성화되었습니다. [나의 감상문] 탭에서 직접 작성해 주세요.',
  });
}
