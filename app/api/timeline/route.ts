import { NextResponse } from 'next/server';
import { notion, LOG_DB_ID, INSIGHT_DB_ID } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const isGlobal = !bookId || bookId === 'all';

    const readingLogs: any[] = [];
    const pageLogs: any[] = [];

    // 1. 독서일지 조회 (개별 도서 또는 전체 피드)
    if (LOG_DB_ID) {
      try {
        const queryPayload: any = {
          database_id: LOG_DB_ID,
          page_size: 100,
          sorts: [{ property: '읽은 날짜', direction: 'descending' }],
        };
        if (!isGlobal && bookId) {
          queryPayload.filter = {
            property: '관련 책',
            relation: { contains: bookId },
          };
        }

        const logRes = await notion.databases.query(queryPayload);

        logRes.results.forEach((page: any) => {
          const props = page.properties;
          const userRel = props['사용자']?.relation || props['[북튜닝] 사용자 DB']?.relation || [];
          const relBook = props['관련 책']?.relation || [];
          readingLogs.push({
            logId: page.id,
            bookNotionPageId: (!isGlobal && bookId) ? bookId : (relBook[0]?.id || ''),
            readDate: (props['읽은 날짜']?.title || []).map((t: any) => t.plain_text).join(''),
            readPages: props['이번에 읽은 페이지(숫자)']?.number || 0,
            note: (props['독서 감상록']?.rich_text || []).map((t: any) => t.plain_text).join(''),
            nickname: (props['기록자']?.rich_text || []).map((t: any) => t.plain_text).join(''),
            userId: userRel[0]?.id || '',
            createdAt: page.created_time,
          });
        });
      } catch (e) {
        console.warn('독서일지 타임라인 조회 오류:', e);
      }
    }

    // 2. 문장수집 조회 (개별 도서 또는 전체 피드)
    if (INSIGHT_DB_ID) {
      try {
        const queryPayload: any = {
          database_id: INSIGHT_DB_ID,
          page_size: 100,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        };
        if (!isGlobal && bookId) {
          queryPayload.filter = {
            property: '관련 책',
            relation: { contains: bookId },
          };
        }

        const insightRes = await notion.databases.query(queryPayload);

        insightRes.results.forEach((page: any) => {
          const props = page.properties;
          const readDate = props['읽은날짜']?.date?.start || page.created_time.split('T')[0];
          const userRel = props['사용자']?.relation || props['[북튜닝] 사용자 DB']?.relation || [];
          const relBook = props['관련 책']?.relation || [];
          const fileProp = props['사진']?.files?.[0];
          const imageUrl = fileProp?.file?.url || fileProp?.external?.url || '';

          pageLogs.push({
            pageLogId: page.id,
            bookNotionPageId: (!isGlobal && bookId) ? bookId : (relBook[0]?.id || ''),
            page: (props['페이지']?.rich_text || []).map((t: any) => t.plain_text).join(''),
            notes: (props['내용']?.title || []).map((t: any) => t.plain_text).join(''),
            nickname: (props['기록자']?.rich_text || []).map((t: any) => t.plain_text).join(''),
            userId: userRel[0]?.id || '',
            readDate,
            imageUrl,
            createdAt: page.created_time,
          });
        });
      } catch (e) {
        console.warn('문장수집 타임라인 조회 오류:', e);
      }
    }

    // 3. 도서 페이지 본문 블록 파싱 (AI 감상문 & 나의 감상문 추출 - 개별 도서 조회 시에만 실행)
    let aiReport = '';
    let myReport = '';

    if (bookId && !isGlobal) {
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

          if (textContent.includes('AI 감상문')) {
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
    }

    // 4. 통합 타임라인 리스트 생성 (최신순 정렬)
    const timeline = [
      ...readingLogs.map((l) => ({
        type: 'log',
        id: l.logId,
        date: l.readDate || l.createdAt?.split('T')[0] || '',
        page: l.readPages,
        content: l.note,
        nickname: l.nickname,
        userId: l.userId,
        createdAt: l.createdAt || '',
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
        createdAt: p.createdAt || '',
      })),
    ].sort((a, b) => {
      const dateA = a.date || '0000-00-00';
      const dateB = b.date || '0000-00-00';
      const dateCmp = dateB.localeCompare(dateA);
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
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
