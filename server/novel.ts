// POST /api/novel: 한 판의 기록을 받아 Claude로 생애 소설을 쓰고, 텍스트 조각을 그대로 스트리밍한다.
// 프롬프트는 서버에서만 조립한다. 클라이언트는 구조화된 기록만 보내므로, 공개 배포 시에도
// 이 엔드포인트가 임의 프롬프트 실행 통로가 되지 않는다.
import type { IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { FLAGS, type FlagName } from '../src/data/flags.ts';
import { STAGES } from '../src/data/stages.ts';
import type { EndReason, NovelRequest } from '../src/types.ts';

const DEFAULT_MODEL = 'claude-opus-5-5';
const MAX_BODY = 200_000;
/** 스트림 도중 실패를 알리는 표식. 클라이언트(src/novel.ts)가 이 뒤의 문구를 오류로 읽는다. */
const ERROR_MARKER = '\u0000ERROR:';

const SYSTEM_PROMPT = `당신은 한국 현대 소설가입니다. 한 사람의 생애 기록을 받아, 그 사람의 일생을 담은 단편소설 한 편을 씁니다.

기록에 대하여
- 기록은 "인생기록부"라는 게임에서 플레이어가 고른 선택들입니다. 각 줄의 문장은 그 시기에 실제로 일어난 일입니다.
- 모든 사건을 빠짐없이 나열할 필요는 없습니다. 이 사람의 삶을 관통하는 줄기를 찾아, 중요한 장면은 깊게, 나머지는 짧게 다루세요.
- 기록에 없는 큰 사건(결혼, 죽음, 큰 성공 등)을 지어내지 마세요. 장면의 감각, 대사, 주변 인물의 표정 같은 살은 자유롭게 붙여도 됩니다.
- 앞에서 나온 일이 뒤에서 다시 울리면(어릴 적 약속과 재회, 어머니의 꿈과 자식의 재능 등) 그 연결을 살리세요.
- 스탯 수치는 인물의 상태를 짐작하는 참고일 뿐입니다. 숫자나 게임 용어(LP, 스탯, 플레이어, 선택지)는 본문에 쓰지 마세요.

쓰는 방식
- 3인칭. 주인공에게 시대와 집안에 어울리는 한국 이름을 하나 지어 주세요.
- 담백하고 절제된 문장. 감정을 설명하기보다 장면과 행동으로 보여 주세요.
- 분량은 공백 포함 3,000~5,000자.
- 결말은 주어진 엔딩의 정서와 맞추세요. 생이 일찍 끝났다면 그 시점에서 끝냅니다.

출력 형식
- 첫 줄에 소설 제목만 씁니다. (따옴표, 기호, 마크다운 없이)
- 한 줄을 비우고 본문을 씁니다. 문단은 빈 줄로 나눕니다.
- 제목과 본문 외의 말(머리말, 해설, 맺음말)은 쓰지 마세요.`;

const END_TEXT: Record<EndReason, string> = {
  natural: '노년까지 살아 생을 마쳤다 (천수)',
  death: '몸이 버티지 못해 생이 끝났다 (사망)',
  collapse: '삶을 지탱할 행복이 바닥나 무너졌다',
};

class BadRequest extends Error {}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new BadRequest('요청이 너무 큽니다'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const str = (v: unknown, max: number): string => {
  if (typeof v !== 'string') throw new BadRequest('문자열 필드 오류');
  return v.slice(0, max);
};
const num = (v: unknown): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new BadRequest('숫자 필드 오류');
  return Math.round(v);
};

/** 클라이언트가 보낸 기록을 검증하고 필요한 필드만 남긴다. */
function parseRequest(raw: string): NovelRequest {
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new BadRequest('JSON 형식 오류');
  }
  if (!Array.isArray(body?.history) || body.history.length === 0 || body.history.length > 120) {
    throw new BadRequest('history 오류');
  }
  const history = body.history.map((h: any) => {
    const stage = num(h?.stage);
    if (stage < 0 || stage >= STAGES.length) throw new BadRequest('stage 범위 오류');
    const delta: Record<string, number> = {};
    for (const k of ['lp', 'int', 'hp', 'mind', 'money']) if (h.delta?.[k] !== undefined) delta[k] = num(h.delta[k]);
    return { stage, title: str(h.title, 60), choice: str(h.choice, 80), log: str(h.log, 200), delta };
  });
  const s = body.stats ?? {};
  const stats = { lp: num(s.lp), int: num(s.int), hp: num(s.hp), mind: num(s.mind), money: num(s.money) };
  const flags = (Array.isArray(body.flags) ? body.flags : []).filter((f: unknown): f is FlagName =>
    typeof f === 'string' && f in FLAGS,
  );
  const end: EndReason = ['natural', 'death', 'collapse'].includes(body.end) ? body.end : 'natural';
  return { history, stats, flags, end, ending: str(body.ending ?? '', 40) };
}

