// 화면 렌더링과 입력 처리.
import './style.css';
import { STAT_KEYS, STAT_LABELS } from './config.ts';
import { createEngine, choiceStatus } from './engine.ts';
import { getEnding } from './endings.ts';
import { buildRequest, streamNovel, templateNovel } from './novel.ts';
import { loadRun, saveRun, clearRun, loadMeta, saveMeta, type RunRecord } from './storage.ts';
import { STAGES } from './data/stages.ts';
import { ALL_EVENTS } from './data/events/index.ts';
import type { Choice, Cond, Effects, GameEvent, HistoryEntry, RunState, StatKey, Stats } from './types.ts';

const engine = createEngine(ALL_EVENTS);
const app = document.getElementById('app')!;

const NUMS = '①②③④⑤⑥⑦⑧⑨';

type View = 'cover' | 'event' | 'result' | 'end';

let run: RunState | null = loadRun();
let meta = loadMeta();
let view: View = 'cover';
let lastEntry: HistoryEntry | null = null;

/** 엔딩 화면의 소설 상태. 판이 끝날 때 한 번 만들어진다. */
interface NovelState {
  text: string;
  status: 'writing' | 'done' | 'fallback';
  error?: string;
  abort?: AbortController;
  record: RunRecord;
}
let novel: NovelState | null = null;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// ── 공통 조각 ───────────────────────────

function header(right: string): string {
  return `
    <header class="doc-head">
      <div><div class="doc-kind">개인 기록부</div><h1>인생기록부</h1></div>
      <div class="doc-no">${right}</div>
    </header>`;
}

function ledger(stats: Stats): string {
  const row = (k: StatKey) => `
    <div class="ledger-row">
      <span>${STAT_LABELS[k]}</span>
      <span class="bar"><i style="width:${stats[k]}%"></i></span>
      <span class="v">${stats[k]}</span>
    </div>`;
  return `
    <section class="ledger" aria-label="현재 상태">
      <div class="ledger-lp"><span class="k">행복 LP</span><span class="v">${stats.lp}</span></div>
      <div class="ledger-rows">
        ${row('int')}${row('hp')}${row('mind')}
        <div class="ledger-row money"><span>${STAT_LABELS.money}</span><span class="v">${stats.money}</span></div>
      </div>
    </section>`;
}

function stageBar(current: number): string {
  return `<nav class="stages" aria-label="생애 단계">${STAGES.map(
    (s, i) => `<span class="${i < current ? 'done' : i === current ? 'now' : ''}">${s.name}</span>`,
  ).join('')}</nav>`;
}

function deltaTags(delta: Effects): string {
  const keys = STAT_KEYS.filter((k) => delta[k]);
  if (keys.length === 0) return `<div class="tags"><span class="tag none">변동 없음</span></div>`;
  return `<div class="tags">${keys
    .map((k) => `<span class="tag ${k === 'lp' ? 'lp' : ''}">${STAT_LABELS[k]} ${signed(delta[k]!)}</span>`)
    .join('')}</div>`;
}

function requirement(cond: Cond | undefined): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(cond?.min ?? {})) parts.push(`${STAT_LABELS[k as StatKey]} ${v} 이상`);
  for (const [k, v] of Object.entries(cond?.max ?? {})) parts.push(`${STAT_LABELS[k as StatKey]} ${v} 이하`);
  return parts.length ? parts.join(', ') : '조건 미충족';
}

/** 숨김 선택지를 뺀 목록. 화면 번호와 숫자키는 이 순서를 따른다. */
function visibleChoices(r: RunState, ev: GameEvent): Array<{ c: Choice; i: number; ok: boolean }> {
  return ev.choices
    .map((c, i) => ({ c, i, status: choiceStatus(r, c) }))
    .filter((x) => x.status !== 'hidden')
    .map(({ c, i, status }) => ({ c, i, ok: status === 'ok' }));
}

