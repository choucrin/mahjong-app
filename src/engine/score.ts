import { decomposeHand, type Group } from './decompose';
import { evaluateYaku, type WaitType } from './yaku';
import { computeFu } from './fu';
import { parseTile, normalizeForShape } from './tiles';
import type { CalcError, CommonConditions, FuDetail, FuFactors, HandInput, ScoreBreakdown, YakuResult } from './types';

function nextDoraTile(indicator: string, ruleset: 'yonma' | 'sanma'): string {
  const { suit, rank } = parseTile(normalizeForShape(indicator));
  if (suit === 'z') {
    if (rank <= 4) {
      const next = rank === 4 ? 1 : rank + 1;
      return `${next}z`;
    }
    const next = rank === 7 ? 5 : rank + 1;
    return `${next}z`;
  }
  if (ruleset === 'sanma' && suit === 'm') {
    return rank === 1 ? '9m' : '1m';
  }
  const next = rank === 9 ? 1 : rank + 1;
  return `${next}${suit}`;
}

function countDora(allTiles: string[], indicators: string[], ruleset: 'yonma' | 'sanma'): number {
  const normalized = allTiles.map(normalizeForShape);
  let count = 0;
  for (const ind of indicators) {
    const doraTile = nextDoraTile(ind, ruleset);
    count += normalized.filter((t) => t === doraTile).length;
  }
  return count;
}

function countAka(allTiles: string[]): number {
  return allTiles.filter((t) => t[0] === '0').length;
}

