// 청년기 (stage 5). M2 세로 슬라이스: 3개.
import type { GameEvent } from '../../types.ts';

export const STAGE5_EVENTS: GameEvent[] = [
  {
    id: 'a_job',
    stage: 5,
    title: '첫 밥벌이',
    text: '처음으로 스스로 밥벌이를 시작한 곳을 기재한다.',
    choices: [
      {
        label: '대기업 공채',
        fx: { money: 15, lp: 2, hp: -4, mind: -3 },
        log: '대기업 공채에 합격해 사원증을 목에 걸고 지하철에 몸을 실었다.',
        cond: { min: { int: 60 } },
      },
      {
        label: '공무원 시험 삼 년',
        fx: { money: 8, lp: -3, mind: 5 },
        log: '고시원에서 삼 년을 버틴 끝에 공무원 시험에 붙었다.',
        setFlags: ['공무원'],
      },
      {
        label: '친구와 창업',
        fx: { money: -8, lp: 4, mind: 3 },
        log: '친구와 둘이 월세 사무실을 얻어 회사를 차렸다.',
        setFlags: ['창업'],
      },
      { label: '계약직을 전전했다', fx: { money: 3, lp: -4, mind: 3 }, log: '이 년짜리 계약이 끝날 때마다 새 회사를 찾아야 했다.' },
      { label: '예술로 밥벌이', fx: { lp: 5, money: -5 }, log: '돈은 안 됐지만 좋아하는 일로 하루하루를 버텼다.' },
      { label: '워킹홀리데이', fx: { lp: 5, int: 3, money: -2 }, log: '배낭 하나를 메고 워킹홀리데이를 떠나 낯선 농장에서 일했다.' },
      {
        label: '집안 회사에 들어갔다',
        fx: { money: 10, lp: -2, mind: -2 },
        log: '집안 회사에 들어가 "누구네 자식"이라는 꼬리표를 달았다.',
        cond: { flags: ['부유'] },
      },
    ],
  },

  {
    id: 'a_love',
    stage: 5,
    title: '함께할 사람',
    text: '서른 무렵, 곁에 둔 사람을 기재한다.',
    choices: [
      {
        label: '긴 연애 끝에 결혼',
        fx: { lp: 8, money: -6 },
        log: '칠 년을 만난 사람과 작은 예식장에서 결혼했다.',
        setFlags: ['기혼'],
      },
      {
        label: '첫사랑과 다시 만났다',
        fx: { lp: 10, mind: 2, money: -4 },
        log: '동창회에서 다시 만난 첫사랑과 이듬해 결혼했다.',
        cond: { flags: ['첫사랑'] },
        setFlags: ['기혼'],
      },
      {
        label: '선을 보고 결혼',
        fx: { lp: 2, money: 4 },
        log: '부모가 주선한 맞선에서 만난 사람과 석 달 만에 결혼했다.',
        setFlags: ['기혼'],
      },
      {
        label: '혼자 살기로 했다',
        fx: { lp: 1, mind: 4, money: 4 },
        log: '결혼하지 않고 혼자 살기로 했고, 그 결정을 후회하지 않았다.',
        setFlags: ['비혼'],
      },
      {
        label: '약혼자가 떠났다',
        fx: { lp: -8, mind: 5 },
        log: '결혼을 약속한 사람이 가장 친한 친구와 함께 떠났다.',
        setFlags: ['배신'],
      },
      { label: '일에 묻혀 지냈다', fx: { money: 6, lp: -3 }, log: '연애할 틈도 없이 일에 묻혀 서른을 넘겼다.' },
    ],
  },

  {
    id: 'a_turn',
    stage: 5,
    pin: 'last',
    title: '서른 즈음의 굴곡',
    text: '청년기의 끝에서 인생이 꺾인 순간을 기재한다.',
    choices: [
      { label: '과로로 쓰러졌다', fx: { hp: -10, money: 4 }, log: '연속 야근 끝에 사무실에서 쓰러져 구급차에 실려 갔다.' },
      { label: '사기를 당했다', fx: { money: -15, lp: -6, mind: 4 }, log: '믿었던 선배에게 모아 둔 돈을 몽땅 사기당했다.' },
      { label: '대학원에 들어갔다', fx: { int: 7, money: -5 }, log: '회사를 그만두고 늦은 나이에 대학원에 들어갔다.' },
      {
        label: '내 집을 마련했다',
        fx: { money: -10, lp: 6 },
        log: '대출을 끼고 처음으로 내 이름이 적힌 집 열쇠를 받았다.',
        cond: { min: { money: 10 } },
      },
      { label: '친구를 잃었다', fx: { lp: -6, mind: 4 }, log: '가장 친한 친구가 사고로 세상을 떠났다.' },
      { label: '운동을 시작했다', fx: { hp: 8, lp: 2 }, log: '새벽마다 한강을 달리기 시작했고, 몸이 달라졌다.' },
      {
        label: '떠난 아버지를 찾아갔다',
        fx: { lp: 4, mind: 4 },
        log: '어릴 적 집을 떠난 아버지를 찾아가 늦은 술잔을 나눴다.',
        cond: { flags: ['이혼가정'] },
      },
      {
        label: '생부를 찾아 나섰다',
        fx: { mind: 5, lp: -2 },
        log: '어머니가 숨겨 온 생부의 이름을 알아내고 그 동네를 찾아갔다.',
        cond: { flags: ['비밀을앎'] },
      },
    ],
  },
];
