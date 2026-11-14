export type AiProvider = 'gemini' | 'exaone';

// AI 모델 상수 일원화 관리 (환경변수로 재정의 가능)
export const AI_MODELS = {
  gemini: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  exaone: process.env.EXAONE_MODEL || 'k-exaone_v2.5',
  exaoneVision: process.env.EXAONE_VISION_MODEL || '',
} as const;

// EXAONE API 기본 엔드포인트 (OpenAI 호환 규격)
export const EXAONE_API_BASE_URL = (
  process.env.EXAONE_API_BASE_URL || 'https://api.exaone.ai/v1'
).replace(/\/+$/, '');

export function normalizeAiProvider(provider?: string | null): AiProvider {
  return provider === 'exaone' ? 'exaone' : 'gemini';
}

export function getAiDisplayName(provider: AiProvider): string {
  return provider === 'exaone' ? 'LG EXAONE' : 'Google Gemini';
}

export function getAiStatusSummary() {
  return {
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    exaoneConfigured: Boolean(process.env.EXAONE_API_KEY),
    geminiModel: AI_MODELS.gemini,
    exaoneModel: AI_MODELS.exaone,
    exaoneVisionSupported: Boolean(AI_MODELS.exaoneVision),
  };
}

/**
 * 추론 모델이 출력할 수 있는 <thought>...</thought> 태그 블록 제거
 */
function stripThinkingTags(text: string): string {
  return text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
}

/**
 * 단일 모델로 Gemini 텍스트 생성 시도 (503/429 시 1회 지수 백오프 재시도 포함)
 */
async function tryGeminiModelOnce(
  modelName: string,
  prompt: string,
  geminiKey: string
): Promise<{ text: string } | { shouldFallback: boolean; error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      return { text };
    }

    const errText = await res.text();

    // 503(Service Unavailable / High Demand) 또는 일시적 429: 1차 실패 시 1.5초 대기 후 재시도
    if ((res.status === 503 || res.status === 429) && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }

    // 402 선불 크레딧 소진
    if (
      res.status === 402 ||
      errText.includes('prepayment credits are depleted') ||
      errText.includes('RESOURCE_EXHAUSTED')
    ) {
      throw new Error(
        'Google AI Studio 선불 크레딧이 소진되었습니다 (HTTP 402).\n\n' +
        '해결 방법:\n' +
        '1. Google AI Studio(https://aistudio.google.com/app/apikey) 접속\n' +
        '2. 결제 계정(Billing)이 연결되지 않은 완전 무료(Free of charge) 프로젝트를 선택하거나 신규 생성\n' +
        '3. 새 무료 API 키를 발급받아 Vercel 환경변수 GEMINI_API_KEY에 교체 등록 후 재배포해 주세요.'
      );
    }

    // 503 과부하 또는 404 모델 만료: 다음 폴백 모델로 넘길 수 있도록 플래그 반환
    if (
      res.status === 503 ||
      res.status === 404 ||
      errText.includes('high demand') ||
      errText.includes('is no longer available')
    ) {
      return { shouldFallback: true, error: `[${modelName} (${res.status})] ${errText}` };
    }

    throw new Error(`Gemini API 통신 오류 (${res.status}): ${errText}`);
  }

  return { shouldFallback: true, error: `[${modelName}] 재시도 실패` };
}

/**
 * Gemini 텍스트 생성 호출 (주 모델 + 폴백 모델 체인 & 지수 백오프)
 */
