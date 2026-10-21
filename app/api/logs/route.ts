import { NextResponse } from 'next/server';
import { notion, LOG_DB_ID } from '../../../lib/notion';

// 1. 독서일지 등록 (POST)
export async function POST(request: Request) {
  try {
    const { bookNotionPageId, readDate, readPages, note, nickname, userId } = await request.json();

    if (!LOG_DB_ID || !bookNotionPageId) {
      return NextResponse.json({ ok: false, error: '필수 설정값(LOG_DB_ID 또는 책 ID)이 부족합니다.' }, { status: 400 });
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

    if (userId) {
      payload.properties['사용자'] = { relation: [{ id: userId }] };
    }

    let response;
    try {
      response = await notion.pages.create(payload);
    } catch (createErr: any) {
      if (payload.properties['사용자']) {
        delete payload.properties['사용자'];
        response = await notion.pages.create(payload);
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
    const { logId, readDate, readPages, note } = await request.json();

    if (!logId) {
      return NextResponse.json({ ok: false, error: '수정할 logId가 필요합니다.' }, { status: 400 });
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

    if (!logId) {
      return NextResponse.json({ ok: false, error: '삭제할 logId가 필요합니다.' }, { status: 400 });
    }

    await notion.pages.update({
      page_id: logId,
      archived: true,
    });

    return NextResponse.json({ ok: true, message: '진도 기록이 삭제되었습니다.' });
  } catch (error: any) {
    console.error('진도 기록 삭제 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
