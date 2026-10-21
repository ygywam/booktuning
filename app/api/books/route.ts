import { NextResponse } from 'next/server';
import { notion, BOOK_DB_ID } from '@/lib/notion';

// 1. 노션 DB에서 도서 목록 조회
export async function GET() {
  try {
    if (!BOOK_DB_ID) {
      return NextResponse.json({ ok: false, error: 'NOTION_BOOK_DB_ID가 설정되지 않았습니다.' }, { status: 400 });
    }

    const response = await notion.databases.query({
      database_id: BOOK_DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    const books = response.results.map((page: any) => {
      const props = page.properties;
      return {
        bookId: page.id,
        notionPageId: page.id,
        title: props['*책 제목']?.title[0]?.plain_text || '제목 없음',
        author: props['저자']?.rich_text[0]?.plain_text || '미상',
        publisher: props['출판사']?.rich_text[0]?.plain_text || '',
        totalPages: props['*전체 페이지수']?.number || 0,
        description: props['책소개']?.rich_text[0]?.plain_text || '',
        nickname: props['기록자']?.rich_text[0]?.plain_text || '익명',
        coverUrl: page.cover?.external?.url || props['표지']?.files[0]?.external?.url || '',
        likes: props['공감수']?.number || 0,
        myReport: '',
        aiReport: '',
        readPages: 0,
        progressPercent: 0,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
      };
    });

    return NextResponse.json({ ok: true, books });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. 노션 DB에 도서 등록
export async function POST(request: Request) {
  try {
    const book = await request.json();

    if (!book.title) {
      return NextResponse.json({ ok: false, error: '도서명을 입력해 주세요.' }, { status: 400 });
    }

    const payload: any = {
      parent: { database_id: BOOK_DB_ID },
      properties: {
        '*책 제목': { title: [{ text: { content: book.title.substring(0, 200) } }] },
        '저자': { rich_text: [{ text: { content: (book.author || '미상').substring(0, 200) } }] },
        '출판사': { rich_text: [{ text: { content: (book.publisher || '미상').substring(0, 200) } }] },
        '*전체 페이지수': { number: Number(book.totalPages) || 0 },
        '책소개': { rich_text: [{ text: { content: (book.description || '소개 없음').substring(0, 1999) } }] },
        '공감수': { number: 0 },
        '체크박스': { checkbox: true },
      },
    };

    if (book.nickname) {
      payload.properties['기록자'] = { rich_text: [{ text: { content: book.nickname } }] };
    }

    if (book.coverUrl && book.coverUrl.startsWith('http')) {
      payload.properties['표지'] = { files: [{ name: 'cover.jpg', type: 'external', external: { url: book.coverUrl } }] };
      payload.cover = { type: 'external', external: { url: book.coverUrl } };
    }

    const response = await notion.pages.create(payload);

    return NextResponse.json({ ok: true, bookId: response.id, notionPageId: response.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}