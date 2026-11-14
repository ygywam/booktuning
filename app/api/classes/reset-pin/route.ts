import { NextResponse } from 'next/server';
import { notion, USER_DB_ID } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, newPin = '0000' } = body;

    if (!studentId) {
      return NextResponse.json({ ok: false, error: '학생 ID가 누락되었습니다.' }, { status: 400 });
    }

    if (!USER_DB_ID) {
      return NextResponse.json({
        ok: true,
        message: '개발 모드: 학생 비밀번호가 0000으로 초기화되었습니다.',
      });
    }

    // 학생 페이지 PIN 업데이트
    await notion.pages.update({
      page_id: studentId,
      properties: {
        'PIN': { rich_text: [{ text: { content: String(newPin).trim() } }] },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `학생 비밀번호(PIN)가 '${newPin}'으로 성공적으로 초기화되었습니다. 학생에게 안내해 주세요!`,
    });
  } catch (error: any) {
    console.error('학생 PIN 초기화 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
