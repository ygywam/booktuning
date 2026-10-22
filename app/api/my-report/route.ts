import { NextResponse } from 'next/server';
import { notion } from '../../../lib/notion';

export async function POST(request: Request) {
  try {
    const { bookId, text, nickname } = await request.json();

    if (!bookId || !text) {
      return NextResponse.json({ ok: false, error: '도서 ID와 감상문 내용이 필요합니다.' }, { status: 400 });
    }

    // 소유자 검증 (본인이 등록한 도서에만 감상문 저장 가능)
    try {
      const bookPage: any = await notion.pages.retrieve({ page_id: bookId });
      const bookOwner = bookPage.properties['기록자']?.rich_text[0]?.plain_text || '';
      if (bookOwner && nickname && bookOwner.trim() !== nickname.trim()) {
        return NextResponse.json({
          ok: false,
          error: `도서 등록자(${bookOwner}님)만 감상문을 저장할 수 있습니다.`,
        }, { status: 403 });
      }
    } catch (e: any) {
      console.warn('감상문 도서 소유자 확인 오류:', e.message);
    }

    const cleanText = String(text).trim();
    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const authorStr = nickname ? ` - ${nickname}` : '';

    // 노션 글자수 제한(2000자) 대응 청크 분할
    const richTextChunks: any[] = [];
    for (let i = 0; i < cleanText.length; i += 1990) {
      richTextChunks.push({
        type: 'text',
        text: { content: cleanText.substring(i, i + 1990) },
      });
    }

    const blocks: any[] = [
      {
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: `✍️ 나의 독서 감상문 (${timeStr})${authorStr}` } }],
          color: 'brown_background',
        },
      },
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: richTextChunks,
          icon: { emoji: '💡' },
          color: 'orange_background',
        },
      },
    ];

    await notion.blocks.children.append({
      block_id: bookId,
      children: blocks,
    });

    return NextResponse.json({ ok: true, message: '나의 감상문이 노션에 저장되었습니다.', text: cleanText });
  } catch (error: any) {
    console.error('나의 감상문 저장 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
