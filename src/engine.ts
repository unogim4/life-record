// 진행 엔진. DOM에 의존하지 않으므로 브라우저와 시뮬레이터(Node)에서 함께 쓴다.
import { CONFIG } from './config.ts';
import { STAGES } from './data/stages.ts';
import type { FlagName } from './data/flags.ts';
import type { Choice, Cond, Effects, GameEvent, HistoryEntry, RunState, StatKey, Stats } from './types.ts';

export const STATE_VERSION = 1;

/** mulberry32: 상태를 RunState에 저장해 이어하기/시뮬레이션에서 재현 가능하게 한다. */
function random(state: RunState): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const entries = (e: Effects | undefined) => Object.entries(e ?? {}) as [StatKey, number][];

function checkFlags(cond: Cond | undefined, flags: FlagName[]): boolean {
  if (!cond) return true;
  if (cond.flags?.some((f) => !flags.includes(f))) return false;
  if (cond.notFlags?.some((f) => flags.includes(f))) return false;
  return true;
}

function checkStats(cond: Cond | undefined, stats: Stats): boolean {
  if (!cond) return true;
  for (const [k, v] of entries(cond.min)) if (stats[k] < v) return false;
  for (const [k, v] of entries(cond.max)) if (stats[k] > v) return false;
  return true;
}

export function checkCond(cond: Cond | undefined, stats: Stats, flags: FlagName[]): boolean {
  return checkFlags(cond, flags) && checkStats(cond, stats);
}

export type ChoiceStatus = 'ok' | 'locked' | 'hidden';

/**
 * 선택지 상태. flag 조건이 안 맞으면 숨기고(그 인생엔 없는 선택),
 * 스탯 조건만 안 맞으면 이유와 함께 잠가서 보여 준다.
 */
export function choiceStatus(state: RunState, choice: Choice): ChoiceStatus {
  if (!checkFlags(choice.cond, state.flags)) return 'hidden';
  if (!checkStats(choice.cond, state.stats)) return 'locked';
  return 'ok';
}

function clampStat(key: StatKey, value: number): number {
  const range = CONFIG.STAT_RANGE[key];
  return range ? Math.min(range[1], Math.max(range[0], value)) : value;
}

export function createEngine(events: GameEvent[]) {
  const byId = new Map(events.map((e) => [e.id, e]));

  function weighted(state: RunState, pool: GameEvent[]): GameEvent | null {
    if (pool.length === 0) return null;
    const total = pool.reduce((s, e) => s + (e.weight ?? 1), 0);
    let r = random(state) * total;
    for (const e of pool) {
      r -= e.weight ?? 1;
      if (r < 0) return e;
    }
    return pool[pool.length - 1];
  }

  /**
   * pin:'first' 이벤트는 단계 첫머리에, pin:'last'는 단계 마지막 칸에 반드시 나온다.
   * 나머지 칸은 pin 없는 이벤트 중에서 가중치로 뽑는다.
   */
  function pickEvent(state: RunState): GameEvent | null {
    const pool = events.filter(
      (e) =>
        e.stage === state.stage &&
        !state.used.includes(e.id) &&
        checkCond(e.cond, state.stats, state.flags),
    );
    const firsts = pool.filter((e) => e.pin === 'first');
    const lasts = pool.filter((e) => e.pin === 'last');
    const normal = pool.filter((e) => !e.pin);
    if (firsts.length) return weighted(state, firsts);
    if (state.stageCount >= CONFIG.EVENTS_PER_STAGE - lasts.length) {
      return weighted(state, lasts) ?? weighted(state, normal);
    }
    return weighted(state, normal) ?? weighted(state, lasts);
  }

  /** 다음 이벤트를 정한다. 단계가 차거나 풀이 비면 다음 단계로, 끝까지 가면 천수. */
  function advance(state: RunState): void {
    while (state.stage < STAGES.length) {
      if (state.stageCount < CONFIG.EVENTS_PER_STAGE) {
        const ev = pickEvent(state);
        if (ev) {
          state.current = ev.id;
          state.used.push(ev.id);
          return;
        }
      }
      state.stage++;
      state.stageCount = 0;
    }
    state.current = null;
    state.status = 'over';
    state.end = 'natural';
  }

  return {
    newRun(runNo: number, seed: number = (Math.random() * 2 ** 32) | 0): RunState {
      const state: RunState = {
        version: STATE_VERSION,
        runNo,
        rng: seed,
        stage: 0,
        stageCount: 0,
        used: [],
        current: null,
        stats: { ...CONFIG.START_STATS },
        flags: [],
        history: [],
        status: 'playing',
        end: null,
      };
      advance(state);
      return state;
    },

    currentEvent(state: RunState): GameEvent | null {
      return state.current ? (byId.get(state.current) ?? null) : null;
    },

    /** 선택을 적용하고 다음 이벤트로 넘어간다. */
    choose(state: RunState, index: number): HistoryEntry {
      const ev = byId.get(state.current ?? '');
      if (!ev || state.status !== 'playing') throw new Error('진행 중인 이벤트가 없음');
      const choice = ev.choices[index];
      if (!choice || choiceStatus(state, choice) !== 'ok') throw new Error('선택할 수 없는 선택지');

      const delta: Effects = {};
      for (const [k, v] of entries(choice.fx)) {
        const before = state.stats[k];
        state.stats[k] = clampStat(k, before + v);
        if (state.stats[k] !== before) delta[k] = state.stats[k] - before;
      }
      for (const f of choice.setFlags ?? []) if (!state.flags.includes(f)) state.flags.push(f);
      const clear = choice.clearFlags;
      if (clear) state.flags = state.flags.filter((f) => !clear.includes(f));

      const entry: HistoryEntry = {
        stage: ev.stage,
        eventId: ev.id,
        title: ev.title,
        choice: choice.label,
        log: choice.log,
        delta,
      };
      state.history.push(entry);
      state.stageCount++;

      if (state.stats.hp <= 0) {
        state.status = 'over';
        state.end = 'death';
        state.current = null;
      } else if (state.stats.lp <= 0) {
        state.status = 'over';
        state.end = 'collapse';
        state.current = null;
      } else {
        advance(state);
      }
      return entry;
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
