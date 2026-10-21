import { NextResponse } from 'next/server';
import { notion, USER_DB_ID } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

// 1. 사용자 로그인 / 자동 등록 (POST)
export async function POST(request: Request) {
  try {
    const { nickname, pin } = await request.json();

    const cleanNick = String(nickname || '').trim();
    const cleanPin = String(pin || '').trim();

    if (!cleanNick) {
      return NextResponse.json({ ok: false, error: '닉네임을 입력해 주세요.' }, { status: 400 });
    }

    // 만약 USER_DB_ID가 아직 설정되지 않은 경우 (단순 닉네임 모드로 동작)
    if (!USER_DB_ID) {
      return NextResponse.json({
        ok: true,
        mode: 'legacy',
        user: {
          id: 'legacy-user',
          nickname: cleanNick,
          pin: cleanPin || '0000',
        },
        message: '사용자 DB ID가 아직 설정되지 않아 로컬 닉네임 모드로 동작합니다.',
      });
    }

    // 노션 사용자 DB에서 닉네임으로 조회
    const queryRes = await notion.databases.query({
      database_id: USER_DB_ID,
      filter: {
        property: '닉네임',
        title: {
          equals: cleanNick,
        },
      },
    });

    // 1) 이미 존재하는 사용자인 경우
    if (queryRes.results.length > 0) {
      const page: any = queryRes.results[0];
      const props = page.properties;
      const storedPin = props['PIN']?.rich_text[0]?.plain_text || '';

      // PIN 검증 (기존에 PIN이 등록되어 있을 경우 확인)
      if (storedPin && cleanPin && storedPin !== cleanPin) {
        return NextResponse.json({
          ok: false,
          error: '입력하신 비밀번호(PIN)가 일치하지 않습니다. 다시 확인해 주세요.',
        }, { status: 401 });
      }

      // PIN이 없던 기존 사용자라면 이번에 입력한 PIN으로 업데이트
      if (!storedPin && cleanPin) {
        await notion.pages.update({
          page_id: page.id,
          properties: {
            'PIN': { rich_text: [{ text: { content: cleanPin } }] },
          },
        });
      }

      return NextResponse.json({
        ok: true,
        mode: 'login',
        user: {
          id: page.id,
          nickname: cleanNick,
          pin: cleanPin || storedPin,
        },
      });
    }

    // 2) 신규 사용자 등록 (노션 페이지 생성)
    const newPage = await notion.pages.create({
      parent: { database_id: USER_DB_ID },
      properties: {
        '닉네임': { title: [{ text: { content: cleanNick } }] },
        'PIN': { rich_text: [{ text: { content: cleanPin || '0000' } }] },
      },
    });

    return NextResponse.json({
      ok: true,
      mode: 'register',
      user: {
        id: newPage.id,
        nickname: cleanNick,
        pin: cleanPin || '0000',
      },
    });
  } catch (error: any) {
    console.error('사용자 인증/등록 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. 전체 사용자 목록 조회 (GET)
export async function GET() {
  try {
    if (!USER_DB_ID) {
      return NextResponse.json({ ok: true, users: [] });
    }

    const response = await notion.databases.query({
      database_id: USER_DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    });

    const users = response.results.map((page: any) => ({
      id: page.id,
      nickname: page.properties['닉네임']?.title[0]?.plain_text || '익명',
      pin: page.properties['PIN']?.rich_text[0]?.plain_text || '',
    }));

    return NextResponse.json({ ok: true, users });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
