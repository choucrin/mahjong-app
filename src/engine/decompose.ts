import { parseTile, normalizeForShape } from './tiles';
import type { Meld } from './types';

export type GroupType = 'run' | 'triplet' | 'quad' | 'pair';

export interface Group {
  type: GroupType;
  suit: 'm' | 'p' | 's' | 'z';
  startRank: number; // runの場合は最小牌、それ以外は牌の数字
  tiles: string[]; // 表示用牌コード (赤5は反映しない、通常表記)
  isMeld: boolean; // 副露(チー・ポン・ミンカン)由来か
  meldType?: Meld['type'];
  concealed: boolean; // 暗刻・暗槓・面前の順子/対子はtrue。ミンコ/ミンカン/チーはfalse
  hasWinningTileCandidate: boolean; // 和了牌のランクを含みうるグループか(候補判定用)
}

export type HandDecomposition =
  | { kind: 'normal'; groups: Group[] }
  | { kind: 'chiitoi'; pairRanks: string[] } // 7対子: 各要素は "rank+suit" (例 "5p")
  | { kind: 'kokushi'; hasPair: boolean };

interface SuitSetResult {
  sets: { type: 'run' | 'triplet'; start: number }[];
  pairRank: number | null;
}

function decomposeSuitCounts(
  counts: number[],
  size: number,
  isHonor: boolean,
  allowPair: boolean
): SuitSetResult[] {
  const results: SuitSetResult[] = [];
  const c = [...counts];
  const sets: { type: 'run' | 'triplet'; start: number }[] = [];

  function rec(pairRank: number | null) {
    let i = 1;
    while (i <= size && c[i] === 0) i++;
    if (i > size) {
      results.push({ sets: [...sets], pairRank });
      return;
    }
    if (allowPair && pairRank === null && c[i] >= 2) {
      c[i] -= 2;
      rec(i);
      c[i] += 2;
    }
    if (c[i] >= 3) {
      c[i] -= 3;
      sets.push({ type: 'triplet', start: i });
      rec(pairRank);
      sets.pop();
      c[i] += 3;
    }
    if (!isHonor && i <= size - 2 && c[i] > 0 && c[i + 1] > 0 && c[i + 2] > 0) {
      c[i]--;
      c[i + 1]--;
      c[i + 2]--;
      sets.push({ type: 'run', start: i });
      rec(pairRank);
      sets.pop();
      c[i]++;
      c[i + 1]++;
      c[i + 2]++;
    }
  }
  rec(null);

  // 重複除去
  const seen = new Set<string>();
  const dedup: SuitSetResult[] = [];
  for (const r of results) {
    const key =
      r.pairRank +
      '|' +
      r.sets
        .map((s) => `${s.type}${s.start}`)
        .sort()
        .join(',');
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(r);
    }
  }
  return dedup;
}

function buildCounts(tiles: string[], suit: string, size: number): number[] {
  const counts = new Array(size + 1).fill(0);
  for (const t of tiles) {
    const p = parseTile(t);
    if (p.suit === suit) counts[p.rank]++;
  }
  return counts;
}

const SUITS: Array<{ suit: 'm' | 'p' | 's' | 'z'; size: number; isHonor: boolean }> = [
  { suit: 'm', size: 9, isHonor: false },
  { suit: 'p', size: 9, isHonor: false },
  { suit: 's', size: 9, isHonor: false },
  { suit: 'z', size: 7, isHonor: true },
];

function meldToGroup(meld: Meld): Group {
  const normalized = meld.tiles.map(normalizeForShape);
  const parsed = normalized.map(parseTile);
  const suit = parsed[0].suit;
  if (meld.type === 'chi') {
    const ranks = parsed.map((p) => p.rank).sort((a, b) => a - b);
    return {
      type: 'run',
      suit,
      startRank: ranks[0],
      tiles: normalized,
      isMeld: true,
      meldType: 'chi',
      concealed: false,
      hasWinningTileCandidate: false,
    };
  }
  if (meld.type === 'pon') {
    return {
      type: 'triplet',
      suit,
      startRank: parsed[0].rank,
      tiles: normalized,
      isMeld: true,
      meldType: 'pon',
      concealed: false,
      hasWinningTileCandidate: false,
    };
  }
  // kan
  return {
    type: 'quad',
    suit,
    startRank: parsed[0].rank,
    tiles: normalized,
    isMeld: true,
    meldType: meld.type,
    concealed: meld.type === 'ankan',
    hasWinningTileCandidate: false,
  };
}

function isChiitoiPossible(tiles14: string[], melds: Meld[]): HandDecomposition | null {
  if (melds.length > 0) return null;
  if (tiles14.length !== 14) return null;
  const norm = tiles14.map(normalizeForShape);
  const counts = new Map<string, number>();
  for (const t of norm) counts.set(t, (counts.get(t) ?? 0) + 1);
  if (counts.size !== 7) return null;
  for (const v of counts.values()) if (v !== 2) return null;
  return { kind: 'chiitoi', pairRanks: [...counts.keys()] };
}