function historyList(history: HistoryEntry[]): string {
  if (history.length === 0) return '';
  return `
    <details class="history">
      <summary>기재 사항 ${history.length}건</summary>
      <ol>${history
        .map((h) => `<li><span class="st">${STAGES[h.stage].name}</span>${esc(h.log)}</li>`)
        .join('')}</ol>
    </details>`;
}

// ── 화면 ────────────────────────────────

function renderCover(): void {
  const canContinue = run?.status === 'playing';
  app.innerHTML = `
    <div class="cover">
      <div class="doc-kind">개인 기록부</div>
      <h1>인생기록부</h1>
      <p class="sub">한 사람의 일생을 기재합니다.</p>
      <div class="actions">
        ${canContinue ? `<button class="btn" data-act="continue">이어서 기재 (제${run!.runNo}호)</button>` : ''}
        <button class="btn ${canContinue ? 'ghost' : ''}" data-act="new">새 기록 작성</button>
      </div>
      <p class="meta">지금까지 ${meta.runs}번의 생 · 열람한 사건 ${meta.seenEvents.length} / ${ALL_EVENTS.length}</p>
    </div>`;
}

function renderEvent(r: RunState): void {
  const ev = engine.currentEvent(r)!;
  if (!meta.seenEvents.includes(ev.id)) {
    meta.seenEvents.push(ev.id);
    saveMeta(meta);
  }
  const s = STAGES[r.stage];
  app.innerHTML = `
    ${header(`기록 제${r.runNo}호`)}
    ${ledger(r.stats)}
    ${stageBar(r.stage)}
    <article class="entry">
      <div class="entry-meta">${s.name} · ${s.age} · 제${r.stageCount + 1}항</div>
      <h2>${esc(ev.title)}</h2>
      <p>${esc(ev.text)}</p>
      <ol class="choices">${visibleChoices(r, ev)
        .map(
          ({ c, i, ok }, n) => `<li><button class="choice" data-choice="${i}" ${ok ? '' : 'disabled'}>
            <span class="n">${NUMS[n]}</span>
            <span><span class="label">${esc(c.label)}</span>${ok ? '' : `<span class="req">${esc(requirement(c.cond))}</span>`}</span>
          </button></li>`,
        )
        .join('')}</ol>
    </article>
    ${historyList(r.history)}`;
  app.querySelector<HTMLElement>('.choice:not(:disabled)')?.focus({ preventScroll: true });
}

function renderResult(r: RunState, entry: HistoryEntry): void {
  const s = STAGES[entry.stage];
  app.innerHTML = `
    ${header(`기록 제${r.runNo}호`)}
    ${ledger(r.stats)}
    ${stageBar(entry.stage)}
    <section class="result">
      <div class="entry-meta">${s.name} · ${esc(entry.title)}</div>
      <p class="picked">${esc(entry.choice)}</p>
      ${deltaTags(entry.delta)}
      <p class="log">${esc(entry.log)}</p>
      <div class="actions"><button class="btn" data-act="next">${r.status === 'over' ? '기록 마감' : '다음 장'}</button></div>
    </section>
    ${historyList(r.history)}`;
  app.querySelector<HTMLElement>('[data-act="next"]')?.focus({ preventScroll: true });
}

const NOVEL_STATUS: Record<NovelState['status'], string> = {
  writing: '생애 소설을 쓰는 중입니다…',
  done: '',
  fallback: '소설 서버에 연결하지 못해, 기록을 엮은 임시 소설을 실었습니다.',
};

function renderEnd(r: RunState, n: NovelState): void {
  const ending = getEnding(r);
  const last = r.history.at(-1);
  app.innerHTML = `
    ${header(`기록 제${r.runNo}호`)}
    ${ledger(r.stats)}
    <div class="stamp">${ending.stamp}</div>
    <div class="entry-meta">${last ? `${STAGES[last.stage].name}에서 기록 마감 · ` : ''}${esc(ending.title)}</div>
    <section class="novel" aria-live="polite">
      <p class="novel-status" data-novel-status>${esc(NOVEL_STATUS[n.status])}${n.error ? ` <span class="err">(${esc(n.error)})</span>` : ''}</p>
      <div class="novel-text" data-novel-text>${esc(n.text)}</div>
    </section>
    <div class="actions">
      <button class="btn" data-act="new">다시 태어나기</button>
      ${n.status === 'fallback' ? '<button class="btn ghost" data-act="retry-novel">소설 다시 요청</button>' : ''}
      <button class="btn ghost" data-act="cover">표지로</button>
    </div>
    ${historyList(r.history)}`;
}

