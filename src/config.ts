// 게임 전역 설정. 밸런스 수치와 외부 주소는 모두 여기서만 관리한다.
import type { StatKey, Stats } from './types.ts';

export const CONFIG = {
  // 소설 생성 API 주소. 공개 배포 시 서버리스 주소로 이 값만 교체한다.
  NOVEL_API_URL: '/api/novel',

  EVENTS_PER_STAGE: 5,

  START_STATS: { lp: 50, int: 50, hp: 50, mind: 50, money: 0 } satisfies Stats,

  // 재력(money)은 범위 제한 없음
  STAT_RANGE: {
    lp: [0, 100],
    int: [0, 100],
    hp: [0, 100],
    mind: [0, 100],
  } as Partial<Record<StatKey, [number, number]>>,

  SAVE_KEY: 'lifelog.run.v1',
  META_KEY: 'lifelog.meta.v1',
};

export const STAT_LABELS: Record<StatKey, string> = {
  lp: 'LP',
  int: '지성',
  hp: '건강',
  mind: '정신력',
  money: '재력',
};

export const STAT_KEYS: readonly StatKey[] = ['lp', 'int', 'hp', 'mind', 'money'];