function isKokushiPossible(tiles14: string[], melds: Meld[]): HandDecomposition | null {
  if (melds.length > 0) return null;
  if (tiles14.length !== 14) return null;
  const terminals = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
  const norm = tiles14.map(normalizeForShape);
  const counts = new Map<string, number>();
  for (const t of norm) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const t of norm) {
    if (!terminals.includes(t)) return null;
  }
  let hasPair = false;
  for (const term of terminals) {
    const c = counts.get(term) ?? 0;
    if (c === 0) return null;
    if (c >= 2) hasPair = true;
  }
  return { kind: 'kokushi', hasPair };
}

// concealedTiles(13-3*melds.length枚) + winningTile を渡す
export function decomposeHand(
  concealedTiles: string[],
  winningTile: string,
  melds: Meld[]
): { decompositions: HandDecomposition[]; error?: string } {
  const requiredConcealed = 13 - 3 * melds.length;
  if (concealedTiles.length !== requiredConcealed) {
    return {
      decompositions: [],
      error: `手牌の枚数が不正です(必要枚数: ${requiredConcealed}枚、現在: ${concealedTiles.length}枚)`,
    };
  }

  const all14 = [...concealedTiles, winningTile];
  const decompositions: HandDecomposition[] = [];

  const chiitoi = isChiitoiPossible(all14, melds);
  if (chiitoi) decompositions.push(chiitoi);
  const kokushi = isKokushiPossible(all14, melds);
  if (kokushi) decompositions.push(kokushi);

  const requiredSets = 4 - melds.length;
  const meldGroups = melds.map(meldToGroup);

  const normAll = [...concealedTiles, winningTile].map(normalizeForShape);
  const winningRank = parseTile(normalizeForShape(winningTile)).rank;
  const winningSuit = parseTile(normalizeForShape(winningTile)).suit;

  // 各スートごとの集合分解結果をキャッシュ (allowPairあり/なし両方)
  const suitResults: Record<string, { withPair: SuitSetResult[]; withoutPair: SuitSetResult[] }> = {};
  for (const s of SUITS) {
    const counts = buildCounts(normAll, s.suit, s.size);
    suitResults[s.suit] = {
      withPair: decomposeSuitCounts(counts, s.size, s.isHonor, true),
      withoutPair: decomposeSuitCounts(counts, s.size, s.isHonor, false),
    };
  }

  // 対子をどのスートに置くか全パターン試す
  for (const pairSuit of SUITS) {
    const pairSuitResults = suitResults[pairSuit.suit].withPair.filter((r) => r.pairRank !== null);
    if (pairSuitResults.length === 0) continue;

    const otherSuits = SUITS.filter((s) => s.suit !== pairSuit.suit);

    for (const pairResult of pairSuitResults) {
      // 各otherSuitの候補配列を作り、直積を取る
      const optionsPerSuit: SuitSetResult[][] = otherSuits.map((s) => suitResults[s.suit].withoutPair);
      // 直積生成
      const combos: SuitSetResult[][] = [[]];
      for (let idx = 0; idx < otherSuits.length; idx++) {
        const opts = optionsPerSuit[idx];
        const next: SuitSetResult[][] = [];
        for (const combo of combos) {
          for (const opt of opts) {
            next.push([...combo, opt]);
          }
        }
        combos.length = 0;
        combos.push(...next);
      }

      for (const combo of combos) {
        const groups: Group[] = [...meldGroups];
        let totalSets = 0;
        // pairSuit sets
        for (const set of pairResult.sets) {
          groups.push(
            buildConcealedGroup(pairSuit.suit, set, winningSuit === pairSuit.suit, winningRank)
          );
          totalSets++;
        }
        for (let idx = 0; idx < otherSuits.length; idx++) {
          const s = otherSuits[idx];
          const r = combo[idx];
          for (const set of r.sets) {
            groups.push(buildConcealedGroup(s.suit, set, winningSuit === s.suit, winningRank));
            totalSets++;
          }
        }
        if (totalSets !== requiredSets) continue;
        // pair group
        groups.push({
          type: 'pair',
          suit: pairSuit.suit,
          startRank: pairResult.pairRank as number,
          tiles: [
            `${pairResult.pairRank}${pairSuit.suit}`,
            `${pairResult.pairRank}${pairSuit.suit}`,
          ],
          isMeld: false,
          concealed: true,
          hasWinningTileCandidate: winningSuit === pairSuit.suit && winningRank === pairResult.pairRank,
        });
        decompositions.push({ kind: 'normal', groups });
      }
    }
  }

  if (decompositions.length === 0) {
    return { decompositions: [], error: 'この手牌は和了形として成立しません' };
  }

  return { decompositions };
}

function buildConcealedGroup(
  suit: 'm' | 'p' | 's' | 'z',
  set: { type: 'run' | 'triplet'; start: number },
  suitMatchesWinning: boolean,
  winningRank: number
): Group {
  const tiles: string[] =
    set.type === 'run'
      ? [`${set.start}${suit}`, `${set.start + 1}${suit}`, `${set.start + 2}${suit}`]
      : [`${set.start}${suit}`, `${set.start}${suit}`, `${set.start}${suit}`];
  const hasCandidate =
    suitMatchesWinning &&
    (set.type === 'run'
      ? winningRank >= set.start && winningRank <= set.start + 2
      : winningRank === set.start);
  return {
    type: set.type === 'run' ? 'run' : 'triplet',
    suit,
    startRank: set.start,
    tiles,
    isMeld: false,
    concealed: true,
    hasWinningTileCandidate: hasCandidate,
  };
}