function buildUserMessage(r: NovelRequest): string {
  const lines: string[] = ['# 생애 기록', ''];
  STAGES.forEach((s, i) => {
    const items = r.history.filter((h) => h.stage === i);
    if (!items.length) return;
    lines.push(`## ${s.name} (${s.age})`);
    for (const h of items) lines.push(`- ${h.log}`);
    lines.push('');
  });
  if (r.flags.length) {
    lines.push('# 인물 배경 요약');
    for (const f of r.flags) lines.push(`- ${FLAGS[f]}`);
    lines.push('');
  }
  const st = r.stats;
  lines.push(
    '# 생의 끝 무렵 상태 (참고용, 0~100)',
    `행복 ${st.lp} · 지성 ${st.int} · 건강 ${st.hp} · 정신력 ${st.mind} · 재산 ${st.money >= 30 ? '넉넉함' : st.money >= 0 ? '보통' : '빚이 있음'}`,
    '',
    '# 결말',
    `${END_TEXT[r.end]}. 엔딩 이름: "${r.ending}"`,
  );
  return lines.join('\n');
}

/** 개발 중 API 비용 없이 스트리밍 화면을 확인하기 위한 가짜 소설 (NOVEL_MOCK=1) */
async function streamMock(r: NovelRequest, res: ServerResponse): Promise<void> {
  const text = ['시험용 소설', '', ...r.history.map((h) => h.log), '', `(${r.ending} · NOVEL_MOCK 모드)`].join('\n');
  for (let i = 0; i < text.length; i += 6) {
    if (res.destroyed) return;
    res.write(text.slice(i, i + 6));
    await new Promise((ok) => setTimeout(ok, 15));
  }
}

async function streamClaude(r: NovelRequest, res: ServerResponse): Promise<void> {
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: process.env.NOVEL_MODEL || DEFAULT_MODEL,
    max_tokens: 16000,
    // 정책 거절 시 서버 측에서 권장 모델로 자동 재시도
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(r) }],
  });
  res.on('close', () => {
    if (!res.writableFinished) stream.abort();
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      res.write(event.delta.text);
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') throw new Error('모델이 이 기록으로 소설 쓰기를 거절했습니다');
}

export async function handleNovel(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const json = (status: number, body: object) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') return json(405, { error: 'POST만 지원합니다' });

  let request: NovelRequest;
  try {
    request = parseRequest(await readBody(req));
  } catch (err) {
    return json(400, { error: err instanceof BadRequest ? err.message : '요청을 읽지 못했습니다' });
  }

  const mock = process.env.NOVEL_MOCK === '1';
  if (!mock && !process.env.ANTHROPIC_API_KEY) {
    return json(501, { error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다 (.env)' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Accel-Buffering': 'no',
  });
  try {
    if (mock) await streamMock(request, res);
    else await streamClaude(request, res);
  } catch (err) {
    if (res.destroyed) return;
    let msg = '소설 생성 중 오류';
    if (err instanceof Anthropic.AuthenticationError) msg = 'API 키가 올바르지 않습니다';
    else if (err instanceof Anthropic.RateLimitError) msg = '요청이 많아 잠시 후 다시 시도해 주세요';
    else if (err instanceof Anthropic.APIError) msg = `API 오류 ${err.status ?? ''}`.trim();
    else if (err instanceof Error) msg = err.message;
    console.error('[novel]', err);
    res.write(ERROR_MARKER + msg);
  }
  res.end();
}
