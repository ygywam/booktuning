import { NextResponse } from 'next/server';
import { notion, LOG_DB_ID, INSIGHT_DB_ID } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ ok: false, error: '도서 ID(bookId)가 필요합니다.' }, { status: 400 });
    }

    const readingLogs: any[] = [];
    const pageLogs: any[] = [];

    // 1. 해당 도서의 독서일지 조회
    if (LOG_DB_ID) {
      try {
        const logRes = await notion.databases.query({
          database_id: LOG_DB_ID,
          filter: {
            property: '관련 책',
            relation: {
              contains: bookId,
            },
          },
          sorts: [{ property: '읽은 날짜', direction: 'ascending' }],
        });

        logRes.results.forEach((page: any) => {
          const props = page.properties;
          const userRel = props['사용자']?.relation || props['[북튜닝] 사용자 DB']?.relation || [];
          readingLogs.push({
            logId: page.id,
            bookNotionPageId: bookId,
            readDate: props['읽은 날짜']?.title[0]?.plain_text || '',
            readPages: props['이번에 읽은 페이지(숫자)']?.number || 0,
            note: props['독서 감상록']?.rich_text[0]?.plain_text || '',
            nickname: props['기록자']?.rich_text[0]?.plain_text || '',
            userId: userRel[0]?.id || '',
            createdAt: page.created_time,
          });
        });
      } catch (e) {
        console.warn('독서일지 타임라인 조회 오류:', e);
      }
    }

    // 2. 해당 도서의 문장수집 조회
    if (INSIGHT_DB_ID) {
      try {
        const insightRes = await notion.databases.query({
          database_id: INSIGHT_DB_ID,
          filter: {
            property: '관련 책',
            relation: {
              contains: bookId,
            },
          },
          sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        });

        insightRes.results.forEach((page: any) => {
          const props = page.properties;
          const readDate = props['읽은날짜']?.date?.start || page.created_time.split('T')[0];
          const userRel = props['사용자']?.relation || props['[북튜닝] 사용자 DB']?.relation || [];
          pageLogs.push({
            pageLogId: page.id,
            bookNotionPageId: bookId,
            page: props['페이지']?.rich_text[0]?.plain_text || '',
            notes: props['내용']?.title[0]?.plain_text || '',
            nickname: props['기록자']?.rich_text[0]?.plain_text || '',
            userId: userRel[0]?.id || '',
            readDate,
            createdAt: page.created_time,
          });
        });
      } catch (e) {
        console.warn('문장수집 타임라인 조회 오류:', e);
      }
    }

    // 3. 도서 페이지 본문 블록 파싱 (AI 감상문 & 나의 감상문 추출)
    let aiReport = '';
    let myReport = '';

    try {
      const blocksRes = await notion.blocks.children.list({ block_id: bookId, page_size: 100 });
      let currentSection: 'ai' | 'my' | null = null;
      const aiLines: string[] = [];
      const myLines: string[] = [];

      blocksRes.results.forEach((block: any) => {
        const type = block.type;
        const textContent = (block[type]?.rich_text || [])
          .map((t: any) => t.plain_text)
          .join('');

        if (textContent.includes('Gemini AI 감상문')) {
          currentSection = 'ai';
          return;
        }
        if (textContent.includes('나의 독서 감상문') || textContent.includes('나의 감상문')) {
          currentSection = 'my';
          return;
        }

        if (currentSection === 'ai') {
          if (type.startsWith('heading_')) {
            currentSection = null;
          } else if (textContent) {
            aiLines.push(textContent);
          }
        } else if (currentSection === 'my') {
          if (type.startsWith('heading_')) {
            currentSection = null;
          } else if (textContent) {
            myLines.push(textContent);
          }
        }
      });

      aiReport = aiLines.join('\n\n');
      myReport = myLines.join('\n\n');
    } catch (e) {
      console.warn('도서 본문 블록 조회 건너뜀:', e);
    }

    // 4. 통합 타임라인 리스트 생성 (정렬)
    const timeline = [
      ...readingLogs.map((l) => ({
        type: 'log',
        id: l.logId,
        date: l.readDate || l.createdAt?.split('T')[0] || '',
        page: l.readPages,
        content: l.note,
        nickname: l.nickname,
        userId: l.userId,
      })),
      ...pageLogs.map((p) => ({
        type: 'insight',
        id: p.pageLogId,
        date: p.readDate || p.createdAt?.split('T')[0] || '',
        page: p.page,
        content: p.notes,
        imageUrl: p.imageUrl,
        nickname: p.nickname,
        userId: p.userId,
      })),
    ].sort((a, b) => {
      const dateA = a.date || '0000-00-00';
      const dateB = b.date || '0000-00-00';
      return dateA.localeCompare(dateB);
    });

    return NextResponse.json({
      ok: true,
      timeline,
      readingLogs,
      pageLogs,
      aiReport,
      myReport,
    });
  } catch (error: any) {
    console.error('타임라인 로딩 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
