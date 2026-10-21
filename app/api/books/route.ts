import { NextResponse } from 'next/server';
import { notion, BOOK_DB_ID, LOG_DB_ID, INSIGHT_DB_ID } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

// 1. 도서 목록 조회 (GET) - 진도율, 최근 쪽수, 좋아요 집계 롤업 포함
export async function GET() {
  try {
    if (!BOOK_DB_ID) {
      return NextResponse.json({ ok: false, error: 'NOTION_BOOK_DB_ID가 설정되지 않았습니다.' }, { status: 400 });
    }

    // 도서 목록 가져오기 (아카이브되지 않은 도서들)
    const bookResponse = await notion.databases.query({
      database_id: BOOK_DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    // 도서별 진도 및 문장수집 계산용 맵
    const latestLogByBookId: { [bookId: string]: number } = {};
    const maxInsightPageByBookId: { [bookId: string]: number } = {};

    // 독서일지 DB가 설정되어 있으면 전체 일지를 가져와서 도서별 최신 쪽수 파악
    if (LOG_DB_ID) {
      try {
        const logResponse = await notion.databases.query({
          database_id: LOG_DB_ID,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 100,
        });

        logResponse.results.forEach((page: any) => {
          const props = page.properties;
          const relatedBook = props['관련 책']?.relation?.[0]?.id;
          const readPages = props['이번에 읽은 페이지(숫자)']?.number || 0;
          if (relatedBook && !latestLogByBookId[relatedBook]) {
            latestLogByBookId[relatedBook] = readPages;
          }
        });
      } catch (err) {
        console.warn('독서일지 롤업 계산 건너뜀:', err);
      }
    }

    // 문장수집 DB가 설정되어 있으면 전체 인사이트를 가져와서 도서별 최대 쪽수 파악
    if (INSIGHT_DB_ID) {
      try {
        const insightResponse = await notion.databases.query({
          database_id: INSIGHT_DB_ID,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 100,
        });

        insightResponse.results.forEach((page: any) => {
          const props = page.properties;
          const relatedBook = props['관련 책']?.relation?.[0]?.id;
          const pageStr = props['페이지']?.rich_text[0]?.plain_text || '';
          const match = pageStr.match(/\d+/g);
          if (relatedBook && match && match.length > 0) {
            const pNum = Math.max(...match.map(Number));
            if (!maxInsightPageByBookId[relatedBook] || pNum > maxInsightPageByBookId[relatedBook]) {
              maxInsightPageByBookId[relatedBook] = pNum;
            }
          }
        });
      } catch (err) {
        console.warn('문장수집 롤업 계산 건너뜀:', err);
      }
    }

    const books = bookResponse.results.map((page: any) => {
      const props = page.properties;
      const totalPages = props['*전체 페이지수']?.number || 0;
      const readingLogPages = latestLogByBookId[page.id] || 0;
      const insightPage = maxInsightPageByBookId[page.id] || 0;

      // 진도기록과 문장수집 중 더 큰 쪽수를 기준으로 진도율 산출
      const readPages = Math.max(readingLogPages, insightPage);
      const progressPercent = totalPages > 0 ? Math.min(100, Math.round((readPages / totalPages) * 100)) : 0;

      const rawLikesStr = props['공감한 사람']?.rich_text[0]?.plain_text || '';
      const likedUsers = rawLikesStr
        ? rawLikesStr.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const likesCount = props['공감수']?.number ?? likedUsers.length;

      // 사용자 relation 유연 조회 (사용자 또는 [북튜닝] 사용자 DB)
      const userRel = props['사용자']?.relation || props['[북튜닝] 사용자 DB']?.relation || [];

      return {
        bookId: page.id,
        notionPageId: page.id,
        title: props['*책 제목']?.title[0]?.plain_text || props['책 제목']?.title[0]?.plain_text || '제목 없음',
        author: props['저자']?.rich_text[0]?.plain_text || '미상',
        publisher: props['출판사']?.rich_text[0]?.plain_text || '',
        totalPages,
        description: props['책소개']?.rich_text[0]?.plain_text || '',
        nickname: props['기록자']?.rich_text[0]?.plain_text || '익명',
        userId: userRel[0]?.id || '',
        coverUrl: page.cover?.external?.url || props['표지']?.files[0]?.external?.url || '',
        likes: likesCount,
        likedUsers,
        checkbox: props['체크박스']?.checkbox || progressPercent >= 100,
        readPages,
        progressPercent,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
      };
    });

    return NextResponse.json({ ok: true, books });
  } catch (error: any) {
    console.error('도서 목록 로딩 실패:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. 도서 등록 (POST)
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
        '책소개': { rich_text: [{ text: { content: (book.description || '책 소개가 없습니다.').substring(0, 1999) } }] },
        '공감수': { number: 0 },
        '체크박스': { checkbox: false },
      },
    };

    if (book.nickname) {
      payload.properties['기록자'] = { rich_text: [{ text: { content: book.nickname } }] };
    }

    if (book.userId) {
      payload.properties['[북튜닝] 사용자 DB'] = { relation: [{ id: book.userId }] };
    }

    if (book.coverUrl && String(book.coverUrl).startsWith('http')) {
      payload.properties['표지'] = { files: [{ name: 'cover.jpg', type: 'external', external: { url: book.coverUrl } }] };
      payload.cover = { type: 'external', external: { url: book.coverUrl } };
    }

    let response;
    try {
      response = await notion.pages.create(payload);
    } catch (createErr: any) {
      // '[북튜닝] 사용자 DB'가 아니라 '사용자'일 경우 재시도
      if (payload.properties['[북튜닝] 사용자 DB']) {
        delete payload.properties['[북튜닝] 사용자 DB'];
        payload.properties['사용자'] = { relation: [{ id: book.userId }] };
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

    return NextResponse.json({ ok: true, bookId: response.id, notionPageId: response.id });
  } catch (error: any) {
    console.error('도서 등록 실패:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 3. 도서 수정 (PUT)
export async function PUT(request: Request) {
  try {
    const { bookId, title, author, publisher, totalPages, description, coverUrl, checkbox } = await request.json();

    if (!bookId) {
      return NextResponse.json({ ok: false, error: '수정할 도서 ID가 필요합니다.' }, { status: 400 });
    }

    const properties: any = {};
    if (title !== undefined) properties['*책 제목'] = { title: [{ text: { content: title.substring(0, 200) } }] };
    if (author !== undefined) properties['저자'] = { rich_text: [{ text: { content: author.substring(0, 200) } }] };
    if (publisher !== undefined) properties['출판사'] = { rich_text: [{ text: { content: publisher.substring(0, 200) } }] };
    if (totalPages !== undefined) properties['*전체 페이지수'] = { number: Number(totalPages) || 0 };
    if (description !== undefined) properties['책소개'] = { rich_text: [{ text: { content: description.substring(0, 1999) } }] };
    if (checkbox !== undefined) properties['체크박스'] = { checkbox: Boolean(checkbox) };

    const updatePayload: any = {
      page_id: bookId,
      properties,
    };

    if (coverUrl && String(coverUrl).startsWith('http')) {
      properties['표지'] = { files: [{ name: 'cover.jpg', type: 'external', external: { url: coverUrl } }] };
      updatePayload.cover = { type: 'external', external: { url: coverUrl } };
    }

    await notion.pages.update(updatePayload);

    return NextResponse.json({ ok: true, message: '도서 정보가 성공적으로 수정되었습니다.' });
  } catch (error: any) {
    console.error('도서 수정 실패:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 4. 도서 삭제 (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ ok: false, error: '삭제할 도서 ID가 필요합니다.' }, { status: 400 });
    }

    // 노션에서는 페이지를 archive 처리하면 휴지통/삭제로 이동됨
    await notion.pages.update({
      page_id: bookId,
      archived: true,
    });

    return NextResponse.json({ ok: true, message: '도서가 삭제(아카이브)되었습니다.' });
  } catch (error: any) {
    console.error('도서 삭제 실패:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