function render(): void {
  if (view === 'event' && run) renderEvent(run);
  else if (view === 'result' && run && lastEntry) renderResult(run, lastEntry);
  else if (view === 'end' && run && novel) renderEnd(run, novel);
  else renderCover();
  window.scrollTo(0, 0);
}

// ── 소설 ────────────────────────────────

async function writeNovel(r: RunState, n: NovelState): Promise<void> {
  const ending = getEnding(r);
  n.abort?.abort();
  n.abort = new AbortController();
  n.text = '';
  n.status = 'writing';
  n.error = undefined;
  if (view === 'end') render();

  try {
    const full = await streamNovel(
      buildRequest(r, ending),
      (chunk) => {
        n.text += chunk;
        // 스트리밍 중에는 본문만 갱신해서 스크롤 위치를 지킨다
        const el = app.querySelector('[data-novel-text]');
        if (el && novel === n) el.textContent = n.text;
      },
      n.abort.signal,
    );
    n.text = full;
    n.status = 'done';
    n.record.novel = full;
    n.record.novelSource = 'ai';
  } catch (err) {
    if (n.abort.signal.aborted) return;
    n.text = templateNovel(r, ending);
    n.status = 'fallback';
    n.error = err instanceof Error ? err.message : String(err);
    n.record.novel = n.text;
    n.record.novelSource = 'template';
  }
  saveMeta(meta);
  if (view === 'end' && novel === n) {
    // 끝나면 상태 문구와 버튼이 바뀌므로 다시 그리되, 읽던 스크롤 위치는 유지
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }
}

function finishRun(r: RunState): void {
  const ending = getEnding(r);
  const record: RunRecord = {
    runNo: r.runNo,
    end: r.end ?? 'natural',
    ending: ending.code,
    lp: r.stats.lp,
    stage: r.history.at(-1)?.stage ?? 0,
  };
  meta.records.push(record);
  saveMeta(meta);
  clearRun();
  novel = { text: '', status: 'writing', record };
  void writeNovel(r, novel);
}

// ── 동작 ────────────────────────────────

function startNew(): void {
  novel?.abort?.abort();
  novel = null;
  meta.runs++;
  saveMeta(meta);
  run = engine.newRun(meta.runs);
  saveRun(run);
  view = 'event';
  render();
}

function pick(index: number): void {
  if (!run) return;
  const ev = engine.currentEvent(run);
  const choice = ev?.choices[index];
  if (!choice || choiceStatus(run, choice) !== 'ok') return;
  lastEntry = engine.choose(run, index);
  if (run.status === 'over') finishRun(run);
  else saveRun(run);
  view = 'result';
  render();
}

function next(): void {
  view = run?.status === 'over' ? 'end' : 'event';
  render();
}

app.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn || btn.disabled) return;
  if (btn.dataset.choice !== undefined) return pick(Number(btn.dataset.choice));
  switch (btn.dataset.act) {
    case 'new':
      return startNew();
    case 'continue':
      view = 'event';
      return render();
    case 'next':
      return next();
    case 'retry-novel':
      if (run && novel) void writeNovel(run, novel);
      return;
    case 'cover':
      novel?.abort?.abort();
      view = 'cover';
      return render();
  }
});

// 숫자키로 선택
document.addEventListener('keydown', (e) => {
  if (view !== 'event' || !run || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = Number(e.key);
  const ev = engine.currentEvent(run);
  const target = n >= 1 && ev ? visibleChoices(run, ev)[n - 1] : undefined;
  if (target) pick(target.i);
});

render();
