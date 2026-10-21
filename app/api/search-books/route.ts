import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ ok: false, error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;

  if (!kakaoKey) {
    return NextResponse.json({ ok: false, error: '서버에 KAKAO_REST_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const isIsbn = /^[0-9Xx-]{10,17}$/.test(query.replace(/\s/g, ''));
    const cleanQuery = query.replace(/-/g, '');
    const url = isIsbn
      ? `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(cleanQuery)}`
      : `https://dapi.kakao.com/v3/search/book?target=title&query=${encodeURIComponent(query)}&size=10`;

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${kakaoKey}` },
    });

    if (!res.ok) throw new Error(`카카오 API 통신 에러 (${res.status})`);

    const data = await res.json();
    const books = (data.documents || []).map((item: any) => ({
      externalId: item.isbn || '',
      isbn: (item.isbn || '').split(' ')[0],
      title: item.title || '',
      author: (item.authors || []).join(', '),
      publisher: item.publisher || '',
      totalPages: 0,
      coverUrl: item.thumbnail || '',
      source: 'Kakao API',
      description: item.contents || '',
    }));

    return NextResponse.json({ ok: true, books });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}