async function callGeminiText(prompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('서버 환경변수에 GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  // 주 모델 및 폴백 모델 후보 체인
  const candidateModels = Array.from(
    new Set([AI_MODELS.gemini, 'gemini-3.7-flash', 'gemini-3.8-flash'].filter(Boolean))
  );

  let lastFallbackError = '';

  for (const modelName of candidateModels) {
    const result = await tryGeminiModelOnce(modelName, prompt, geminiKey);
    if ('text' in result) {
      return result.text;
    }
    lastFallbackError = result.error;
    console.warn(`Gemini 모델 ${modelName} 호출 실패(폴백 진행):`, result.error);
  }

  // 모든 후보 모델이 503 등으로 실패한 경우 친절한 안내 제공
  throw new Error(
    '구글 AI 서버에 전 세계 이용자 트래픽이 일시적으로 집중되었습니다 (HTTP 503 일시적 과부하).\n\n' +
    '구글 데이터센터의 일시적인 혼잡 현상이므로 약 10~30초 후 다시 시도해 주시거나, [설정]에서 LG EXAONE을 선택해 보세요.\n' +
    `(상세: ${lastFallbackError.slice(0, 150)})`
  );
}

/**
 * LG EXAONE 텍스트 생성 호출 (OpenAI 호환 chat/completions, 최대 2회 백오프 재시도)
 */
async function callExaoneText(prompt: string): Promise<string> {
  const exaoneKey = process.env.EXAONE_API_KEY;
  if (!exaoneKey) {
    throw new Error(
      'LG EXAONE API 키(EXAONE_API_KEY)가 Vercel 환경변수에 설정되지 않았습니다.\n설정에서 Google Gemini를 선택하시거나 Vercel에 EXAONE_API_KEY를 등록해 주세요.'
    );
  }

  const url = `${EXAONE_API_BASE_URL}/chat/completions`;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${exaoneKey}`,
      },
      body: JSON.stringify({
        model: AI_MODELS.exaone,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content || '';
      return stripThinkingTags(rawContent);
    }

    const errText = await res.text();

    // 429 Rate Limit 발생 시 1회차면 2초 대기 후 자동 재시도
    if (res.status === 429 && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    if (res.status === 429) {
      let detail = '';
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.error?.message || parsed.message || '';
      } catch {
        detail = errText.slice(0, 150);
      }
      throw new Error(
        `EXAONE API 호출 한도(429 Too Many Requests)에 도달했습니다.\n\n` +
        `이유: EXAONE 연구용 무료 티어는 분당 요청 수(RPM 1~3회) 및 일일 쿼터가 엄격히 제한되어 있습니다.\n` +
        (detail ? `서버 응답: ${detail}\n\n` : '\n') +
        `해결: 약 1~2분 후 다시 시도해 주시거나, 안정적인 생성을 위해 [설정]에서 Google Gemini를 선택해 보세요.`
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error('EXAONE API 인증 실패: 유효하지 않은 API 키이거나 접근 권한이 없습니다.');
    }
    if (res.status === 404) {
      throw new Error(`EXAONE API 엔드포인트 또는 모델(${AI_MODELS.exaone})을 찾을 수 없습니다. (404)`);
    }
    throw new Error(`EXAONE API 통신 오류 (${res.status}): ${errText}`);
  }

  throw new Error('EXAONE API 호출에 실패했습니다.');
}

/**
 * 선택된 AI 엔진(Gemini 또는 EXAONE)으로 텍스트 생성
 */
export async function generateTextWithAI(params: {
  provider?: string | null;
  prompt: string;
}): Promise<{ text: string; provider: AiProvider }> {
  const provider = normalizeAiProvider(params.provider);
  const text =
    provider === 'exaone'
      ? await callExaoneText(params.prompt)
      : await callGeminiText(params.prompt);

  return { text, provider };
}

/**
 * Gemini 비전 OCR 호출
 */
async function callGeminiVisionOcr(params: {
  prompt: string;
  mimeType: string;
  rawBase64: string;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
        `Gemini Vision OCR 모델(${AI_MODELS.gemini}) 만료 (404). 최신 gemini-3.8-flash로 갱신되었습니다.`
      );
    }
    throw new Error(`Gemini OCR 통신 오류 (${res.status}): ${errText}`);
  }

  throw new Error('Gemini OCR 호출에 실패했습니다.');
}

/**
 * EXAONE 비전 OCR 호출 (EXAONE_VISION_MODEL이 설정된 경우)
 */
async function callExaoneVisionOcr(params: {
  prompt: string;
  mimeType: string;
  rawBase64: string;
}): Promise<string> {
  const exaoneKey = process.env.EXAONE_API_KEY;
  if (!exaoneKey) {
    throw new Error('EXAONE_API_KEY가 설정되지 않았습니다.');
  }

  const dataUrl = `data:${params.mimeType};base64,${params.rawBase64}`;
  const url = `${EXAONE_API_BASE_URL}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exaoneKey}`,
    },
    body: JSON.stringify({
      model: AI_MODELS.exaoneVision,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: params.prompt },
          ],
        },
      ],
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`EXAONE OCR 통신 오류 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  return stripThinkingTags(rawContent);
}

/**
 * 이미지 텍스트 인식(OCR) 수행
 * - k-exaone_v2.5는 텍스트 전용이므로, 별도 EXAONE_VISION_MODEL이 없으면 Gemini Vision으로 자동 보완
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
  const requested = normalizeAiProvider(params.provider);

  if (requested === 'exaone') {
    if (AI_MODELS.exaoneVision && process.env.EXAONE_API_KEY) {
      const ocrText = await callExaoneVisionOcr({
        prompt: params.prompt,
        mimeType: params.mimeType,
        rawBase64: params.rawBase64,
      });
      return { ocrText, usedProvider: 'exaone', fallbackUsed: false };
    }

    // 텍스트 전용 EXAONE 모델 선택 시 Gemini 키가 있으면 이미지 인식 자동 보완
    if (process.env.GEMINI_API_KEY) {
      const ocrText = await callGeminiVisionOcr({
        prompt: params.prompt,
        mimeType: params.mimeType,
        rawBase64: params.rawBase64,
      });
      return { ocrText, usedProvider: 'gemini', fallbackUsed: true };
    }

    throw new Error(
      '현재 EXAONE(k-exaone_v2.5)은 텍스트 전용 모델이며, 이미지 OCR 보조용 GEMINI_API_KEY도 설정되어 있지 않습니다.'
    );
  }

  const ocrText = await callGeminiVisionOcr({
    prompt: params.prompt,
    mimeType: params.mimeType,
    rawBase64: params.rawBase64,
  });
  return { ocrText, usedProvider: 'gemini', fallbackUsed: false };
}
