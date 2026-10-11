// 청소년기 (stage 4). M2 세로 슬라이스: 3개.
// 이 단계부터 log의 주어는 생략하거나 "그"로 쓴다 (소설에서 이름을 붙인다).
import type { GameEvent } from '../../types.ts';

export const STAGE4_EVENTS: GameEvent[] = [
  {
    id: 'y_love',
    stage: 4,
    title: '첫사랑',
    text: '열여섯, 마음을 흔든 사람을 기재한다.',
    choices: [
      { label: '고백했다가 차였다', fx: { lp: -4, mind: 4 }, log: '용기 내어 고백했지만 "그냥 친구로 지내자"는 대답이 돌아왔다.' },
      {
        label: '끝내 말하지 못했다',
        fx: { lp: 2, mind: 1 },
        log: '같은 반 그 아이를 좋아했지만 졸업할 때까지 끝내 말하지 못했다.',
        setFlags: ['첫사랑'],
      },
      {
        label: '처음으로 손을 잡았다',
        fx: { lp: 6, int: -2 },
        log: '첫 연애를 했고, 학교 뒤 골목에서 처음으로 손을 잡았다.',
        setFlags: ['첫사랑'],
      },
      {
        label: '소꿉친구가 다르게 보였다',
        fx: { lp: 5, mind: 1 },
        log: '어릴 적 결혼하자던 소꿉친구가 어느 날 갑자기 다르게 보였다.',
        cond: { flags: ['소꿉친구'] },
        setFlags: ['첫사랑'],
      },
      { label: '사랑보다 성적', fx: { int: 4, lp: -2 }, log: '연애는 대학 가서 하라는 말을 믿고 문제집만 풀었다.' },
      { label: '부치지 못한 편지', fx: { lp: 1, mind: 2, int: 1 }, log: '밤새 쓴 편지를 끝내 부치지 못하고 서랍 깊숙이 넣어 두었다.' },
      { label: '국어 선생님을 동경했다', fx: { lp: 2, int: 2 }, log: '국어 선생님이 읽어 주는 시가 좋아 국문과를 꿈꾸었다.' },
    ],
  },

  {
    id: 'y_exam',
    stage: 4,
    title: '입시',
    text: '열아홉의 겨울, 시험과 진로를 기재한다.',
    choices: [
      {
        label: '수능 대박',
        fx: { int: 8, lp: 6 },
        log: '수능에서 평소보다 훨씬 높은 점수를 받아 명문대에 합격했다.',
        cond: { min: { int: 65 } },
        setFlags: ['명문대'],
      },
      {
        label: '재수를 결심했다',
        fx: { int: 4, lp: -5, mind: 3, money: -4 },
        log: '원하는 대학에 떨어져 노량진 재수 학원에 등록했다.',
        setFlags: ['재수'],
      },
      { label: '실업계에서 일찍 취업', fx: { money: 6, int: -2, mind: 3 }, log: '실업계 고등학교를 나와 열아홉에 공장에 취직했다.' },
      { label: '예체능 입시', fx: { lp: 4, money: -6, hp: -1 }, log: '실기 학원에서 밤을 새우며 예체능 입시를 준비했다.' },
      { label: '시험을 망쳤다', fx: { lp: -6, mind: 2 }, log: '시험 당일 배탈이 나서 삼 년 공부를 망쳤다.' },
      {
        label: '학교 담을 넘었다',
        fx: { lp: -3, hp: -3, int: -4 },
        log: '공부를 놓고 학교 담을 넘어 오락실과 뒷골목을 떠돌았다.',
        setFlags: ['방황'],
      },
      {
        label: '장학금을 받았다',
        fx: { int: 4, money: 5, lp: 3 },
        log: '가난한 집 아이에게 주는 장학금으로 대학 등록금을 마련했다.',
        cond: { flags: ['가난'], min: { int: 55 } },
      },
    ],
  },

  {
    id: 'y_crisis',
    stage: 4,
    pin: 'last',
    title: '열여덟의 사건',
    text: '사춘기 끝 무렵, 오래 기억에 남은 일을 기재한다.',
    choices: [
      { label: '집을 나갔다', fx: { lp: -4, mind: 5, hp: -3 }, log: '부모와 싸우고 집을 나가 친구 자취방에서 사흘을 버텼다.' },
      {
        label: '괴롭히던 아이와 마주쳤다',
        fx: { mind: 5, lp: 1 },
        log: '어린 시절 자신을 괴롭히던 아이와 마주쳤지만, 더는 무섭지 않았다.',
        cond: { flags: ['왕따경험'] },
      },
      {
        label: '담배를 배웠다',
        fx: { hp: -6, lp: 1 },
        log: '학교 옥상에서 친구가 건넨 담배를 처음 피웠다.',
        setFlags: ['흡연'],
      },
      {
        label: '밴드를 만들었다',
        fx: { lp: 6, int: -2 },
        log: '친구들과 밴드를 만들어 축제 무대에 섰다.',
        setFlags: ['음악'],
      },
      { label: '아르바이트를 시작했다', fx: { money: 5, hp: -2, mind: 2 }, log: '편의점 야간 아르바이트로 처음 내 손으로 돈을 벌었다.' },
      { label: '아버지와 크게 싸웠다', fx: { lp: -4, mind: 3 }, cond: { notFlags: ['한부모'] }, log: '아버지와 크게 싸운 뒤 한동안 서로 말을 하지 않았다.' },
      { label: '일기장을 들켰다', fx: { lp: -3, mind: 2 }, log: '어머니가 일기장을 몰래 읽은 것을 알고 자물쇠를 달았다.' },
    ],
  },
];
