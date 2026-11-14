import { NextResponse } from 'next/server';
import { notion, CLASS_DB_ID, USER_DB_ID } from '@/lib/notion';

export const dynamic = 'force-dynamic';

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BT-${rand}`;
}

// 1. 학급 목록 조회 (교사 전용)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!CLASS_DB_ID) {
      return NextResponse.json({
        ok: true,
        classes: [
          {
            id: 'mock-class-1',
            name: '1학년 3반 독서동아리',
            code: 'BT-3021',
            teacherId: teacherId || '',
            studentCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
          },
        ],
      });
    }

    let filterOption: any = undefined;
    if (teacherId) {
      filterOption = {
        property: '담당교사',
        relation: {
          contains: teacherId,
        },
      };
    }

    const queryRes = await notion.databases.query({
      database_id: CLASS_DB_ID,
      ...(filterOption ? { filter: filterOption } : {}),
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
    });

    const classes = queryRes.results.map((page: any) => {
      const props = page.properties;
      const name = props['학급명']?.title?.[0]?.plain_text || '이름 없는 학급';
      const code = props['초대코드']?.rich_text?.[0]?.plain_text || '';
      const teacherRel = props['담당교사']?.relation || [];
      const studentRel = props['소속학생']?.relation || [];
      const createdDate = props['개설일']?.date?.start || page.created_time?.split('T')[0] || '';

      return {
        id: page.id,
        name,
        code,
        teacherId: teacherRel[0]?.id || '',
        studentCount: studentRel.length,
        createdAt: createdDate,
      };
    });

    return NextResponse.json({ ok: true, classes });
  } catch (error: any) {
    console.error('학급 목록 조회 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. 새 학급 개설 (교사 전용)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, teacherId } = body;

    const cleanName = String(name || '').trim();
    if (!cleanName) {
      return NextResponse.json({ ok: false, error: '개설할 학급 이름을 입력해 주세요.' }, { status: 400 });
    }

    if (!CLASS_DB_ID) {
      const mockCode = generateClassCode();
      return NextResponse.json({
        ok: true,
        classroom: {
          id: `class_${Date.now()}`,
          name: cleanName,
          code: mockCode,
          teacherId: teacherId || '',
          studentCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        },
        message: '학급 DB ID가 설정되지 않아 모의 생성되었습니다.',
      });
    }

    // 중복 없는 6자리 난수 초대코드 생성
    let uniqueCode = '';
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateClassCode();
      const existing = await notion.databases.query({
        database_id: CLASS_DB_ID,
        filter: {
          property: '초대코드',
          rich_text: { equals: candidate },
        },
        page_size: 1,
      });
      if (existing.results.length === 0) {
        uniqueCode = candidate;
        break;
      }
    }
    if (!uniqueCode) uniqueCode = generateClassCode();

    const today = new Date().toISOString().split('T')[0];
    const properties: any = {
      '학급명': { title: [{ text: { content: cleanName } }] },
      '초대코드': { rich_text: [{ text: { content: uniqueCode } }] },
      '개설일': { date: { start: today } },
    };

    if (teacherId) {
      properties['담당교사'] = { relation: [{ id: teacherId }] };
    }

    const newClassPage = await notion.pages.create({
      parent: { database_id: CLASS_DB_ID },
      properties,
    });

    // 개설 교사의 사용자 페이지에도 소속학급 연결 (선택적)
    if (teacherId && USER_DB_ID) {
      try {
        await notion.pages.update({
          page_id: teacherId,
          properties: {
            '소속학급': { relation: [{ id: newClassPage.id }] },
          },
        });
      } catch (err: any) {
        console.warn('교사 페이지에 학급 연결 실패 (무시 가능):', err.message);
      }
    }

    return NextResponse.json({
      ok: true,
      classroom: {
        id: newClassPage.id,
        name: cleanName,
        code: uniqueCode,
        teacherId: teacherId || '',
        studentCount: 0,
        createdAt: today,
      },
    });
  } catch (error: any) {
    console.error('학급 개설 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
