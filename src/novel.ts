// 엔딩 소설. 서버(/api/novel)에서 스트리밍으로 받고, 실패하면 템플릿 소설로 대체한다.
import { CONFIG } from './config.ts';
import { STAGES } from './data/stages.ts';
import type { Ending } from './endings.ts';
import type { NovelRequest, RunState } from './types.ts';

/** API 없이 log를 단계별 문단으로 엮은 대체 소설 */
export function templateNovel(run: RunState, ending: Ending): string {
  const paragraphs: string[] = [ending.title];
  STAGES.forEach((s, i) => {
    const logs = run.history.filter((h) => h.stage === i).map((h) => h.log);
    if (logs.length) paragraphs.push(`[${s.name}]\n${logs.join(' ')}`);
  });
  paragraphs.push(ending.closing);
  return paragraphs.join('\n\n');
}

export function buildRequest(run: RunState, ending: Ending): NovelRequest {
  return {
    history: run.history.map(({ stage, title, choice, log, delta }) => ({ stage, title, choice, log, delta })),
    stats: run.stats,
    flags: run.flags,
    end: run.end ?? 'natural',
    ending: ending.title,
  };
}

/**
 * 소설을 스트리밍으로 받는다. 조각이 올 때마다 onText를 호출하고, 완성된 전문을 돌려준다.
 * 서버가 준비되지 않았거나(501) 실패하면 예외를 던진다 → 호출 측에서 템플릿으로 대체.
 */
export async function streamNovel(
  req: NovelRequest,
  onText: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(CONFIG.NOVEL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `소설 서버 응답 ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    onText(chunk);
  }
  text += decoder.decode();

  // 서버는 생성 도중 실패하면 이 표식을 붙이고 스트림을 닫는다
  const marker = text.lastIndexOf('\u0000ERROR:');
  if (marker !== -1) throw new Error(text.slice(marker + 7));
  return text;
}