function calcBasePoints(han: number, fu: number): number {
  if (han >= 11) return 6000;
  if (han >= 8) return 4000;
  if (han >= 6) return 3000;
  if (han >= 5) return 2000;
  let base = fu * Math.pow(2, 2 + han);
  if (base > 2000) base = 2000;
  return base;
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

function yakumanLabel(mult: number): string {
  if (mult === 1) return '役満';
  if (mult === 2) return 'ダブル役満';
  if (mult === 3) return 'トリプル役満';
  return `${mult}倍役満`;
}

function scoreName(han: number, fu: number, isYakuman: boolean, yakumanMultiplier: number): string | null {
  if (isYakuman) return yakumanLabel(yakumanMultiplier);
  const base = calcBasePoints(han, fu);
  if (base >= 6000) return '三倍満';
  if (base >= 4000) return '倍満';
  if (base >= 3000) return '跳満';
  if (base >= 2000) return '満貫';
  return null;
}

function calcPayment(
  base: number,
  isDealer: boolean,
  winType: 'ron' | 'tsumo',
  honba: number,
  kyotaku: number,
  ruleset: 'yonma' | 'sanma'
): { total: number; detail: string } {
  const numNonDealers = ruleset === 'yonma' ? 3 : 2;
  if (winType === 'ron') {
    const mult = isDealer ? 6 : 4;
    const pay = roundUp100(base * mult) + honba * 300;
    const total = pay + kyotaku * 1000;
    return { total, detail: `ロン ${pay}点 (本場込み)` };
  }
  if (isDealer) {
    const each = roundUp100(base * 2) + honba * 100;
    const total = each * numNonDealers + kyotaku * 1000;
    return { total, detail: `${each}点オール` };
  }
  const dealerPay = roundUp100(base * 2) + honba * 100;
  const otherPay = roundUp100(base * 1) + honba * 100;
  const total = dealerPay + otherPay * (numNonDealers - 1) + kyotaku * 1000;
  return { total, detail: `親${dealerPay}点 / 子${otherPay}点` };
}

interface Variant {
  yakuList: YakuResult[];
  han: number;
  fu: number;
  fuDetails: FuDetail[];
  isYakuman: boolean;
  yakumanMultiplier: number;
  groups?: Group[];
}

function buildBreakdown(v: Variant, common: CommonConditions, isDealer: boolean): ScoreBreakdown {
  const base = v.isYakuman ? 8000 * v.yakumanMultiplier : calcBasePoints(v.han, v.fu);
  const payment = calcPayment(base, isDealer, common.winType, common.honba, common.kyotaku, common.ruleset);
  const name = scoreName(v.han, v.fu, v.isYakuman, v.yakumanMultiplier);
  return {
    han: v.han,
    fu: v.fu,
    baseTenBucket: base,
    scoreName: name,
    totalPoints: payment.total,
    paymentDetail: payment.detail,
    yakuList: v.yakuList,
    fuDetails: v.fuDetails,
    isYakuman: v.isYakuman,
    yakumanMultiplier: v.yakumanMultiplier,
  };
}

function determineWaitType(g: Group, winningRank: number): WaitType {
  if (g.type === 'pair') return 'tanki';
  if (g.type === 'triplet') return 'shanpon';
  // run
  if (winningRank === g.startRank + 1) return 'kanchan';
  if (g.startRank === 1 && winningRank === g.startRank + 2) return 'penchan';
  if (g.startRank === 7 && winningRank === g.startRank) return 'penchan';
  return 'ryanmen';
}

function evaluateChiitoiYaku(pairRanks: string[], common: CommonConditions): YakuResult[] {
  if (common.isTenho) return [{ name: '天和', han: 13, isYakuman: true }];
  if (common.isChiho) return [{ name: '地和', han: 13, isYakuman: true }];
  const allHonor = pairRanks.every((r) => r.endsWith('z'));
  if (allHonor) return [{ name: '字一色', han: 13, isYakuman: true }];

  const result: YakuResult[] = [];
  if (common.isDoubleRiichi) result.push({ name: 'ダブル立直', han: 2, isYakuman: false });
  else if (common.isRiichi) result.push({ name: '立直', han: 1, isYakuman: false });
  if (common.isIppatsu && (common.isRiichi || common.isDoubleRiichi))
    result.push({ name: '一発', han: 1, isYakuman: false });
  if (common.isHaitei) result.push({ name: '海底摸月', han: 1, isYakuman: false });
  if (common.isHoutei) result.push({ name: '河底撈魚', han: 1, isYakuman: false });
  if (common.winType === 'tsumo') result.push({ name: '門前清自摸和', han: 1, isYakuman: false });
  result.push({ name: '七対子', han: 2, isYakuman: false });

  const allSimple = pairRanks.every((r) => {
    if (r.endsWith('z')) return false;
    const rank = parseInt(r[0], 10);
    return rank >= 2 && rank <= 8;
  });
  if (allSimple) result.push({ name: '断幺九', han: 1, isYakuman: false });

  const allTermHonor = pairRanks.every((r) => {
    if (r.endsWith('z')) return true;
    const rank = parseInt(r[0], 10);
    return rank === 1 || rank === 9;
  });
  if (allTermHonor) result.push({ name: '混老頭', han: 2, isYakuman: false });

  const suitsUsed = new Set(pairRanks.filter((r) => !r.endsWith('z')).map((r) => r[1]));
  const hasHonor = pairRanks.some((r) => r.endsWith('z'));
  if (suitsUsed.size === 1) {
    result.push(hasHonor ? { name: '混一色', han: 3, isYakuman: false } : { name: '清一色', han: 6, isYakuman: false });
  }
  return result;
}

export function calculateScore(input: HandInput): ScoreBreakdown | CalcError {
  const { concealedTiles, winningTile, melds, common, doraIndicators, uraDoraIndicators } = input;
  const { decompositions, error } = decomposeHand(concealedTiles, winningTile, melds);
  if (error) return { message: error };

  const isDealer = common.seatWind === 1;
  const isMenzen = melds.every((m) => m.type === 'ankan');
  const allTiles = [...concealedTiles, winningTile, ...melds.flatMap((m) => m.tiles)];
  const doraCount = countDora(allTiles, doraIndicators, common.ruleset);
  const uraDoraCount =
    common.isRiichi || common.isDoubleRiichi ? countDora(allTiles, uraDoraIndicators, common.ruleset) : 0;
  const akaCount = countAka(allTiles);
  const doraYakuEntries: YakuResult[] = [];
  if (doraCount > 0) doraYakuEntries.push({ name: `ドラ`, han: doraCount, isYakuman: false });
  if (uraDoraCount > 0) doraYakuEntries.push({ name: `裏ドラ`, han: uraDoraCount, isYakuman: false });
  if (akaCount > 0) doraYakuEntries.push({ name: `赤ドラ`, han: akaCount, isYakuman: false });

  const variants: Variant[] = [];

  for (const decomp of decompositions) {
    if (decomp.kind === 'kokushi') {
      variants.push(buildKokushiVariant(input));
      continue;
    }
    if (decomp.kind === 'chiitoi') {
      const yakuList = evaluateChiitoiYaku(decomp.pairRanks, common);
      if (yakuList.length === 0) continue;
      const isYakuman = yakuList.some((y) => y.isYakuman);
      if (isYakuman) {
        const mult = yakuList.reduce((s, y) => s + (y.isYakuman ? y.han : 0), 0) / 13;
        variants.push({ yakuList, han: mult * 13, fu: 0, fuDetails: [], isYakuman: true, yakumanMultiplier: mult });
        continue;
      }
      const withDora = [...yakuList, ...doraYakuEntries];
      const han = withDora.reduce((s, y) => s + y.han, 0);
      variants.push({
        yakuList: withDora,
        han,
        fu: 25,
        fuDetails: [{ label: '七対子(固定)', fu: 25 }],
        isYakuman: false,
        yakumanMultiplier: 0,
      });
      continue;
    }

    // normal
    const winningParsed = parseTile(normalizeForShape(winningTile));
    const winningRankNorm = winningParsed.rank;
    const candidateIdx = decomp.groups
      .map((g, i) => ({ g, i }))
      .filter(({ g }) => g.hasWinningTileCandidate && !g.isMeld);

    for (const { i } of candidateIdx) {
      const clonedGroups: Group[] = decomp.groups.map((g) => ({ ...g }));
      const target = clonedGroups[i];
      const waitType = determineWaitType(target, winningRankNorm);
      if (target.type === 'triplet' && common.winType === 'ron') {
        target.concealed = false;
      }
      const yakuList = evaluateYaku({
        groups: clonedGroups,
        waitType,
        isMenzen,
        common,
        winningRank: winningRankNorm,
        winningSuit: winningParsed.suit,
      });
      if (yakuList.length === 0) continue;
      const isYakuman = yakuList.some((y) => y.isYakuman);
      if (isYakuman) {
        const mult = yakuList.reduce((s, y) => s + (y.isYakuman ? y.han : 0), 0) / 13;
        variants.push({
          yakuList,
          han: mult * 13,
          fu: 0,
          fuDetails: [],
          isYakuman: true,
          yakumanMultiplier: mult,
          groups: clonedGroups,
        });
        continue;
      }
      const isPinfu = yakuList.some((y) => y.name === '平和');
      const { fu, details } = computeFu({ groups: clonedGroups, isMenzen, waitType, common, isPinfu });
      const withDora = [...yakuList, ...doraYakuEntries];
      const han = withDora.reduce((s, y) => s + y.han, 0);
      variants.push({
        yakuList: withDora,
        han,
        fu,
        fuDetails: details,
        isYakuman: false,
        yakumanMultiplier: 0,
        groups: clonedGroups,
      });
    }
  }

  if (variants.length === 0) {
    return { message: '役が成立しないため和了できません' };
  }

  let best = variants[0];
  let bestBreakdown = buildBreakdown(best, common, isDealer);
  for (const v of variants.slice(1)) {
    const bd = buildBreakdown(v, common, isDealer);
    if (bd.totalPoints > bestBreakdown.totalPoints) {
      best = v;
      bestBreakdown = bd;
    }
  }
  return bestBreakdown;
}

function buildKokushiVariant(input: HandInput): Variant {
  const { concealedTiles, winningTile, common } = input;
  const all13 = [...concealedTiles].map(normalizeForShape);
  const win = normalizeForShape(winningTile);
  const counts = new Map<string, number>();
  for (const t of [...all13, win]) counts.set(t, (counts.get(t) ?? 0) + 1);
  const pairTile = [...counts.entries()].find(([, c]) => c === 2)?.[0];
  const isThirteenWait = pairTile === win;
  const name = isThirteenWait ? '国士無双十三面待ち' : '国士無双';
  const han = isThirteenWait ? 26 : 13;
  if (common.isTenho || common.isChiho) {
    const specialName = common.isTenho ? '天和' : '地和';
    return {
      yakuList: [
        { name, han, isYakuman: true },
        { name: specialName, han: 13, isYakuman: true },
      ],
      han: han + 13,
      fu: 0,
      fuDetails: [],
      isYakuman: true,
      yakumanMultiplier: (han + 13) / 13,
    };
  }
  return {
    yakuList: [{ name, han, isYakuman: true }],
    han,
    fu: 0,
    fuDetails: [],
    isYakuman: true,
    yakumanMultiplier: han / 13,
  };
}

// ---- 中級者・上級者モード向け: 翻数・符数を直接指定して点数を求める ----
export function calculateScoreFromHanFu(
  han: number,
  fu: number,
  common: CommonConditions,
  isYakuman = false,
  yakumanMultiplier = 1,
  yakuList: YakuResult[] = [],
  fuDetails: FuDetail[] = []
): ScoreBreakdown {
  const isDealer = common.seatWind === 1;
  const roundedFu = Math.ceil(fu / 10) * 10;
  const v: Variant = {
    yakuList,
    han,
    fu: roundedFu,
    fuDetails,
    isYakuman,
    yakumanMultiplier: isYakuman ? yakumanMultiplier : 0,
  };
  return buildBreakdown(v, common, isDealer);
}

// ---- 中級者モード向け: 符の構成要素から符数を導出する ----
export function calculateFuFromFactors(f: FuFactors, winType: 'ron' | 'tsumo'): { fu: number; details: FuDetail[] } {
  if (f.isChiitoitsu) {
    return { fu: 25, details: [{ label: '七対子(固定)', fu: 25 }] };
  }
  if (f.isPinfu) {
    if (winType === 'tsumo') return { fu: 20, details: [{ label: '平和・自摸(固定)', fu: 20 }] };
    return { fu: 30, details: [{ label: '平和・ロン(固定)', fu: 30 }] };
  }

  const details: FuDetail[] = [{ label: '副底', fu: 20 }];
  let fu = 20;

  if (f.isMenzen && winType === 'ron') {
    fu += 10;
    details.push({ label: '面前ロン', fu: 10 });
  }
  if (winType === 'tsumo') {
    fu += 2;
    details.push({ label: '自摸', fu: 2 });
  }

  const tripletFuTable: Array<[keyof FuFactors, number, string]> = [
    ['simpleOpenTriplet', 2, '明刻(中張牌)'],
    ['simpleClosedTriplet', 4, '暗刻(中張牌)'],
    ['terminalOpenTriplet', 4, '明刻(么九牌)'],
    ['terminalClosedTriplet', 8, '暗刻(么九牌)'],
    ['simpleOpenQuad', 8, '明槓(中張牌)'],
    ['simpleClosedQuad', 16, '暗槓(中張牌)'],
    ['terminalOpenQuad', 16, '明槓(么九牌)'],
    ['terminalClosedQuad', 32, '暗槓(么九牌)'],
  ];
  for (const [key, unitFu, label] of tripletFuTable) {
    const count = f[key] as number;
    if (count > 0) {
      fu += unitFu * count;
      details.push({ label: `${label} x${count}`, fu: unitFu * count });
    }
  }

  if (f.pairFuType === 'yakuhai_single') {
    fu += 2;
    details.push({ label: '雀頭(役牌)', fu: 2 });
  } else if (f.pairFuType === 'yakuhai_double') {
    fu += 4;
    details.push({ label: '雀頭(連風牌)', fu: 4 });
  }

  const waitFuTable: Record<FuFactors['waitType'], number> = {
    ryanmen: 0,
    shanpon: 0,
    kanchan: 2,
    penchan: 2,
    tanki: 2,
  };
  const waitLabelTable: Record<FuFactors['waitType'], string> = {
    ryanmen: '両面待ち',
    shanpon: 'シャンポン待ち',
    kanchan: '嵌張待ち',
    penchan: '辺張待ち',
    tanki: '単騎待ち',
  };
  const wFu = waitFuTable[f.waitType];
  fu += wFu;
  details.push({ label: waitLabelTable[f.waitType], fu: wFu });

  const rounded = Math.ceil(fu / 10) * 10;
  if (rounded !== fu) {
    details.push({ label: '切り上げ', fu: rounded - fu });
  }
  return { fu: rounded, details };
}
