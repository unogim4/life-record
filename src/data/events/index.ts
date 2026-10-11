// 모든 이벤트를 모으는 곳. 단계별 파일에 이벤트를 추가하면 자동으로 포함된다.
import type { GameEvent } from '../../types.ts';
import { STAGE0_EVENTS } from './stage0.ts';
import { STAGE1_EVENTS } from './stage1.ts';
import { STAGE2_EVENTS } from './stage2.ts';
import { STAGE3_EVENTS } from './stage3.ts';
import { STAGE4_EVENTS } from './stage4.ts';
import { STAGE5_EVENTS } from './stage5.ts';
import { STAGE6_EVENTS } from './stage6.ts';
import { STAGE7_EVENTS } from './stage7.ts';

export const ALL_EVENTS: GameEvent[] = [
  ...STAGE0_EVENTS,
  ...STAGE1_EVENTS,
  ...STAGE2_EVENTS,
  ...STAGE3_EVENTS,
  ...STAGE4_EVENTS,
  ...STAGE5_EVENTS,
  ...STAGE6_EVENTS,
  ...STAGE7_EVENTS,
];
