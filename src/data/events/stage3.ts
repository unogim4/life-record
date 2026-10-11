// 아동기 (stage 3). M2 세로 슬라이스: 3개.
import type { GameEvent } from '../../types.ts';

export const STAGE3_EVENTS: GameEvent[] = [
  {
    id: 'c_school',
    stage: 3,
    title: '교실',
    text: '초등학교 시절, 교실에서의 아이를 기재한다.',
    choices: [
      { label: '반장 선거에서 뽑혔다', fx: { int: 3, lp: 3, mind: -2 }, log: '아이는 반장 선거에서 뽑혀 처음으로 교탁 앞에 섰다.' },
      { label: '받아쓰기 백 점', fx: { int: 5, lp: 2 }, log: '받아쓰기 백 점짜리 시험지가 냉장고 문에 붙었다.' },
      {
        label: '책상에 낙서가 되어 있었다',
        fx: { lp: -8, mind: 5 },
        log: '반 아이들이 아이의 책상에 낙서를 했고, 아이는 아무에게도 말하지 않았다.',
        setFlags: ['왕따경험'],
      },
      { label: '운동회 계주 마지막 주자', fx: { hp: 5, lp: 4 }, log: '아이는 운동회 계주의 마지막 주자로 결승선을 끊었다.' },
      { label: '복도에서 벌을 섰다', fx: { lp: -3, mind: 3 }, log: '아이는 숙제를 안 해 와 복도에서 두 손을 들고 벌을 섰다.' },
      { label: '해마다 전학을 갔다', fx: { lp: -3, mind: 3, int: 1 }, log: '아이는 학년이 바뀔 때마다 전학을 가서 늘 "새로 온 애"였다.' },
    ],
  },

  {
    id: 'c_talent',
    stage: 3,
    title: '재능',
    text: '아이가 남보다 잘했던 것, 혹은 못했던 것을 기재한다.',
    choices: [
      {
        label: '피아노',
        fx: { int: 3, mind: 3, money: -4 },
        log: '아이는 피아노 학원에서 체르니 30번까지 쳤다.',
        setFlags: ['음악'],
      },
      {
        label: '그림 대회 입상',
        fx: { int: 2, lp: 4 },
        log: '아이의 그림이 구청 사생대회에서 상을 받았다.',
        cond: { notFlags: ['엄마의꿈'] },
        setFlags: ['그림'],
      },
      {
        label: '어머니를 닮은 그림 솜씨',
        fx: { int: 2, lp: 5, mind: 2 },
        log: '아이가 그린 그림을 보고 어머니는 오래도록 말이 없었다.',
        cond: { flags: ['엄마의꿈'] },
        setFlags: ['그림'],
      },
      { label: '수학 경시대회', fx: { int: 7, mind: -2 }, log: '아이는 수학 경시대회에서 학교 대표로 나갔다.' },
      {
        label: '축구부 주전',
        fx: { hp: 6, lp: 3, int: -2 },
        log: '아이는 축구부 주전이 되어 해가 질 때까지 공을 찼다.',
        setFlags: ['운동'],
      },
      { label: '재능이 없다는 말을 들었다', fx: { lp: -4, mind: 4 }, log: '"넌 그쪽엔 재능이 없다"는 말을 아이는 오래 잊지 못했다.' },
      {
        label: '학원 다섯 군데',
        fx: { int: 5, lp: -5, hp: -2, money: -6 },
        log: '아이는 학원 다섯 군데를 돌고 밤 열 시에 집에 왔다.',
        cond: { min: { money: 0 } },
      },
    ],
  },

  {
    id: 'c_family',
    stage: 3,
    pin: 'last',
    title: '열두 살의 집',
    text: '아이가 열두 살이 될 무렵 집안에 있었던 일을 기재한다.',
    choices: [
      {
        label: '아버지의 사업이 망했다',
        fx: { money: -15, lp: -5, mind: 4 },
        log: '아버지의 사업이 망했고, 집에 빨간 압류 딱지가 붙었다.',
        cond: { notFlags: ['한부모', '이혼가정'] },
        setFlags: ['가난'],
      },
      { label: '첫 용돈을 받았다', fx: { money: 3, lp: 2 }, log: '아이는 처음 받은 용돈으로 돼지 저금통을 샀다.' },
      {
        label: '어른들의 대화를 엿들었다',
        fx: { mind: -4, lp: -3 },
        log: '아이는 어른들의 대화에서 자기 출생에 관한 이상한 말을 엿들었다.',
        cond: { flags: ['출생의비밀'] },
        setFlags: ['비밀을앎'],
      },
      { label: '형제와 매일 싸웠다', fx: { lp: -2, mind: 2 }, cond: { notFlags: ['외동'] }, log: '아이는 형제와 리모컨 하나를 두고 매일 싸웠다.' },
      { label: '할아버지에게 바둑을 배웠다', fx: { int: 3, mind: 2 }, log: '아이는 할아버지 무릎 앞에서 바둑돌 잡는 법을 배웠다.' },
      { label: '목에 건 현관 열쇠', fx: { mind: 4, lp: -3 }, log: '아이는 목에 현관 열쇠를 걸고 빈집으로 돌아왔다.' },
      { label: '처음 본 바다', fx: { lp: 6, money: -3 }, log: '온 가족이 처음으로 바다에 갔고, 아이는 파도를 쫓아 뛰었다.' },
      {
        label: '누렁이가 떠났다',
        fx: { lp: -5, mind: 3 },
        log: '누렁이가 늙어 세상을 떠났고, 아이는 뒷산에 묻어 주었다.',
        cond: { flags: ['강아지'] },
      },
      { label: '어머니 대신 집안일을 도맡았다', fx: { mind: 5, lp: -2, hp: -1 }, log: '어머니가 아파 누우면서 아이는 열두 살에 밥 짓는 법을 배웠다.' },
    ],
  },
];
