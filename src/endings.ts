// 엔딩 판정. 종료 사유 × 최종 LP로 나눈다. (M5에서 종류를 늘린다)
import { STAGES } from './data/stages.ts';
import type { RunState } from './types.ts';

export interface Ending {
  code: string;
  /** 도장에 찍히는 짧은 이름 */
  stamp: string;
  /** 엔딩 이름 */
  title: string;
  /** 템플릿 소설의 마지막 문장 */
  closing: string;
}

export function getEnding(run: RunState): Ending {
  const lp = run.stats.lp;
  const lastStage = run.history.at(-1)?.stage ?? 0;
  const where = STAGES[lastStage].name;

  if (run.end === 'collapse') {
    return {
      code: 'collapse',
      stamp: '무너짐',
      title: '무너진 생',
      closing: `${where}의 어느 날, 더는 버틸 힘이 남아 있지 않았다. 기록은 거기서 멈췄다.`,
    };
  }
  if (run.end === 'death') {
    return lastStage <= 4
      ? {
          code: 'death_early',
          stamp: '요절',
          title: '너무 이른 마침표',
          closing: `${where}에 생은 너무 일찍 끝났다. 남은 사람들은 오래도록 그 이름을 불렀다.`,
        }
      : {
          code: 'death',
          stamp: '사망',
          title: '멈춰 버린 시계',
          closing: `${where}의 한복판에서 몸이 먼저 멈췄다. 하지 못한 말들이 많이 남았다.`,
        };
  }
  if (lp >= 80) {
    return { code: 'natural_full', stamp: '천수', title: '충만한 생', closing: '돌아보니 웃은 날이 더 많았다. 아쉬움 없이 눈을 감았다.' };
  }
  if (lp >= 60) {
    return { code: 'natural_warm', stamp: '천수', title: '따뜻한 생', closing: '모든 날이 좋지는 않았지만, 좋은 날들이 오래 남았다.' };
  }
  if (lp >= 40) {
    return { code: 'natural_plain', stamp: '천수', title: '평범한 생', closing: '특별할 것 없는 한평생이었다. 그리고 그것으로 충분했다.' };
  }
  if (lp >= 20) {
    return { code: 'natural_lonely', stamp: '천수', title: '쓸쓸한 생', closing: '오래 살았지만 마지막 방은 조용했다.' };
  }
  return { code: 'natural_regret', stamp: '천수', title: '회한의 생', closing: '끝까지 살아 냈지만, 돌아보면 후회가 더 많았다.' };
}
