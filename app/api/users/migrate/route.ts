import { NextResponse } from 'next/server';
import { notion, USER_DB_ID, BOOK_DB_ID, LOG_DB_ID, INSIGHT_DB_ID } from '../../../../lib/notion';

// 기존 노션 데이터의 '기록자' 텍스트를 읽어 사용자 DB에 생성하고 관계형으로 연결하는 원클릭 마이그레이션
export async function POST() {
  try {
    if (!USER_DB_ID) {
      return NextResponse.json({
        ok: false,
        error: 'NOTION_USER_DB_ID가 설정되어 있지 않습니다. 먼저 노션에 사용자 DB를 만들고 ID를 등록해 주세요.',
      }, { status: 400 });
    }

    const report = {
      usersCreated: 0,
      booksLinked: 0,
      logsLinked: 0,
      insightsLinked: 0,
    };

    // 1. 기존 등록된 사용자 목록 확보
    const userRes = await notion.databases.query({ database_id: USER_DB_ID });
    const userMap: { [nick: string]: string } = {}; // 닉네임 -> 사용자 페이지 ID

    userRes.results.forEach((page: any) => {
      const nick = page.properties['닉네임']?.title[0]?.plain_text?.trim();
      if (nick) userMap[nick] = page.id;
    });

    // 헬퍼: 닉네임으로 사용자 ID를 가져오거나 없으면 새로 생성
    const getOrCreateUserId = async (rawNick: string) => {
      const nick = (rawNick || '기록조율사').trim();
      if (userMap[nick]) return userMap[nick];

      const newPage = await notion.pages.create({
        parent: { database_id: USER_DB_ID },
        properties: {
          '닉네임': { title: [{ text: { content: nick } }] },
          'PIN': { rich_text: [{ text: { content: '0000' } }] },
        },
      });
      userMap[nick] = newPage.id;
      report.usersCreated++;
      return newPage.id;
    };

    // 2. 도서 DB 순회 및 관계형 연결
    if (BOOK_DB_ID) {
      const booksRes = await notion.databases.query({ database_id: BOOK_DB_ID });
      for (const page of booksRes.results as any[]) {
        const currentRel = page.properties['사용자']?.relation;
        if (!currentRel || currentRel.length === 0) {
          const nick = page.properties['기록자']?.rich_text[0]?.plain_text || '기록조율사';
          const userId = await getOrCreateUserId(nick);
          try {
            await notion.pages.update({
              page_id: page.id,
              properties: {
                '사용자': { relation: [{ id: userId }] },
              },
            });
            report.booksLinked++;
          } catch (e) {
            console.warn(`도서(${page.id}) 관계형 연결 건너뜀:`, e);
          }
        }
      }
    }

    // 3. 독서일지 DB 순회 및 관계형 연결
    if (LOG_DB_ID) {
      const logsRes = await notion.databases.query({ database_id: LOG_DB_ID });
      for (const page of logsRes.results as any[]) {
        const currentRel = page.properties['사용자']?.relation;
        if (!currentRel || currentRel.length === 0) {
          const nick = page.properties['기록자']?.rich_text[0]?.plain_text || '기록조율사';
          const userId = await getOrCreateUserId(nick);
          try {
            await notion.pages.update({
              page_id: page.id,
              properties: {
                '사용자': { relation: [{ id: userId }] },
              },
            });
            report.logsLinked++;
          } catch (e) {
            console.warn(`독서일지(${page.id}) 관계형 연결 건너뜀:`, e);
          }
        }
      }
    }

    // 4. 문장수집 DB 순회 및 관계형 연결
    if (INSIGHT_DB_ID) {
      const insightsRes = await notion.databases.query({ database_id: INSIGHT_DB_ID });
      for (const page of insightsRes.results as any[]) {
        const currentRel = page.properties['사용자']?.relation;
        if (!currentRel || currentRel.length === 0) {
          const nick = page.properties['기록자']?.rich_text[0]?.plain_text || '기록조율사';
          const userId = await getOrCreateUserId(nick);
          try {
            await notion.pages.update({
              page_id: page.id,
              properties: {
                '사용자': { relation: [{ id: userId }] },
              },
            });
            report.insightsLinked++;
          } catch (e) {
            console.warn(`문장수집(${page.id}) 관계형 연결 건너뜀:`, e);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: '기존 데이터의 사용자 관계형 자동 연결이 완료되었습니다!',
      report,
    });
  } catch (error: any) {
    console.error('마이그레이션 실패:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
