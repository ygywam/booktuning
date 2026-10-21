import { NextResponse } from 'next/server';
// 기존: import { notion } from '@/lib/notion';
import { notion } from '../../../lib/notion';

export async function POST(request: Request) {
  try {
    const { bookTitle, author, readingLogs, pageLogs, notionPageId } = await request.json();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ ok: false, error: '서버에 GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const readingSummary = (readingLogs || [])
      .map((l: any) => `[진도/감정] 날짜:${l.readDate}, 누적:${l.readPages}쪽 - "${l.note}"`)
      .join('\n');
    const pageSummary = (pageLogs || [])
      .map((l: any) => `[발췌/인사이트] ${l.page}쪽 - "${l.notes}"`)
      .join('\n');

    const prompt = `너는 이 책을 정독하고 메모를 남긴 '독자 본인'이야.
아래 기록을 융합하여 '나만의 독서 감상문'을 작성해줘.

[도서명]: ${bookTitle}
[저자]: ${author}
[진도 및 감정]:
${readingSummary || '없음'}
[발췌 및 인사이트]:
${pageSummary || '없음'}

지침: 1인칭 주인공 어조 확립, 제3자 말투 금지, 마크다운 기호 금지. 빈 줄(엔터)만 사용.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) throw new Error(`Gemini API 통신 오류 (${res.status})`);

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 노션 해당 도서 페이지에 감상문 블록 추가
    if (notionPageId && generatedText) {
      const paragraphs = generatedText.split('\n').filter((p: string) => p.trim() !== '');
      const blocks = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '✨ Gemini AI 감상문' } }],
            color: 'blue_background',
          },
        },
        ...paragraphs.map((p: string) => ({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: p.substring(0, 1999) } }] },
        })),
      ];

      await notion.blocks.children.append({
        block_id: notionPageId,
        children: blocks as any,
      });
    }

    return NextResponse.json({ ok: true, aiReport: generatedText });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}