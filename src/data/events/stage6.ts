// 중년기 (stage 6). M2 세로 슬라이스: 3개.
import type { GameEvent } from '../../types.ts';

export const STAGE6_EVENTS: GameEvent[] = [
  {
    id: 'm_child',
    stage: 6,
    title: '식구',
    text: '중년의 식탁에 함께 앉은 이들을 기재한다.',
    choices: [
      {
        label: '아이가 태어났다',
        fx: { lp: 8, money: -8, hp: -2 },
        log: '아이가 태어났고, 그 작은 손이 손가락을 꽉 쥐었다.',
        cond: { flags: ['기혼'] },
        setFlags: ['자녀'],
      },
      {
        label: '긴 난임 끝에 얻은 아이',
        fx: { lp: 10, money: -12, mind: 3 },
        log: '몇 해의 난임 치료 끝에 아이를 품에 안았다.',
        cond: { flags: ['기혼'] },
        setFlags: ['자녀'],
      },
      {
        label: '아이 없이 둘이서',
        fx: { lp: 2, money: 5 },
        log: '아이 없이 둘이서 사는 삶을 택했다.',
        cond: { flags: ['기혼'] },
      },
      {
        label: '조카를 맡아 키웠다',
        fx: { lp: 4, money: -5, mind: 3 },
        log: '형제가 남기고 간 조카를 맡아 내 자식처럼 키웠다.',
        setFlags: ['자녀'],
      },
      {
        label: '늦은 결혼',
        fx: { lp: 6, money: -4 },
        log: '마흔이 넘어 만난 사람과 조용히 혼인신고를 했다.',
        cond: { notFlags: ['기혼'] },
        setFlags: ['기혼'],
      },
      {
        label: '혼자의 살림',
        fx: { lp: 3, money: 6, mind: 2 },
        log: '혼자 사는 집을 내 취향대로 꾸미며 살았다.',
        cond: { notFlags: ['기혼'] },
      },
      { label: '고양이 두 마리', fx: { lp: 4, hp: 1 }, log: '길에서 데려온 고양이 두 마리가 식구가 되었다.' },
      {
        label: '아이를 입양했다',
        fx: { lp: 6, money: -6, mind: 4 },
        log: '보육원에서 만난 아이를 입양해 가족이 되었다.',
        setFlags: ['자녀'],
      },
    ],
  },

  {
    id: 'm_career',
    stage: 6,
    title: '중년의 일',
    text: '마흔과 쉰 사이, 일터에서의 자리를 기재한다.',
    choices: [
      { label: '임원으로 승진', fx: { money: 12, hp: -5, mind: -3 }, log: '임원으로 승진했지만 흰머리와 위장약이 늘었다.' },
      {
        label: '명예퇴직',
        fx: { money: 5, lp: -6, mind: 3 },
        log: '쉰 살에 명예퇴직 서류에 도장을 찍었다.',
        setFlags: ['퇴직'],
      },
      { label: '치킨집 창업', fx: { money: -10, lp: -2, hp: -3 }, log: '퇴직금을 털어 동네에 치킨집을 열었다.' },
      {
        label: '회사가 상장했다',
        fx: { money: 30, lp: 5, hp: -5 },
        log: '청년 시절 차린 회사가 상장했고, 하룻밤 사이에 부자가 되었다.',
        cond: { flags: ['창업'] },
      },
      { label: '늦깎이 공부', fx: { int: 6, lp: 3, money: -4 }, log: '마흔다섯에 방송통신대학에 입학해 젊은 동기들과 공부했다.' },
      {
        label: '정년까지 묵묵히',
        fx: { money: 8, lp: 1 },
        log: '같은 민원실 창구를 정년까지 묵묵히 지켰다.',
        cond: { flags: ['공무원'] },
      },
      { label: '귀농', fx: { hp: 6, money: -5, lp: 3 }, log: '도시 생활을 접고 시골로 내려가 사과나무를 심었다.' },
      { label: '접어 둔 꿈을 다시 꺼냈다', fx: { lp: 6, money: -8 }, log: '안정된 일을 그만두고 오래 접어 둔 꿈을 다시 꺼냈다.' },
    ],
  },

  {
    id: 'm_family',
    stage: 6,
    pin: 'last',
    title: '가족의 시간',
    text: '중년이 끝나 갈 무렵, 가족에게 있었던 일을 기재한다.',
    choices: [
      { label: '어머니를 간병했다', fx: { lp: -4, hp: -4, mind: 5, money: -6 }, log: '치매에 걸린 어머니를 몇 해 동안 곁에서 돌봤다.' },
      {
        label: '이혼',
        fx: { lp: -8, mind: 4, money: -10 },
        log: '이십 년을 함께 산 사람과 법원 앞에서 담담하게 헤어졌다.',
        cond: { flags: ['기혼'] },
        clearFlags: ['기혼'],
        setFlags: ['이혼'],
      },
      {
        label: '배다른 형제를 만났다',
        fx: { lp: 3, mind: 2 },
        log: '아버지의 장례식장에서 처음 보는 배다른 형제와 마주 앉았다.',
        cond: { flags: ['숨겨진형제'] },
      },
      {
        label: '건강검진에서 종양이 발견됐다',
        fx: { hp: -15, mind: 4, lp: -4 },
        log: '건강검진에서 종양이 발견되어 긴 항암 치료를 시작했다.',
        setFlags: ['투병'],
      },
      { label: '부모의 임종을 지켰다', fx: { lp: -3, mind: 4 }, log: '아버지의 마지막 숨을 손을 잡고 지켰다.' },
      {
        label: '자식의 사춘기',
        fx: { lp: -3, mind: 3 },
        log: '방문을 걸어 잠근 자식을 보며 자신의 열여섯을 떠올렸다.',
        cond: { flags: ['자녀'] },
      },
      {
        label: '어머니의 그림을 걸었다',
        fx: { lp: 6, mind: 3 },
        log: '어머니가 접었던 그림들을 모아 작은 전시회를 열어 드렸다.',
        cond: { flags: ['엄마의꿈'] },
      },
      { label: '오랜 친구들과 여행', fx: { lp: 5, money: -3 }, log: '스무 살 때 친구들과 삼십 년 만에 다시 여행을 떠났다.' },
      { label: '낡은 집을 고쳤다', fx: { lp: 3, money: -6 }, log: '오래 산 집을 손수 고치며 주말을 보냈다.' },
    ],
  },
];
