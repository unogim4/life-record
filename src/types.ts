// 데이터 구조 정의. 클라이언트, 서버, 도구가 함께 쓴다.
import type { FlagName } from './data/flags.ts';

export type StatKey = 'lp' | 'int' | 'hp' | 'mind' | 'money';
export type Stats = Record<StatKey, number>;
export type Effects = Partial<Stats>;

/** 등장/선택 조건. 모든 항목을 만족해야 통과. */
export interface Cond {
  /** 각 스탯이 이 값 이상 */
  min?: Effects;
  /** 각 스탯이 이 값 이하 */
  max?: Effects;
  /** 모두 가지고 있어야 함 */
  flags?: FlagName[];
  /** 하나라도 있으면 안 됨 */
  notFlags?: FlagName[];
}

export interface Choice {
  label: string;
  fx: Effects;
  /** 소설 재료용 압축 문장 */
  log: string;
  /** flag 불충족 → 숨김, 스탯 불충족 → 잠금 */
  cond?: Cond;
  setFlags?: FlagName[];
  clearFlags?: FlagName[];
}

export interface GameEvent {
  id: string;
  /** 0~7 (태아기~노년기) */
  stage: number;
  title: string;
  text: string;
  cond?: Cond;
  /** 추첨 가중치, 기본 1 */
  weight?: number;
  /** 단계 첫/마지막 칸에 반드시 등장 */
  pin?: 'first' | 'last';
  choices: Choice[];
}

export interface HistoryEntry {
  stage: number;
  eventId: string;
  title: string;
  choice: string;
  log: string;
  /** 실제 적용된 변화량 (범위 제한 반영) */
  delta: Effects;
}

export type EndReason = 'death' | 'collapse' | 'natural';

export interface RunState {
  version: number;
  runNo: number;
  /** 난수 상태 (저장/재현용) */
  rng: number;
  stage: number;
  /** 현재 단계에서 진행한 이벤트 수 */
  stageCount: number;
  /** 이번 판에서 이미 나온 이벤트 id */
  used: string[];
  current: string | null;
  stats: Stats;
  flags: FlagName[];
  history: HistoryEntry[];
  status: 'playing' | 'over';
  end: EndReason | null;
}

/** 클라이언트 → 소설 API 요청 본문. 프롬프트는 서버가 이 데이터로 조립한다. */
export interface NovelRequest {
  history: Array<Pick<HistoryEntry, 'stage' | 'title' | 'choice' | 'log' | 'delta'>>;
  stats: Stats;
  flags: FlagName[];
  end: EndReason;
  ending: string;
}
