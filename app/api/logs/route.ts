import { NextResponse } from 'next/server';
import { notion, LOG_DB_ID, findUserIdByNickname } from '../../../lib/notion';

// 1. 독서일지 등록 (POST)
export async function POST(request: Request) {
  try {
    const { bookNotionPageId, readDate, readPages, note, nickname, userId } = await request.json();

    if (!LOG_DB_ID || !bookNotionPageId) {
      return NextResponse.json({ ok: false, error: '필수 설정값(LOG_DB_ID 또는 책 ID)이 부족합니다.' }, { status: 400 });
    }

    // 보안 검증: 본인이 등록한 도서에만 진도 기록 가능
    try {
      const bookPage: any = await notion.pages.retrieve({ page_id: bookNotionPageId });
      const bookOwner = bookPage.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (bookOwner && nickname && bookOwner.trim() !== nickname.trim()) {
        return NextResponse.json({
          ok: false,
          error: `본인이 등록한 도서에만 진도를 기록할 수 있습니다. (도서 등록자: ${bookOwner})`,
        }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('도서 소유자 확인 오류:', e.message);
    }

    const payload: any = {
      parent: { database_id: LOG_DB_ID },
      properties: {
        '읽은 날짜': { title: [{ text: { content: readDate } }] },
        '관련 책': { relation: [{ id: bookNotionPageId }] },
        '이번에 읽은 페이지(숫자)': { number: Number(readPages) || 0 },
        '독서 감상록': { rich_text: [{ text: { content: (note || '').substring(0, 1999) } }] },
      },
    };

    if (nickname) {
      payload.properties['기록자'] = { rich_text: [{ text: { content: nickname } }] };
    }

    // 사용자 DB relation 연결: userId가 없으면 nickname으로 자동 조회
    let targetUserId = userId;
    if (!targetUserId && nickname) {
      targetUserId = await findUserIdByNickname(nickname);
    }

    if (targetUserId) {
      payload.properties['[북튜닝] 사용자 DB'] = { relation: [{ id: targetUserId }] };
    }

    let response;
    try {
      response = await notion.pages.create(payload);
    } catch (createErr: any) {
      // '[북튜닝] 사용자 DB' 속성명이 아닌 '사용자' 속성명일 경우 폴백
      if (payload.properties['[북튜닝] 사용자 DB']) {
        delete payload.properties['[북튜닝] 사용자 DB'];
        payload.properties['사용자'] = { relation: [{ id: targetUserId }] };
        try {
          response = await notion.pages.create(payload);
        } catch (e) {
          delete payload.properties['사용자'];
          response = await notion.pages.create(payload);
        }
      } else {
        throw createErr;
      }
    }

    return NextResponse.json({ ok: true, logId: response.id });
  } catch (error: any) {
    console.error('진도 기록 저장 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. 독서일지 수정 (PUT)
export async function PUT(request: Request) {
  try {
    const { logId, nickname, readDate, readPages, note } = await request.json();

    if (!logId) {
      return NextResponse.json({ ok: false, error: '수정할 logId가 필요합니다.' }, { status: 400 });
    }

    // 소유자 검증
    try {
      const existingLog: any = await notion.pages.retrieve({ page_id: logId });
      const logOwner = existingLog.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (logOwner && nickname && logOwner.trim() !== nickname.trim()) {
        return NextResponse.json({ ok: false, error: '본인이 작성한 진도 기록만 수정할 수 있습니다.' }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('일지 소유자 확인 오류:', e.message);
    }

    const properties: any = {};
    if (readDate !== undefined) properties['읽은 날짜'] = { title: [{ text: { content: readDate } }] };
    if (readPages !== undefined) properties['이번에 읽은 페이지(숫자)'] = { number: Number(readPages) || 0 };
    if (note !== undefined) properties['독서 감상록'] = { rich_text: [{ text: { content: String(note).substring(0, 1999) } }] };

    await notion.pages.update({
      page_id: logId,
      properties,
    });

    return NextResponse.json({ ok: true, message: '진도 기록이 수정되었습니다.' });
  } catch (error: any) {
    console.error('진도 기록 수정 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 3. 독서일지 삭제 (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');
    const nickname = searchParams.get('nickname');

    if (!logId) {
      return NextResponse.json({ ok: false, error: '삭제할 logId가 필요합니다.' }, { status: 400 });
    }

    // 소유자 검증
    try {
      const existingLog: any = await notion.pages.retrieve({ page_id: logId });
      const logOwner = existingLog.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (logOwner && nickname && logOwner.trim() !== nickname.trim()) {
        return NextResponse.json({ ok: false, error: '본인이 작성한 진도 기록만 삭제할 수 있습니다.' }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('일지 소유자 확인 오류:', e.message);
    }

    await notion.pages.update({
      page_id: logId,
      archived: true,
    });

    return NextResponse.json({ ok: true, message: '진도 기록이 삭제(아카이브)되었습니다.' });
  } catch (error: any) {
    console.error('진도 기록 삭제 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
