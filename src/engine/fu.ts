import type { Group } from './decompose';
import type { CommonConditions, FuDetail } from './types';
import { HONOR_NAMES } from './tiles';
import type { WaitType } from './yaku';

function isTerminalOrHonorGroup(g: Group): boolean {
  if (g.suit === 'z') return true;
  if (g.type === 'run') return false;
  return g.startRank === 1 || g.startRank === 9;
}

export interface FuContext {
  groups: Group[];
  isMenzen: boolean;
  waitType: WaitType;
  common: CommonConditions;
  isPinfu: boolean;
}

export function computeFu(ctx: FuContext): { fu: number; details: FuDetail[] } {
  const { groups, isMenzen, waitType, common, isPinfu } = ctx;
  const details: FuDetail[] = [];

  if (isPinfu && common.winType === 'tsumo') {
    return { fu: 20, details: [{ label: '平和・自摸(固定)', fu: 20 }] };
  }

  let fu = 20;
  details.push({ label: '副底', fu: 20 });

  if (isMenzen && common.winType === 'ron') {
    fu += 10;
    details.push({ label: '面前ロン', fu: 10 });
  }

  if (common.winType === 'tsumo') {
    fu += 2;
    details.push({ label: '自摸', fu: 2 });
  }

  const thePair = groups.find((g) => g.type === 'pair')!;
  let pairFu = 0;
  if (thePair.suit === 'z') {
    if (thePair.startRank >= 5 && thePair.startRank <= 7) {
      pairFu += 2;
    } else {
      if (thePair.startRank === common.seatWind) pairFu += 2;
      if (thePair.startRank === common.roundWind) pairFu += 2;
    }
  }
  if (pairFu > 0) {
    fu += pairFu;
    details.push({ label: `雀頭(${HONOR_NAMES[thePair.startRank]})`, fu: pairFu });
  }

  for (const g of groups) {
    if (g.type === 'run' || g.type === 'pair') continue;
    const termHonor = isTerminalOrHonorGroup(g);
    let setFu = 0;
    let label = '';
    const tileLabel = g.suit === 'z' ? HONOR_NAMES[g.startRank] : `${g.startRank}${g.suit}`;
    if (g.type === 'triplet') {
      if (g.concealed) {
        setFu = termHonor ? 8 : 4;
        label = `暗刻(${tileLabel})`;
      } else {
        setFu = termHonor ? 4 : 2;
        label = `明刻(${tileLabel})`;
      }
    } else if (g.type === 'quad') {
      if (g.concealed) {
        setFu = termHonor ? 32 : 16;
        label = `暗槓(${tileLabel})`;
      } else {
        setFu = termHonor ? 16 : 8;
        label = `明槓(${tileLabel})`;
      }
    }
    fu += setFu;
    details.push({ label, fu: setFu });
  }

  let waitFu = 0;
  let waitLabel = '';
  switch (waitType) {
    case 'kanchan':
      waitFu = 2;
      waitLabel = '嵌張待ち';
      break;
    case 'penchan':
      waitFu = 2;
      waitLabel = '辺張待ち';
      break;
    case 'tanki':
      waitFu = 2;
      waitLabel = '単騎待ち';
      break;
    case 'ryanmen':
      waitFu = 0;
      waitLabel = '両面待ち';
      break;
    case 'shanpon':
      waitFu = 0;
      waitLabel = 'シャンポン待ち';
      break;
  }
  details.push({ label: waitLabel, fu: waitFu });
  fu += waitFu;

  const rounded = Math.ceil(fu / 10) * 10;
  if (rounded !== fu) {
    details.push({ label: '切り上げ', fu: rounded - fu });
  }
  return { fu: rounded, details };
}
