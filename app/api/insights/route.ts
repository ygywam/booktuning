import { NextResponse } from 'next/server';
import { notion, INSIGHT_DB_ID } from '../../../lib/notion';

// 1. 문장수집 등록 (POST)
export async function POST(request: Request) {
  try {
    const { bookNotionPageId, page, notes, nickname, userId, imageUrl } = await request.json();

    if (!INSIGHT_DB_ID || !bookNotionPageId) {
      return NextResponse.json({ ok: false, error: 'INSIGHT_DB_ID 또는 책 ID가 누락되었습니다.' }, { status: 400 });
    }

    // 보안 검증: 본인이 등록한 도서에만 문장 수집 가능
    try {
      const bookPage: any = await notion.pages.retrieve({ page_id: bookNotionPageId });
      const bookOwner = bookPage.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (bookOwner && nickname && bookOwner.trim() !== nickname.trim()) {
        return NextResponse.json({
          ok: false,
          error: `본인이 등록한 도서에만 문장을 수집할 수 있습니다. (도서 등록자: ${bookOwner})`,
        }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('도서 소유자 확인 오류:', e.message);
    }

    const today = new Date().toISOString().split('T')[0];

    const payload: any = {
      parent: { database_id: INSIGHT_DB_ID },
      properties: {
        '내용': { title: [{ text: { content: (notes || '').substring(0, 1999) } }] },
        '관련 책': { relation: [{ id: bookNotionPageId }] },
        '페이지': { rich_text: [{ text: { content: String(page || '') } }] },
        '읽은날짜': { date: { start: today } },
      },
    };

    if (nickname) {
      payload.properties['기록자'] = { rich_text: [{ text: { content: nickname } }] };
    }

    if (userId) {
      payload.properties['사용자'] = { relation: [{ id: userId }] };
    }

    // 사진 첨부 시 노션 본문에 이미지 블록 생성
    if (imageUrl && String(imageUrl).startsWith('http')) {
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

    return NextResponse.json({ ok: true, pageLogId: response.id });
  } catch (error: any) {
    console.error('문장 수집 저장 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. 문장수집 수정 (PUT)
export async function PUT(request: Request) {
  try {
    const { pageLogId, nickname, page, notes } = await request.json();

    if (!pageLogId) {
      return NextResponse.json({ ok: false, error: '수정할 pageLogId가 필요합니다.' }, { status: 400 });
    }

    // 소유자 검증
    try {
      const existingIns: any = await notion.pages.retrieve({ page_id: pageLogId });
      const insOwner = existingIns.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (insOwner && nickname && insOwner.trim() !== nickname.trim()) {
        return NextResponse.json({ ok: false, error: '본인이 작성한 문장 수집만 수정할 수 있습니다.' }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('문장수집 소유자 확인 오류:', e.message);
    }

    const properties: any = {};
    if (notes !== undefined) properties['내용'] = { title: [{ text: { content: String(notes).substring(0, 1999) } }] };
    if (page !== undefined) properties['페이지'] = { rich_text: [{ text: { content: String(page) } }] };

    await notion.pages.update({
      page_id: pageLogId,
      properties,
    });

    return NextResponse.json({ ok: true, message: '문장 수집이 수정되었습니다.' });
  } catch (error: any) {
    console.error('문장 수집 수정 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 3. 문장수집 삭제 (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageLogId = searchParams.get('pageLogId');
    const nickname = searchParams.get('nickname');

    if (!pageLogId) {
      return NextResponse.json({ ok: false, error: '삭제할 pageLogId가 필요합니다.' }, { status: 400 });
    }

    // 소유자 검증
    try {
      const existingIns: any = await notion.pages.retrieve({ page_id: pageLogId });
      const insOwner = existingIns.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (insOwner && nickname && insOwner.trim() !== nickname.trim()) {
        return NextResponse.json({ ok: false, error: '본인이 작성한 문장 수집만 삭제할 수 있습니다.' }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('문장수집 소유자 확인 오류:', e.message);
    }

    await notion.pages.update({
      page_id: pageLogId,
      archived: true,
    });

    return NextResponse.json({ ok: true, message: '문장 수집이 삭제(아카이브)되었습니다.' });
  } catch (error: any) {
    console.error('문장 수집 삭제 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
