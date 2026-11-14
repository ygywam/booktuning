import { NextResponse } from 'next/server';
import { notion, USER_DB_ID } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId || !USER_DB_ID) {
      return NextResponse.json({ ok: true, students: [] });
    }

    const queryRes = await notion.databases.query({
      database_id: USER_DB_ID,
      filter: {
        property: '소속학급',
        relation: {
          contains: classId,
        },
      },
    });

    const students = queryRes.results.map((page: any) => {
      const props = page.properties;
      const rawNick = props['닉네임']?.title?.[0]?.plain_text || '이름 없음';
      const studentNum = props['학번']?.rich_text?.[0]?.plain_text || '';
      const pin = props['PIN']?.rich_text?.[0]?.plain_text || '****';
      const role = props['역할']?.select?.name || 'student';
      const joinedAt = props['가입일']?.date?.start || page.created_time?.split('T')[0] || '';

      // 닉네임에서 (학번) 부분 파싱
      let cleanName = rawNick;
      if (cleanName.includes('(')) {
        cleanName = cleanName.split('(')[0].trim();
      }

      return {
        id: page.id,
        name: cleanName,
        studentNumber: studentNum,
        rawNick,
        role,
        pin,
        joinedAt,
      };
    }).filter((s) => s.role !== 'teacher'); // 학생만 목록에 노출

    return NextResponse.json({ ok: true, students });
  } catch (error: any) {
    console.error('학급 학생 목록 조회 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
