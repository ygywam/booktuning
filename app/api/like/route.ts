import { NextResponse } from 'next/server';
import { notion } from '../../../lib/notion';

export async function POST(request: Request) {
  try {
    const { bookId, nickname } = await request.json();

    if (!bookId || !nickname) {
      return NextResponse.json({ ok: false, error: '도서 ID와 닉네임이 필요합니다.' }, { status: 400 });
    }

    // 1. 해당 도서 페이지 정보 조회
    const page: any = await notion.pages.retrieve({ page_id: bookId });
    const props = page.properties;

    const rawLikesStr = props['공감한 사람']?.rich_text[0]?.plain_text || '';
    let likedUsers = rawLikesStr
      ? rawLikesStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const existingIndex = likedUsers.indexOf(nickname.trim());
    let hasLiked = false;

    if (existingIndex > -1) {
      // 이미 좋아요 누른 상태 -> 좋아요 취소
      likedUsers.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      // 좋아요 추가
      likedUsers.push(nickname.trim());
      hasLiked = true;
    }

    const newLikesStr = likedUsers.join(', ');
    const newLikesCount = likedUsers.length;

    // 2. 노션 페이지 업데이트
    await notion.pages.update({
      page_id: bookId,
      properties: {
        '공감수': { number: newLikesCount },
        '공감한 사람': { rich_text: [{ text: { content: newLikesStr } }] },
      },
    });

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
