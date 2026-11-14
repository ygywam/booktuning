import { NextResponse } from 'next/server';
import { notion } from '../../../lib/notion';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetPageId = body.targetId || body.pageId || body.bookId || body.id || body.logId || body.insightId;
    const nickname = body.nickname?.trim();

    if (!targetPageId || !nickname) {
      return NextResponse.json({ ok: false, error: '대상 ID와 닉네임이 필요합니다.' }, { status: 400 });
    }

    // 1. 해당 노션 페이지 정보 조회 (도서, 독서일지, 문장수집 공통 지원)
    const page: any = await notion.pages.retrieve({ page_id: targetPageId });
    const props = page.properties;

    const rawLikesStr = props['공감한 사람']?.rich_text?.[0]?.plain_text || '';
    let likedUsers = rawLikesStr
      ? rawLikesStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const existingIndex = likedUsers.indexOf(nickname);
    let hasLiked = false;

    if (existingIndex > -1) {
      // 이미 좋아요 누른 상태 -> 좋아요 취소
      likedUsers.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      // 좋아요 추가
      likedUsers.push(nickname);
      hasLiked = true;
    }

    const newLikesStr = likedUsers.join(', ');
    const newLikesCount = likedUsers.length;

    // 2. 노션 페이지 업데이트 (공감수 + 공감한 사람)
    const updateProperties: any = {};
    if (props['공감수'] !== undefined) {
      updateProperties['공감수'] = { number: newLikesCount };
    }
    if (props['공감한 사람'] !== undefined) {
      updateProperties['공감한 사람'] = { rich_text: [{ text: { content: newLikesStr } }] };
    }

    // 만약 DB에 둘 다 아직 명시적으로 정의되지 않은 경우 기본 속성명으로 시도
    if (Object.keys(updateProperties).length === 0) {
      updateProperties['공감수'] = { number: newLikesCount };
      updateProperties['공감한 사람'] = { rich_text: [{ text: { content: newLikesStr } }] };
    }

    try {
      await notion.pages.update({
        page_id: targetPageId,
        properties: updateProperties,
      });
    } catch (updateErr: any) {
      // '공감수' 속성 오류 시 '공감한 사람' 단독 시도
      if (updateProperties['공감수']) {
        delete updateProperties['공감수'];
        try {
          await notion.pages.update({
            page_id: targetPageId,
            properties: updateProperties,
          });
        } catch (subErr: any) {
          console.warn('공감 노션 저장 실패 (노션 DB 속성 확인 필요):', subErr.message);
          return NextResponse.json({
            ok: false,
            error: `노션 DB에 '공감수'(숫자)와 '공감한 사람'(텍스트) 속성이 필요합니다. (${subErr.message})`,
          }, { status: 400 });
        }
      } else {
        throw updateErr;
      }
    }

    return NextResponse.json({
      ok: true,
      hasLiked,
      likes: newLikesCount,
      likedUsers,
    });
  } catch (error: any) {
    console.error('공감(좋아요) 토글 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
