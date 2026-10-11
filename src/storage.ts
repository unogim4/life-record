// localStorage 저장. 진행 중인 판(run)과 판을 넘어 쌓이는 기록(meta)을 분리한다.
// 저장소가 막혀 있어도 게임은 돌아가야 하므로 모든 접근을 try/catch로 감싼다.
import { CONFIG } from './config.ts';
import { STATE_VERSION } from './engine.ts';
import type { EndReason, RunState } from './types.ts';

export interface RunRecord {
  runNo: number;
  end: EndReason;
  ending: string;
  lp: number;
  stage: number;
  /** 생성된 소설 (AI 또는 템플릿) */
  novel?: string;
  novelSource?: 'ai' | 'template';
}

export interface Meta {
  /** 시작한 판 수 */
  runs: number;
  /** 한 번이라도 본 이벤트 id */
  seenEvents: string[];
  /** 끝난 판 요약 */
  records: RunRecord[];
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시 (이번 세션 동안은 메모리 상태로 계속 진행)
  }
}

export function loadRun(): RunState | null {
  const run = read<RunState>(CONFIG.SAVE_KEY);
  return run && run.version === STATE_VERSION ? run : null;
}

export function saveRun(run: RunState): void {
  write(CONFIG.SAVE_KEY, run);
}

export function clearRun(): void {
  write(CONFIG.SAVE_KEY, null);
}

export function loadMeta(): Meta {
  return { runs: 0, seenEvents: [], records: [], ...read<Partial<Meta>>(CONFIG.META_KEY) };
}

export function saveMeta(meta: Meta): void {
  write(CONFIG.META_KEY, meta);
}
