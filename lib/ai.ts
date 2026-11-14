export type AiProvider = 'gemini';

// Google Gemini AI 모델 상수 (환경변수로 재정의 가능)
export const AI_MODELS = {
  gemini: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
} as const;

export function normalizeAiProvider(provider?: string | null): AiProvider {
  return 'gemini';
}

export function getAiDisplayName(provider?: string | null): string {
  return 'Google Gemini';
}

export function getAiStatusSummary() {
  return {
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: AI_MODELS.gemini,
  };
}

/**
 * Gemini 비전 OCR 호출 (503/429 시 1회 지수 백오프 재시도 포함)
 */
export async function callGeminiVisionOcr(params: {
  prompt: string;
  mimeType: string;
  rawBase64: string;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('서버 환경변수에 GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODELS.gemini}:generateContent?key=${geminiKey}`;
  const payload = {
    contents: [
      {
        parts: [
          { text: params.prompt },
          {
            inline_data: {
              mime_type: params.mimeType,
              data: params.rawBase64,
            },
          },
        ],
      },
    ],
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    }

    const errText = await res.text();

    if ((res.status === 503 || res.status === 429) && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    if (
      res.status === 402 ||
      errText.includes('prepayment credits are depleted') ||
      errText.includes('RESOURCE_EXHAUSTED')
    ) {
      throw new Error(
        'Google AI Studio 선불 크레딧 소진(402): 결제 계정 없는 완전 무료 티어 새 API 키를 Vercel GEMINI_API_KEY에 등록해 주세요.'
      );
    }
    if (res.status === 503 || errText.includes('high demand')) {
      throw new Error(
        '구글 AI 비전 서버가 일시적인 이용량 급증(503 과부하) 상태입니다. 약 10~30초 후 다시 시도해 주세요.'
      );
    }
    if (res.status === 404 || errText.includes('is no longer available')) {
      throw new Error(
        `Gemini Vision OCR 모델(${AI_MODELS.gemini}) 만료 (404). 최신 gemini-3.7-flash로 갱신되었습니다.`
      );
    }
    throw new Error(`Gemini OCR 통신 오류 (${res.status}): ${errText}`);
  }

  throw new Error('Gemini OCR 호출에 실패했습니다.');
}

/**
 * 이미지 텍스트 인식(OCR) 수행 (Google Gemini 단일화)
 */
export async function extractOcrWithAI(params: {
  provider?: string | null;
  prompt: string;
  mimeType: string;
  rawBase64: string;
}): Promise<{
  ocrText: string;
  usedProvider: AiProvider;
  fallbackUsed: boolean;
}> {
  const ocrText = await callGeminiVisionOcr({
    prompt: params.prompt,
    mimeType: params.mimeType,
    rawBase64: params.rawBase64,
  });
  return { ocrText, usedProvider: 'gemini', fallbackUsed: false };
}

/**
 * 레거시 호환용 함수 (AI 감상문 비활성화 안내)
 */
export async function generateTextWithAI(params: {
  provider?: string | null;
  prompt: string;
}): Promise<{ text: string; provider: AiProvider }> {
  return {
    text: '',
    provider: 'gemini',
  };
}
