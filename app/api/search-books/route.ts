import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 국립중앙도서관(NL) 서지정보 API를 통한 전체 페이지수 자동 파싱
async function fetchTotalPagesFromNL(isbn: string, nlKey?: string): Promise<number> {
  if (!isbn || !nlKey) return 0;
  const cleanIsbn = String(isbn).replace(/[^0-9X]/gi, '').trim();
  if (!cleanIsbn) return 0;

  try {
    const url = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(nlKey)}&result_style=json&page_no=1&page_size=5&isbn=${encodeURIComponent(cleanIsbn)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return 0;

    const data = await res.json();
    const docs = data.docs || data.item || [];

    for (let i = 0; i < docs.length; i++) {
      const pageStr = docs[i].PAGE || docs[i].page || '';
      if (pageStr) {
        const numbers = String(pageStr).match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const numList = numbers.map(Number).filter((n) => n >= 5);
          if (numList.length > 0) return Math.max(...numList);
          return parseInt(numbers[0], 10);
        }
      }
    }
  } catch (e) {
    console.warn('국립중앙도서관 쪽수 조회 건너뜀:', e);
  }
  return 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const targetIsbn = searchParams.get('isbn');

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  const nlKey = process.env.NL_API_KEY;

  // 1. 단일 도서 쪽수 상세 조회 요청인 경우
  if (targetIsbn) {
    const pages = await fetchTotalPagesFromNL(targetIsbn, nlKey);
    return NextResponse.json({ ok: true, totalPages: pages });
  }

  if (!query) {
    return NextResponse.json({ ok: false, error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

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
    const rawDocuments = data.documents || [];

    // 검색된 도서들에 대해 비동기 병렬로 국립중앙도서관 쪽수 조회
    const books = await Promise.all(
      rawDocuments.map(async (item: any) => {
        const firstIsbn = (item.isbn || '').split(' ')[0] || '';
        let totalPages = 0;

        // 국립중앙도서관 키가 있으면 첫 번째 도서 또는 정확한 매칭 도서의 쪽수를 비동기 조회
        if (firstIsbn && nlKey) {
          totalPages = await fetchTotalPagesFromNL(firstIsbn, nlKey);
        }

        return {
          externalId: item.isbn || '',
          isbn: firstIsbn,
          title: item.title || '',
          author: (item.authors || []).join(', '),
          publisher: item.publisher || '',
          totalPages,
          coverUrl: item.thumbnail || '',
          source: 'Kakao API',
          description: item.contents || '',
        };
      })
    );

    return NextResponse.json({ ok: true, books });
  } catch (error: any) {
    console.error('도서 검색 에러:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
