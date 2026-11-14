import { NextResponse } from 'next/server';
import { notion, USER_DB_ID, CLASS_DB_ID, findClassByCode } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, pin, studentNumber, classCode, teacherSecretCode } = body;

    const cleanName = String(name || '').trim();
    const cleanPin = String(pin || '').trim();

    if (!cleanName) {
      return NextResponse.json({ ok: false, error: '이름을 입력해 주세요.' }, { status: 400 });
    }
    if (!cleanPin || cleanPin.length < 4) {
      return NextResponse.json({ ok: false, error: '4자리 비밀번호(PIN)를 입력해 주세요.' }, { status: 400 });
    }

    // ==========================================
    // 1. 학생 가입 로직 (학급 코드 검증 필수)
    // ==========================================
    if (role === 'student') {
      const cleanStudentNum = String(studentNumber || '').trim();
      const cleanClassCode = String(classCode || '').trim().toUpperCase();

      if (!cleanStudentNum) {
        return NextResponse.json({ ok: false, error: '학번을 입력해 주세요.' }, { status: 400 });
      }
      if (!cleanClassCode) {
        return NextResponse.json({ ok: false, error: '선생님께 전달받은 학급 인증코드를 입력해 주세요.' }, { status: 400 });
      }

      // 학급 DB 존재 여부 및 유효한 학급 코드인지 검증
      const classroom = await findClassByCode(cleanClassCode);
      if (!classroom) {
        return NextResponse.json({
          ok: false,
          error: '존재하지 않거나 유효하지 않은 학급 인증코드입니다. 선생님께 정확한 코드를 다시 확인해 주세요.',
        }, { status: 400 });
      }

      if (!USER_DB_ID) {
        // 로컬 테스트 모드 fallback
        return NextResponse.json({
          ok: true,
          user: {
            id: `student_${Date.now()}`,
            nickname: cleanName,
            role: 'student',
            studentNumber: cleanStudentNum,
            pin: cleanPin,
            classId: classroom.id,
            className: classroom.name,
            classCode: classroom.code,
          },
        });
      }

      // 같은 학급 내에 동일한 학번의 학생이 이미 등록되어 있는지 확인
      try {
        const dupCheck = await notion.databases.query({
          database_id: USER_DB_ID,
          filter: {
            and: [
              {
                property: '학번',
                rich_text: { equals: cleanStudentNum },
              },
              {
                property: '소속학급',
                relation: { contains: classroom.id },
              },
            ],
          },
          page_size: 1,
        });

        if (dupCheck.results.length > 0) {
          return NextResponse.json({
            ok: false,
            error: `학번(${cleanStudentNum})으로 이미 등록된 학생 계정이 존재합니다. 로그인 화면을 이용해 주세요.`,
          }, { status: 400 });
        }
      } catch (e: any) {
        // 만약 노션 DB에 '학번'이나 '소속학급' 속성이 아직 없을 경우의 하위 호환 안전 처리
        console.warn('중복 검사 필터 경고 (속성 확인 필요):', e.message);
      }

      // 학생 페이지 생성
      const userProperties: any = {
        '닉네임': { title: [{ text: { content: `${cleanName} (${cleanStudentNum})` } }] },
        'PIN': { rich_text: [{ text: { content: cleanPin } }] },
      };

      // 안전하게 선택적 속성 주입
      try {
        userProperties['역할'] = { select: { name: 'student' } };
      } catch {}
      try {
        userProperties['학번'] = { rich_text: [{ text: { content: cleanStudentNum } }] };
      } catch {}
      try {
        userProperties['소속학급'] = { relation: [{ id: classroom.id }] };
      } catch {}

      const newPage = await notion.pages.create({
        parent: { database_id: USER_DB_ID },
        properties: userProperties,
      });

      return NextResponse.json({
        ok: true,
        user: {
          id: newPage.id,
          nickname: cleanName,
          role: 'student',
          studentNumber: cleanStudentNum,
          pin: cleanPin,
          classId: classroom.id,
          className: classroom.name,
          classCode: classroom.code,
        },
      });
    }

    // ==========================================
    // 2. 교사 가입 로직 (교사 마스터코드 검증)
    // ==========================================
    if (role === 'teacher') {
      const serverTeacherSecret = process.env.TEACHER_SECRET_CODE?.trim();
      const inputSecret = String(teacherSecretCode || '').trim();

      // 교사 시크릿 코드가 환경변수에 설정되어 있다면 반드시 대조
      if (serverTeacherSecret && inputSecret !== serverTeacherSecret) {
        return NextResponse.json({
          ok: false,
          error: '교사 인증코드가 일치하지 않습니다. 올바른 인증코드를 입력해 주세요.',
        }, { status: 401 });
      }

      if (!USER_DB_ID) {
        return NextResponse.json({
          ok: true,
          user: {
            id: `teacher_${Date.now()}`,
            nickname: cleanName,
            role: 'teacher',
            pin: cleanPin,
          },
        });
      }

      // 동일한 이름의 교사 계정 존재 여부 확인
      const dupTeacher = await notion.databases.query({
        database_id: USER_DB_ID,
        filter: {
          property: '닉네임',
          title: { equals: cleanName },
        },
        page_size: 1,
      });

      if (dupTeacher.results.length > 0) {
        return NextResponse.json({
          ok: false,
          error: `선생님(${cleanName}) 이름으로 이미 등록된 계정이 있습니다. 로그인 화면을 이용해 주세요.`,
        }, { status: 400 });
      }

      const teacherProps: any = {
        '닉네임': { title: [{ text: { content: cleanName } }] },
        'PIN': { rich_text: [{ text: { content: cleanPin } }] },
      };
      try {
        teacherProps['역할'] = { select: { name: 'teacher' } };
      } catch {}

      const newTeacherPage = await notion.pages.create({
        parent: { database_id: USER_DB_ID },
        properties: teacherProps,
      });

      return NextResponse.json({
        ok: true,
        user: {
          id: newTeacherPage.id,
          nickname: cleanName,
          role: 'teacher',
          pin: cleanPin,
        },
      });
    }

    return NextResponse.json({ ok: false, error: '유효한 역할을 지정해 주세요 (student 또는 teacher).' }, { status: 400 });
  } catch (error: any) {
    console.error('계정 등록 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
