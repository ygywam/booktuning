import { NextResponse } from 'next/server';
// 기존: import { notion, LOG_DB_ID } from '@/lib/notion';
import { notion, LOG_DB_ID } from '../../../lib/notion';

export async function POST(request: Request) {
  try {
    const { bookNotionPageId, readDate, readPages, note, nickname } = await request.json();

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

    await notion.pages.create(payload);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}