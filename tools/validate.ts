// 이벤트 데이터 검사. 스탯 키·flag 오타는 타입 검사(tsc)가 잡고, 여기서는 내용 규칙을 본다.
// 오류가 있으면 종료 코드 1. 사용법: npm run check
import { ALL_EVENTS } from '../src/data/events/index.ts';
import { FLAGS, type FlagName } from '../src/data/flags.ts';
import { STAGES } from '../src/data/stages.ts';
import type { Cond } from '../src/types.ts';

const errors: string[] = [];
const warns: string[] = [];

const ids = new Set<string>();
const setFlags = new Set<FlagName>();
const usedFlags = new Set<FlagName>();

function collectCond(cond: Cond | undefined): void {
  for (const f of [...(cond?.flags ?? []), ...(cond?.notFlags ?? [])]) usedFlags.add(f);
}

for (const ev of ALL_EVENTS) {
  const at = ev.id;
  if (ids.has(ev.id)) errors.push(`${at}: id 중복`);
  ids.add(ev.id);
  if (!(ev.stage >= 0 && ev.stage < STAGES.length)) errors.push(`${at}: stage 범위 밖 (${ev.stage})`);
  if (!ev.title || !ev.text) errors.push(`${at}: title/text 비어 있음`);
  collectCond(ev.cond);

  if (ev.choices.length < 5) warns.push(`${at}: 선택지 ${ev.choices.length}개 (최소 5개 원칙)`);
  const unconditional = ev.choices.filter((c) => !c.cond).length;
  if (unconditional < 2) warns.push(`${at}: 조건 없는 선택지가 ${unconditional}개뿐`);

  ev.choices.forEach((c, i) => {
    const where = `${at}[${i}] '${c.label}'`;
    if (!c.label) errors.push(`${where}: label 비어 있음`);
    if (!c.log) errors.push(`${where}: log 비어 있음`);
    else if (c.log.length < 15 || c.log.length > 70) warns.push(`${where}: log 길이 ${c.log.length}자 (권장 15~70자)`);
    const fx = Object.entries(c.fx);
    if (fx.length === 0) warns.push(`${where}: 스탯 변화 없음`);
    for (const [k, v] of fx) {
      if (k !== 'money' && Math.abs(v) > 15) warns.push(`${where}: ${k} ${v} (±15 초과는 생애를 가르는 사건만)`);
    }
    collectCond(c.cond);
    for (const f of c.setFlags ?? []) setFlags.add(f);
  });
}

STAGES.forEach((s, stage) => {
  const evs = ALL_EVENTS.filter((e) => e.stage === stage);
  if (evs.length === 0) errors.push(`${s.name}: 이벤트가 없음`);
  if (evs.filter((e) => e.pin).length >= 5) errors.push(`${s.name}: pin 이벤트가 5개 이상이라 무작위 칸이 없음`);
});

const neverSet = [...usedFlags].filter((f) => !setFlags.has(f));
const neverUsed = (Object.keys(FLAGS) as FlagName[]).filter((f) => setFlags.has(f) && !usedFlags.has(f));
const unusedDefs = (Object.keys(FLAGS) as FlagName[]).filter((f) => !setFlags.has(f) && !usedFlags.has(f));

console.log(`이벤트 ${ALL_EVENTS.length}개 · 선택지 ${ALL_EVENTS.reduce((n, e) => n + e.choices.length, 0)}개 검사`);
for (const e of errors) console.log(`  ✗ ${e}`);
for (const w of warns) console.log(`  △ ${w}`);
if (neverSet.length) console.log(`  △ 조건에만 쓰이고 어디서도 설정되지 않는 flag: ${neverSet.join(', ')}`);
if (unusedDefs.length) console.log(`  △ 등록만 되고 쓰이지 않는 flag: ${unusedDefs.join(', ')}`);
if (neverUsed.length) console.log(`  · 아직 회수되지 않은 flag: ${neverUsed.join(', ')}`);
console.log(errors.length ? `오류 ${errors.length}건` : '오류 없음');
process.exitCode = errors.length ? 1 : 0;
