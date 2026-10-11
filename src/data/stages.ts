export interface StageInfo {
  name: string;
  age: string;
}

export const STAGES: readonly StageInfo[] = [
  { name: '태아기', age: '출생 전' },
  { name: '영아기', age: '0~1세' },
  { name: '유아기', age: '2~6세' },
  { name: '아동기', age: '7~12세' },
  { name: '청소년기', age: '13~18세' },
  { name: '청년기', age: '19~34세' },
  { name: '중년기', age: '35~64세' },
  { name: '노년기', age: '65세~' },
];
