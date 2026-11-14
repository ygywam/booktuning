import { NextResponse } from 'next/server';
import { notion, USER_DB_ID, findClassById } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, pin, studentNumber } = body;

    const cleanName = String(name || '').trim();
    const cleanPin = String(pin || '').trim();

    if (!cleanName) {
      return NextResponse.json({ ok: false, error: '이름을 입력해 주세요.' }, { status: 400 });
    }
    if (!cleanPin) {
      return NextResponse.json({ ok: false, error: '비밀번호(PIN)를 입력해 주세요.' }, { status: 400 });
    }

    if (!USER_DB_ID) {
      return NextResponse.json({
        ok: true,
        user: {
          id: 'dev_user',
          nickname: cleanName,
          role: role || 'teacher',
          studentNumber: studentNumber || '',
          pin: cleanPin,
        },
      });
    }

    // ==========================================
    // 1. 학생 로그인: 학번 + 이름 + PIN
    // ==========================================
    if (role === 'student') {
      const cleanStudentNum = String(studentNumber || '').trim();
      if (!cleanStudentNum) {
        return NextResponse.json({ ok: false, error: '학번을 입력해 주세요.' }, { status: 400 });
      }

      // 학번으로 우선 조회
      let userPage: any = null;
      try {
        const queryRes = await notion.databases.query({
          database_id: USER_DB_ID,
          filter: {
            property: '학번',
            rich_text: { equals: cleanStudentNum },
          },
          page_size: 5,
        });

        // 학번 일치자 중 이름 확인
        for (const page of queryRes.results) {
          const props: any = (page as any).properties;
          const nick = props['닉네임']?.title?.[0]?.plain_text || '';
          if (nick.includes(cleanName)) {
            userPage = page;
            break;
          }
        }
      } catch (err: any) {
        console.warn('학번 필터 검색 실패(속성 미비 등), 닉네임 폴백 검색:', err.message);
      }

      // 학번 검색에 실패했거나 속성이 없을 경우 닉네임 기반 폴백 검색
      if (!userPage) {
        const fallbackRes = await notion.databases.query({
          database_id: USER_DB_ID,
          filter: {
            property: '닉네임',
            title: { equals: `${cleanName} (${cleanStudentNum})` },
          },
          page_size: 1,
        });
        if (fallbackRes.results.length > 0) {
          userPage = fallbackRes.results[0];
        } else {
          // 이름만으로 검색 시도
          const fallbackRes2 = await notion.databases.query({
            database_id: USER_DB_ID,
            filter: {
              property: '닉네임',
              title: { equals: cleanName },
            },
            page_size: 1,
          });
          if (fallbackRes2.results.length > 0) {
            userPage = fallbackRes2.results[0];
          }
        }
      }

      if (!userPage) {
        return NextResponse.json({
          ok: false,
          error: `학번(${cleanStudentNum})과 이름(${cleanName})이 일치하는 학생 계정을 찾을 수 없습니다. 새 계정 만들기를 먼저 진행해 주세요.`,
        }, { status: 404 });
      }

      const props = userPage.properties;
      const storedPin = props['PIN']?.rich_text?.[0]?.plain_text || '0000';

      if (storedPin !== cleanPin) {
        return NextResponse.json({
          ok: false,
          error: '비밀번호(PIN)가 일치하지 않습니다. 기억나지 않으시면 담당 선생님께 비밀번호 초기화를 요청하세요.',
        }, { status: 401 });
      }

      // 소속 학급 정보 조회
      const classRelation = props['소속학급']?.relation;
      let classInfo: any = null;
      if (classRelation && classRelation.length > 0) {
        classInfo = await findClassById(classRelation[0].id);
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: userPage.id,
          nickname: cleanName,
          role: 'student',
          studentNumber: cleanStudentNum,
          pin: cleanPin,
          classId: classInfo?.id || '',
          className: classInfo?.name || '',
          classCode: classInfo?.code || '',
        },
      });
    }

    // ==========================================
    // 2. 교사 로그인: 이름 + PIN
    // ==========================================
    if (role === 'teacher') {
      const queryRes = await notion.databases.query({
        database_id: USER_DB_ID,
        filter: {
          property: '닉네임',
          title: { equals: cleanName },
        },
        page_size: 1,
      });

      if (queryRes.results.length === 0) {
        return NextResponse.json({
          ok: false,
          error: `선생님(${cleanName}) 이름으로 등록된 계정을 찾을 수 없습니다. '새 계정 만들기'를 먼저 진행해 주세요.`,
        }, { status: 404 });
      }

      const userPage: any = queryRes.results[0];
      const props = userPage.properties;
      const storedPin = props['PIN']?.rich_text?.[0]?.plain_text || '0000';

      if (storedPin && cleanPin && storedPin !== cleanPin) {
        return NextResponse.json({
          ok: false,
          error: '비밀번호(PIN)가 일치하지 않습니다. 다시 확인해 주세요.',
        }, { status: 401 });
      }

      // 소속 학급 정보 확인
      const classRelation = props['소속학급']?.relation;
      let classInfo: any = null;
      if (classRelation && classRelation.length > 0) {
        classInfo = await findClassById(classRelation[0].id);
      }

      return NextResponse.json({
        ok: true,
        user: {
          id: userPage.id,
          nickname: cleanName,
          role: 'teacher',
          pin: cleanPin,
          classId: classInfo?.id || '',
          className: classInfo?.name || '',
          classCode: classInfo?.code || '',
        },
      });
    }

    return NextResponse.json({ ok: false, error: '유효한 역할을 지정해 주세요.' }, { status: 400 });
  } catch (error: any) {
    console.error('로그인 처리 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
