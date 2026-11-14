import { NextResponse } from 'next/server';
import { notion, LOG_DB_ID, INSIGHT_DB_ID, BOOK_DB_ID, USER_DB_ID } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const classId = searchParams.get('classId');
    const role = searchParams.get('role');
    const isGlobal = !bookId || bookId === 'all';

    // 0. 전체 피드(글로벌 타임라인)인 경우, 도서 DB 및 사용자 DB를 사전 조회하여 학급/교사별 격리 맵 구축
    const bookClassMap = new Map<string, string>(); // bookPageId -> classId
    const bookIsStudentMap = new Map<string, boolean>(); // bookPageId -> isStudentBook
    const studentUserIds = new Set<string>();

    if (isGlobal) {
      // 0-1. 사용자 DB에서 학생 계정 ID 수집
      if (USER_DB_ID) {
        try {
          const userRes = await notion.databases.query({
            database_id: USER_DB_ID,
            page_size: 100,
          });
          userRes.results.forEach((page: any) => {
            const props = page.properties;
            const roleName = props['역할']?.select?.name || props['역할']?.status?.name || props['역할']?.rich_text?.[0]?.plain_text || '';
            const studentNum = props['학번']?.rich_text?.[0]?.plain_text || '';
            if (roleName.toLowerCase() === 'student' || roleName === '학생' || studentNum.trim() !== '') {
              studentUserIds.add(page.id);
            }
          });
        } catch (err) {
          console.warn('타임라인 사용자 DB 학생 목록 조회 건너뜀:', err);
        }
      }

      // 0-2. 도서 DB에서 도서별 소속학급(classId) 및 등록자 정보 매핑
      if (BOOK_DB_ID) {
        try {
          const bookRes = await notion.databases.query({
            database_id: BOOK_DB_ID,
            page_size: 100,
          });
          bookRes.results.forEach((page: any) => {
            const props = page.properties;
            const bookClassRel = props['소속학급']?.relation || [];
            const bookUserRel = props['사용자']?.relation || props['[북튜닝] 사용자 DB']?.relation || [];
            const bookNickname = (props['기록자']?.rich_text || []).map((t: any) => t.plain_text).join('');
            const bUserId = bookUserRel[0]?.id || '';
            const bClassId = bookClassRel[0]?.id || '';

            bookClassMap.set(page.id, bClassId);

            const isStudent = (bUserId && studentUserIds.has(bUserId)) || (bookNickname && /\(\d{4,6}\)/.test(bookNickname));
            bookIsStudentMap.set(page.id, !!isStudent);
          });
        } catch (err) {
          console.warn('타임라인 도서 DB 조회 건너뜀:', err);
        }
      }
    }

    let readingLogs: any[] = [];
    let pageLogs: any[] = [];

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
          const relBookId = relBook[0]?.id || '';
          const logClassRel = props['소속학급']?.relation || [];
          const resolvedClassId = logClassRel[0]?.id || bookClassMap.get(relBookId) || '';
          const logNickname = (props['기록자']?.rich_text || []).map((t: any) => t.plain_text).join('');
          const isStudent = (userRel[0]?.id && studentUserIds.has(userRel[0]?.id)) ||
            (logNickname && /\(\d{4,6}\)/.test(logNickname)) ||
            bookIsStudentMap.get(relBookId) || false;

          const logRawLikes = props['공감한 사람']?.rich_text?.[0]?.plain_text || '';
          const logLikedUsers = logRawLikes
            ? logRawLikes.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
          const logLikesCount = props['공감수']?.number ?? logLikedUsers.length;

          readingLogs.push({
            logId: page.id,
            bookNotionPageId: (!isGlobal && bookId) ? bookId : relBookId,
            classId: resolvedClassId,
            isStudent: !!isStudent,
            likes: logLikesCount,
            likedUsers: logLikedUsers,
            readDate: (props['읽은 날짜']?.title || []).map((t: any) => t.plain_text).join(''),
            readPages: props['이번에 읽은 페이지(숫자)']?.number || 0,
            note: (props['독서 감상록']?.rich_text || []).map((t: any) => t.plain_text).join(''),
            nickname: logNickname,
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
          const relBookId = relBook[0]?.id || '';
          const logClassRel = props['소속학급']?.relation || [];
          const resolvedClassId = logClassRel[0]?.id || bookClassMap.get(relBookId) || '';
          const logNickname = (props['기록자']?.rich_text || []).map((t: any) => t.plain_text).join('');
          const isStudent = (userRel[0]?.id && studentUserIds.has(userRel[0]?.id)) ||
            (logNickname && /\(\d{4,6}\)/.test(logNickname)) ||
            bookIsStudentMap.get(relBookId) || false;
          const fileProp = props['사진']?.files?.[0];
          const imageUrl = fileProp?.file?.url || fileProp?.external?.url || '';

          const insightRawLikes = props['공감한 사람']?.rich_text?.[0]?.plain_text || '';
          const insightLikedUsers = insightRawLikes
            ? insightRawLikes.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
          const insightLikesCount = props['공감수']?.number ?? insightLikedUsers.length;

          pageLogs.push({
            pageLogId: page.id,
            bookNotionPageId: (!isGlobal && bookId) ? bookId : relBookId,
            classId: resolvedClassId,
            isStudent: !!isStudent,
            likes: insightLikesCount,
            likedUsers: insightLikedUsers,
            page: (props['페이지']?.rich_text || []).map((t: any) => t.plain_text).join(''),
            notes: (props['내용']?.title || []).map((t: any) => t.plain_text).join(''),
            nickname: logNickname,
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

    // 2-1. 글로벌 피드인 경우 학급 및 역할 격리 정책 적용
    if (isGlobal) {
      if (classId && classId !== 'all' && classId !== 'teachers') {
        // 특정 학급 서재/피드 (학생 본인 피드 또는 교사의 특정 학급 피드):
        // 해당 학급(classId)에 속한 도서/기록만 통과 (교사 독서모임 도서 기록이나 타 학급 도서 기록은 완전 차단)
        readingLogs = readingLogs.filter((l) => l.classId === classId);
        pageLogs = pageLogs.filter((p) => p.classId === classId);
      } else if (classId === 'teachers' || (role === 'teacher' && !classId)) {
        // 교사 독서모임 피드:
        // 교사 도서에서 발생한 기록만 통과 (학생이 작성하거나 학생 도서에 달린 기록은 100% 완전 제외)
        readingLogs = readingLogs.filter((l) => !l.isStudent);
        pageLogs = pageLogs.filter((p) => !p.isStudent);
      } else if (role === 'student' && !classId) {
        // 소속 학급 없는 학생의 경우 빈 피드
        readingLogs = [];
        pageLogs = [];
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
        classId: l.classId,
        likes: l.likes || 0,
        likedUsers: l.likedUsers || [],
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
        classId: p.classId,
        likes: p.likes || 0,
        likedUsers: p.likedUsers || [],
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
