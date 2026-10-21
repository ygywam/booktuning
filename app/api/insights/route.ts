import { NextResponse } from 'next/server';
import { notion, INSIGHT_DB_ID } from '@/lib/notion';

export async function POST(request: Request) {
  try {
    const { bookNotionPageId, page, notes, nickname, imageUrl } = await request.json();

    if (!INSIGHT_DB_ID || !bookNotionPageId) {
      return NextResponse.json({ ok: false, error: 'INSIGHT_DB_ID 또는 책 ID가 누락되었습니다.' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    const payload: any = {
      parent: { database_id: INSIGHT_DB_ID },
      properties: {
        '내용': { title: [{ text: { content: (notes || '').substring(0, 1999) } }] },
        '관련 책': { relation: [{ id: bookNotionPageId }] },
        '페이지': { rich_text: [{ text: { content: String(page) } }] },
        '읽은날짜': { date: { start: today } },
      },
    };

    if (nickname) {
      payload.properties['기록자'] = { rich_text: [{ text: { content: nickname } }] };
    }

    // 사진 첨부 시 노션 본문에 이미지 블록 생성
    if (imageUrl && imageUrl.startsWith('http')) {
      payload.children = [
        {
          object: 'block',
          type: 'image',
          image: {
            type: 'external',
            external: { url: imageUrl },
          },
        },
      ];
    }

    await notion.pages.create(payload);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}