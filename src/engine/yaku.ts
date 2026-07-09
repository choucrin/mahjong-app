import type { Group } from './decompose';
import type { CommonConditions, YakuResult } from './types';
import { HONOR_NAMES } from './tiles';

export type WaitType = 'ryanmen' | 'kanchan' | 'penchan' | 'tanki' | 'shanpon';

export interface YakuContext {
  groups: Group[]; // 5グループ(4面子+1雀頭)、和了牌による明刻補正済み
  waitType: WaitType;
  isMenzen: boolean; // 面前(チー・ポン・明槓なし。暗槓は可)
  common: CommonConditions;
  winningRank: number;
  winningSuit: 'm' | 'p' | 's' | 'z';
}

function isSimpleGroup(g: Group): boolean {
  if (g.suit === 'z') return false;
  return g.tiles.every((t) => {
    const rank = parseInt(t[0], 10);
    return rank >= 2 && rank <= 8;
  });
}

function isTerminalOrHonorGroup(g: Group): boolean {
  if (g.suit === 'z') return true;
  if (g.type === 'run') return g.startRank === 1 || g.startRank === 7;
  return g.startRank === 1 || g.startRank === 9;
}

function isTerminalGroupOnly(g: Group): boolean {
  // 老頭牌(1,9)のみを含むか(字牌は含まない)
  if (g.suit === 'z') return false;
  if (g.type === 'run') return false; // 順子は老頭のみで構成不可
  return g.startRank === 1 || g.startRank === 9;
}

// グループの構成牌が「すべて」么九牌(老頭牌+字牌)かどうか。
// 順子は必ず中張牌(2〜8)を含むため常にfalseになる(混老頭の判定用)。
// isTerminalOrHonorGroupは「么九牌を含むか(触れているか)」のみを見るため、
// 混全帯幺九・純全帯幺九の判定にのみ使用し、混老頭には使用しないこと。
function isPureTerminalOrHonorGroup(g: Group): boolean {
  if (g.suit === 'z') return true;
  if (g.type === 'run') return false;
  return g.startRank === 1 || g.startRank === 9;
}

function sets(groups: Group[]): Group[] {
  return groups.filter((g) => g.type !== 'pair');
}
function pair(groups: Group[]): Group {
  return groups.find((g) => g.type === 'pair')!;
}

