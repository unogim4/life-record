// 밸런스 시뮬레이터: 무작위 선택으로 N판을 돌려 종료 분포와 단계별 스탯을 본다.
// 사용법: npm run sim -- [판 수=1000] [--stage=단계번호]  (--stage를 주면 그 단계의 이벤트·선택지 등장 횟수 표시)
import { STAT_KEYS } from '../src/config.ts';
import { createEngine, choiceStatus } from '../src/engine.ts';
import { getEnding } from '../src/endings.ts';
import { STAGES } from '../src/data/stages.ts';
import { ALL_EVENTS } from '../src/data/events/index.ts';
import type { Stats } from '../src/types.ts';

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a))) || 1000;
const focus = args.find((a) => a.startsWith('--stage='));
const focusStage = focus ? Number(focus.split('=')[1]) : null;

const engine = createEngine(ALL_EVENTS);

const endStage: number[] = new Array(STAGES.length).fill(0);
const endings = new Map<string, number>();
// 단계를 마친 시점의 스탯 (그 단계를 끝낸 판만)
const stageStats = STAGES.map(() => ({
  n: 0,
  sum: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats,
  min: Object.fromEntries(STAT_KEYS.map((k) => [k, Infinity])) as Stats,
  max: Object.fromEntries(STAT_KEYS.map((k) => [k, -Infinity])) as Stats,
}));
const seen = new Map<string, number>();
const fewChoices = new Map<string, number>(); // 보이는 선택지가 5개 미만이었던 이벤트
let totalEvents = 0;

function recordStage(stage: number, stats: Stats): void {
  const t = stageStats[stage];
  t.n++;
  for (const k of STAT_KEYS) {
    t.sum[k] += stats[k];
    t.min[k] = Math.min(t.min[k], stats[k]);
    t.max[k] = Math.max(t.max[k], stats[k]);
  }
}

for (let i = 0; i < N; i++) {
  const run = engine.newRun(i + 1, (i * 2654435761) | 0);
  let guard = 0;
  while (run.status === 'playing') {
    const ev = engine.currentEvent(run)!;
    const visible = ev.choices.map((c, idx) => [idx, choiceStatus(run, c)] as const).filter(([, s]) => s !== 'hidden');
    const options = visible.filter(([, s]) => s === 'ok').map(([idx]) => idx);
    if (visible.length < 5) fewChoices.set(ev.id, Math.min(fewChoices.get(ev.id) ?? 9, visible.length));
    if (options.length === 0) throw new Error(`선택 가능한 선택지가 없음: ${ev.id}`);

    const stageBefore = run.stage;
    const idx = options[Math.floor(Math.random() * options.length)];
    seen.set(ev.id, (seen.get(ev.id) ?? 0) + 1);
    seen.set(`${ev.id}#${idx}`, (seen.get(`${ev.id}#${idx}`) ?? 0) + 1);
    engine.choose(run, idx);
    if (run.stage !== stageBefore || run.end === 'natural') recordStage(stageBefore, run.stats);
    if (++guard > 1000) throw new Error('무한 루프 의심');
  }
  const code = getEnding(run).title;
  endings.set(code, (endings.get(code) ?? 0) + 1);
  endStage[run.history.at(-1)?.stage ?? 0]++;
  totalEvents += run.history.length;
}

const pct = (n: number, d = N) => `${((n / d) * 100).toFixed(1)}%`;
const pad = (s: string | number, w: number) => String(s).padStart(w);

console.log(`시뮬레이션 ${N}판 · 평균 이벤트 수 ${(totalEvents / N).toFixed(1)}`);
console.log(
  '엔딩:',
  [...endings].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join(' · '),
);
const early = endStage.slice(0, 5).reduce((a, b) => a + b, 0);
console.log(`청년기 이전 종료 ${pct(early)} (목표 ≤15%) · 노년기 도달 ${pct(endStage[7])} (목표 ≥50%)`);

console.log('\n단계 종료 시점 스탯   평균 [최소~최대]');
STAGES.forEach((s, i) => {
  const t = stageStats[i];
  if (!t.n) return;
  const cells = STAT_KEYS.map((k) => `${k} ${pad((t.sum[k] / t.n).toFixed(0), 4)} [${t.min[k]}~${t.max[k]}]`);
  console.log(`  ${s.name.padEnd(5, '　')} ${cells.join('  ')}`);
});

if (fewChoices.size) {
  console.log('\n△ 보이는 선택지가 5개 미만이었던 이벤트:');
  for (const [id, n] of fewChoices) console.log(`  ${id}: 최소 ${n}개`);
}

if (focusStage !== null) {
  console.log(`\n[${STAGES[focusStage].name}] 이벤트 등장률 / 선택지별 선택 횟수`);
  for (const ev of ALL_EVENTS.filter((e) => e.stage === focusStage)) {
    const picks = ev.choices.map((_, i) => seen.get(`${ev.id}#${i}`) ?? 0).join(' / ');
    console.log(`  ${ev.id.padEnd(14)} ${pad(pct(seen.get(ev.id) ?? 0), 6)}   ${picks}`);
  }
}