export function evaluateYaku(ctx: YakuContext): YakuResult[] {
  const { groups, common, isMenzen, waitType } = ctx;
  const result: YakuResult[] = [];
  const theSets = sets(groups);
  const thePair = pair(groups);
  const allGroups = groups;

  const allRuns = theSets.every((g) => g.type === 'run');
  const allTriplets = theSets.every((g) => g.type === 'triplet' || g.type === 'quad');
  const isOpen = !isMenzen;

  // ---- 状況役 ----
  if (common.isTenho) result.push({ name: '天和', han: 13, isYakuman: true });
  if (common.isChiho) result.push({ name: '地和', han: 13, isYakuman: true });

  if (!common.isTenho && !common.isChiho) {
    if (common.isDoubleRiichi) result.push({ name: 'ダブル立直', han: 2, isYakuman: false });
    else if (common.isRiichi) result.push({ name: '立直', han: 1, isYakuman: false });
    if (common.isIppatsu && (common.isRiichi || common.isDoubleRiichi))
      result.push({ name: '一発', han: 1, isYakuman: false });
  }
  if (common.isRinshan) result.push({ name: '嶺上開花', han: 1, isYakuman: false });
  if (common.isChankan) result.push({ name: '槍槓', han: 1, isYakuman: false });
  if (common.isHaitei) result.push({ name: '海底摸月', han: 1, isYakuman: false });
  if (common.isHoutei) result.push({ name: '河底撈魚', han: 1, isYakuman: false });

  if (isMenzen && common.winType === 'tsumo' && !common.isTenho && !common.isChiho) {
    result.push({ name: '門前清自摸和', han: 1, isYakuman: false });
  }

  // ---- 大四喜・小四喜・大三元・字一色・緑一色・清老頭・四槓子 (役満) ----
  const windGroups = theSets.filter((g) => g.suit === 'z' && g.startRank >= 1 && g.startRank <= 4);
  const dragonGroups = theSets.filter((g) => g.suit === 'z' && g.startRank >= 5 && g.startRank <= 7);
  const quadCount = theSets.filter((g) => g.type === 'quad').length;

  if (windGroups.length === 4) {
    result.push({ name: '大四喜', han: 26, isYakuman: true });
  } else if (windGroups.length === 3 && thePair.suit === 'z' && thePair.startRank >= 1 && thePair.startRank <= 4) {
    result.push({ name: '小四喜', han: 13, isYakuman: true });
  }

  if (dragonGroups.length === 3) {
    result.push({ name: '大三元', han: 13, isYakuman: true });
  }

  const allHonor = allGroups.every((g) => g.suit === 'z');
  if (allHonor) result.push({ name: '字一色', han: 13, isYakuman: true });

  const GREEN_TILES = new Set(['2s', '3s', '4s', '6s', '8s', '6z']);
  const allGreen = allGroups.every((g) => g.tiles.every((t) => GREEN_TILES.has(t)));
  if (allGreen) result.push({ name: '緑一色', han: 13, isYakuman: true });

  const allTerminalNoHonor =
    allGroups.every((g) => g.suit !== 'z') && allGroups.every((g) => isTerminalGroupOnly(g));
  if (allTerminalNoHonor) result.push({ name: '清老頭', han: 13, isYakuman: true });

  if (quadCount === 4) result.push({ name: '四槓子', han: 13, isYakuman: true });

  // 九蓮宝燈・純正九蓮宝燈
  if (isMenzen && !allGroups.some((g) => g.type === 'quad')) {
    const suitsUsedForChuuren = new Set(allGroups.map((g) => g.suit));
    if (suitsUsedForChuuren.size === 1 && !suitsUsedForChuuren.has('z')) {
      const counts = new Array(10).fill(0);
      for (const g of allGroups) {
        for (const t of g.tiles) counts[parseInt(t[0], 10)]++;
      }
      const hasFullRun = [2, 3, 4, 5, 6, 7, 8].every((r) => counts[r] >= 1);
      if (counts[1] >= 3 && counts[9] >= 3 && hasFullRun) {
        const template = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
        const remaining = [...counts];
        remaining[ctx.winningRank]--;
        const isJunsei =
          ctx.winningSuit !== 'z' &&
          [...suitsUsedForChuuren][0] === ctx.winningSuit &&
          template.every((v, r) => r === 0 || remaining[r] === v);
        result.push({
          name: isJunsei ? '純正九蓮宝燈' : '九蓮宝燈',
          han: isJunsei ? 26 : 13,
          isYakuman: true,
        });
      }
    }
  }

  // 四暗刻 (単騎なら二倍役満)
  const concealedTripletCount = theSets.filter(
    (g) => (g.type === 'triplet' || g.type === 'quad') && g.concealed
  ).length;
  if (allTriplets && concealedTripletCount === 4) {
    if (waitType === 'tanki') {
      result.push({ name: '四暗刻単騎', han: 26, isYakuman: true });
    } else {
      result.push({ name: '四暗刻', han: 13, isYakuman: true });
    }
  }

  const isYakumanHand = result.some((y) => y.isYakuman);
  if (isYakumanHand) {
    // 役満成立時は状況役(立直・自摸など)を含めず役満のみを計上する(合成役満は複合する)
    return result.filter((y) => y.isYakuman);
  }

  // ---- 通常役 ----
  if (isMenzen && allRuns && waitType === 'ryanmen') {
    const pairIsYakuhai =
      thePair.suit === 'z' &&
      (thePair.startRank >= 5 || thePair.startRank === common.seatWind || thePair.startRank === common.roundWind);
    if (!pairIsYakuhai) {
      result.push({ name: '平和', han: 1, isYakuman: false });
    }
  }

  const allSimple = allGroups.every((g) => isSimpleGroup(g));
  if (allSimple) result.push({ name: '断幺九', han: 1, isYakuman: false });

  // 一盃口・二盃口
  if (isMenzen) {
    const runKeys = theSets.filter((g) => g.type === 'run').map((g) => `${g.suit}${g.startRank}`);
    const counts = new Map<string, number>();
    for (const k of runKeys) counts.set(k, (counts.get(k) ?? 0) + 1);
    const pairSetCount = [...counts.values()].filter((v) => v >= 2).length;
    if (pairSetCount >= 2) {
      result.push({ name: '二盃口', han: 3, isYakuman: false });
    } else if (pairSetCount === 1) {
      result.push({ name: '一盃口', han: 1, isYakuman: false });
    }
  }

  // 役牌
  for (const g of theSets) {
    if (g.type !== 'triplet' && g.type !== 'quad') continue;
    if (g.suit !== 'z') continue;
    if (g.startRank >= 5 && g.startRank <= 7) {
      const names: Record<number, string> = { 5: '白', 6: '發', 7: '中' };
      result.push({ name: `役牌(${names[g.startRank]})`, han: 1, isYakuman: false });
    } else {
      if (g.startRank === common.seatWind) {
        result.push({ name: `自風(${HONOR_NAMES[g.startRank]})`, han: 1, isYakuman: false });
      }
      if (g.startRank === common.roundWind) {
        result.push({ name: `場風(${HONOR_NAMES[g.startRank]})`, han: 1, isYakuman: false });
      }
    }
  }

  // 三色同刻
  {
    const bySuit: Record<string, Set<number>> = { m: new Set(), p: new Set(), s: new Set() };
    for (const g of theSets) {
      if ((g.type === 'triplet' || g.type === 'quad') && g.suit !== 'z') bySuit[g.suit].add(g.startRank);
    }
    let found = false;
    for (let r = 1; r <= 9; r++) {
      if (bySuit.m.has(r) && bySuit.p.has(r) && bySuit.s.has(r)) found = true;
    }
    if (found) result.push({ name: '三色同刻', han: 2, isYakuman: false });
  }

  // 三槓子
  if (quadCount === 3) result.push({ name: '三槓子', han: 2, isYakuman: false });

  // 対々和
  if (allTriplets) result.push({ name: '対々和', han: 2, isYakuman: false });

  // 三暗刻
  if (concealedTripletCount === 3) result.push({ name: '三暗刻', han: 2, isYakuman: false });

  // 小三元
  if (dragonGroups.length === 2 && thePair.suit === 'z' && thePair.startRank >= 5 && thePair.startRank <= 7) {
    result.push({ name: '小三元', han: 2, isYakuman: false });
  }

  // 混老頭(すべての牌が么九牌であること。順子を含む手は対象外)
  const allPureTerminalOrHonor = allGroups.every((g) => isPureTerminalOrHonorGroup(g));
  if (allPureTerminalOrHonor && !allHonor && !allTerminalNoHonor) {
    result.push({ name: '混老頭', han: 2, isYakuman: false });
  }

  // 混全帯幺九・純全帯幺九
  const allSetsHaveTerminalOrHonor = allGroups.every((g) => isTerminalOrHonorGroup(g));
  const hasHonorGroup = allGroups.some((g) => g.suit === 'z');
  if (allSetsHaveTerminalOrHonor) {
    if (hasHonorGroup) {
      result.push({ name: '混全帯幺九', han: isOpen ? 1 : 2, isYakuman: false });
    } else {
      result.push({ name: '純全帯幺九', han: isOpen ? 2 : 3, isYakuman: false });
    }
  }

  // 一気通貫
  {
    let found = false;
    for (const suit of ['m', 'p', 's'] as const) {
      const starts = new Set(
        theSets.filter((g) => g.type === 'run' && g.suit === suit).map((g) => g.startRank)
      );
      if (starts.has(1) && starts.has(4) && starts.has(7)) found = true;
    }
    if (found) result.push({ name: '一気通貫', han: isOpen ? 1 : 2, isYakuman: false });
  }

  // 三色同順
  {
    const bySuit: Record<string, Set<number>> = { m: new Set(), p: new Set(), s: new Set() };
    for (const g of theSets) {
      if (g.type === 'run') bySuit[g.suit].add(g.startRank);
    }
    let found = false;
    for (let r = 1; r <= 7; r++) {
      if (bySuit.m.has(r) && bySuit.p.has(r) && bySuit.s.has(r)) found = true;
    }
    if (found) result.push({ name: '三色同順', han: isOpen ? 1 : 2, isYakuman: false });
  }

  // 混一色・清一色
  {
    const suitsUsed = new Set(allGroups.map((g) => g.suit).filter((s) => s !== 'z'));
    const hasHonor = allGroups.some((g) => g.suit === 'z');
    if (suitsUsed.size === 1) {
      if (hasHonor) {
        result.push({ name: '混一色', han: isOpen ? 2 : 3, isYakuman: false });
      } else {
        result.push({ name: '清一色', han: isOpen ? 5 : 6, isYakuman: false });
      }
    }
  }

  return result;
}
