import { defaultCommonConditions } from '../engine';
import type { CommonConditions, HandInput, Meld, MeldType, Ruleset } from '../engine';

export interface PracticeProblem extends HandInput {
  id: string;
  hint: string;
}

let autoId = 0;

// ---- 牌配列を組み立てるヘルパー ----
function run(suit: 'm' | 'p' | 's', start: number): string[] {
  return [start, start + 1, start + 2].map((r) => `${r}${suit}`);
}
function tripletOf(suit: string, rank: number): string[] {
  return [rank, rank, rank].map((r) => `${r}${suit}`);
}
function quadOf(suit: string, rank: number): string[] {
  return [rank, rank, rank, rank].map((r) => `${r}${suit}`);
}
function pairOf(suit: string, rank: number): string[] {
  return [rank, rank].map((r) => `${r}${suit}`);
}
function withRed(tiles: string[], rank: number, suit: string): string[] {
  const idx = tiles.indexOf(`${rank}${suit}`);
  if (idx === -1) throw new Error(`withRed: ${rank}${suit} が見つかりません`);
  const copy = [...tiles];
  copy[idx] = `0${suit}`;
  return copy;
}

function mkProblem(opts: {
  sets: string[][];
  pair: string[];
  winningTile: string;
  hint: string;
  melds?: { type: MeldType; tiles: string[] }[];
  common?: Partial<CommonConditions>;
  dora?: string[];
  ura?: string[];
  ruleset?: Ruleset;
}): PracticeProblem {
  autoId++;
  const ruleset = opts.ruleset ?? 'yonma';
  const combined = [...opts.sets.flat(), ...opts.pair];
  const idx = combined.indexOf(opts.winningTile);
  if (idx === -1) {
    throw new Error(`問題${autoId}(${opts.hint}): 和了牌 ${opts.winningTile} が手牌に含まれていません`);
  }
  const concealedTiles = [...combined.slice(0, idx), ...combined.slice(idx + 1)];
  const melds: Meld[] = (opts.melds ?? []).map((m, i) => ({
    id: `p${autoId}-m${i}`,
    type: m.type,
    tiles: m.tiles,
  }));
  const base = defaultCommonConditions(ruleset);
  const common: CommonConditions = { ...base, ...opts.common, ruleset };
  return {
    id: `problem-${autoId}`,
    hint: opts.hint,
    concealedTiles,
    winningTile: opts.winningTile,
    melds,
    common,
    doraIndicators: opts.dora ?? [],
    uraDoraIndicators: opts.ura ?? [],
  };
}

function mkChiitoiProblem(opts: {
  pairs: string[]; // 7種類の牌コード
  winningTile: string;
  hint: string;
  common?: Partial<CommonConditions>;
  dora?: string[];
  ura?: string[];
  ruleset?: Ruleset;
}): PracticeProblem {
  autoId++;
  const ruleset = opts.ruleset ?? 'yonma';
  const combined = opts.pairs.flatMap((p) => [p, p]);
  const idx = combined.indexOf(opts.winningTile);
  if (idx === -1) {
    throw new Error(`問題${autoId}(七対子, ${opts.hint}): 和了牌が手牌に含まれていません`);
  }
  const concealedTiles = [...combined.slice(0, idx), ...combined.slice(idx + 1)];
  const base = defaultCommonConditions(ruleset);
  const common: CommonConditions = { ...base, ...opts.common, ruleset };
  return {
    id: `problem-${autoId}`,
    hint: opts.hint,
    concealedTiles,
    winningTile: opts.winningTile,
    melds: [],
    common,
    doraIndicators: opts.dora ?? [],
    uraDoraIndicators: opts.ura ?? [],
  };
}

function mkKokushiProblem(opts: {
  extraPairTile: string; // 13種のうち対子になる牌
  winningTile: string;
  hint: string;
  common?: Partial<CommonConditions>;
}): PracticeProblem {
  autoId++;
  const terminals = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
  const combined = [...terminals, opts.extraPairTile];
  const idx = combined.indexOf(opts.winningTile);
  if (idx === -1) {
    throw new Error(`問題${autoId}(国士無双, ${opts.hint}): 和了牌が手牌に含まれていません`);
  }
  const concealedTiles = [...combined.slice(0, idx), ...combined.slice(idx + 1)];
  const base = defaultCommonConditions('yonma');
  const common: CommonConditions = { ...base, ...opts.common, ruleset: 'yonma' };
  return {
    id: `problem-${autoId}`,
    hint: opts.hint,
    concealedTiles,
    winningTile: opts.winningTile,
    melds: [],
    common,
    doraIndicators: [],
    uraDoraIndicators: [],
  };
}

export const PRACTICE_PROBLEMS: PracticeProblem[] = [
  // ---- Tier1: 基礎 (単一の役、鳴きなし、ドラなし) ----
  mkProblem({
    sets: [run('p', 2), run('p', 4), run('s', 6), run('m', 3)],
    pair: pairOf('s', 9),
    winningTile: '4p',
    hint: '平和のみのシンプルな手',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('p', 4), run('s', 6), tripletOf('z', 2)],
    pair: pairOf('z', 5),
    winningTile: '2m',
    hint: '役牌(白)のみ',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('p', 3), run('s', 4), tripletOf('s', 8)],
    pair: pairOf('p', 6),
    winningTile: '4s',
    hint: '断幺九のみ(すべて2〜8)',
    common: { winType: 'tsumo', seatWind: 3, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 4), run('s', 7), run('m', 2)],
    pair: pairOf('s', 5),
    winningTile: '1m',
    hint: '立直のみ(役牌なし)',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 7), tripletOf('s', 1), run('s', 7)],
    pair: pairOf('m', 9),
    winningTile: '1s',
    hint: '混全帯幺九(チャンタ)',
    common: { winType: 'ron', seatWind: 4, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('m', 2), run('m', 3), run('m', 4)],
    pair: pairOf('m', 7),
    winningTile: '6m',
    hint: '清一色(萬子だけの手)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 4), run('s', 4), run('m', 4), tripletOf('z', 7)],
    pair: pairOf('p', 8),
    winningTile: '6s',
    hint: '役牌(中)の基本形',
    common: { winType: 'tsumo', seatWind: 1, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('p', 1), tripletOf('s', 1), tripletOf('z', 1)],
    pair: pairOf('s', 9),
    winningTile: '1z',
    hint: '対々和+混老頭',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('s', 2), run('s', 2), run('p', 4), run('p', 4)],
    pair: pairOf('m', 2),
    winningTile: '4p',
    hint: '二盃口',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 1), run('p', 1), run('m', 4), run('s', 7)],
    pair: pairOf('z', 3),
    winningTile: '1p',
    hint: '一盃口(雀頭は役牌ではない)',
    common: { winType: 'ron', seatWind: 4, roundWind: 1 },
  }),

  // ---- Tier2: 立直+複合役、ツモ・ロン混在、ドラあり ----
  mkProblem({
    sets: [run('m', 2), run('p', 5), run('s', 2), run('s', 4)],
    pair: pairOf('s', 3),
    winningTile: '5p',
    hint: '立直+平和+ドラ',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
    dora: ['6p'],
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 1), run('s', 1), tripletOf('z', 1)],
    pair: pairOf('z', 2),
    winningTile: '1s',
    hint: 'ダブル立直+三色同順+混全帯幺九',
    common: { winType: 'ron', isDoubleRiichi: true, seatWind: 1, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 7), run('p', 7), run('s', 7), tripletOf('z', 1)],
    pair: pairOf('z', 7),
    winningTile: '9s',
    hint: '三色同順(789)+混全帯幺九',
    common: { winType: 'tsumo', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('p', 2), run('s', 2), run('p', 5)],
    pair: pairOf('m', 8),
    winningTile: '4s',
    hint: '三色同順(234)+平和+立直+一発',
    common: { winType: 'ron', isRiichi: true, isIppatsu: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('p', 1), tripletOf('s', 1), run('s', 2)],
    pair: pairOf('z', 5),
    winningTile: '2s',
    hint: '三色同刻+役牌の複合',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('s', 1), run('s', 4), run('s', 7), run('m', 2)],
    pair: pairOf('m', 5),
    winningTile: '7s',
    hint: '一気通貫(索子)+ツモ+立直',
    common: { winType: 'tsumo', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('s', 2), tripletOf('s', 3), tripletOf('s', 4), tripletOf('z', 6)],
    pair: pairOf('s', 9),
    winningTile: '4s',
    hint: '三暗刻+役牌',
    common: { winType: 'tsumo', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('p', 3), tripletOf('p', 4), tripletOf('p', 5), run('m', 4)],
    pair: pairOf('p', 2),
    winningTile: '4p',
    hint: '三暗刻(同色の暗刻3つ)',
    common: { winType: 'tsumo', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('p', 1), tripletOf('p', 9), tripletOf('s', 1), tripletOf('s', 9)],
    pair: pairOf('z', 1),
    winningTile: '9s',
    hint: '混老頭+対々和(雀頭は字牌)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 4), run('m', 4), run('p', 7), run('s', 1)],
    pair: pairOf('z', 6),
    winningTile: '4m',
    hint: '一盃口+役牌(發)+立直',
    common: { winType: 'ron', isRiichi: true, seatWind: 3, roundWind: 2 },
  }),
  mkProblem({
    sets: [run('m', 2), run('m', 2), run('p', 3), run('s', 6)],
    pair: pairOf('z', 7),
    winningTile: '4m',
    hint: '一盃口+役牌(中)+ドラ',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
    dora: ['3m'],
  }),
  mkProblem({
    sets: [run('p', 1), run('p', 4), run('p', 7), run('s', 1)],
    pair: pairOf('s', 5),
    winningTile: '8p',
    hint: '筒子中心の手+ドラ',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
    dora: ['4s'],
  }),
  mkProblem({
    sets: [run('p', 1), run('p', 4), run('p', 7), tripletOf('z', 1)],
    pair: pairOf('z', 5),
    winningTile: '9p',
    hint: '混一色+役牌',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 1), run('p', 2), run('p', 3), run('p', 4)],
    pair: pairOf('p', 7),
    winningTile: '6p',
    hint: '清一色+立直+一発+ツモ',
    common: { winType: 'tsumo', isRiichi: true, isIppatsu: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 3), run('p', 6), run('s', 2), run('s', 4)],
    pair: pairOf('p', 9),
    winningTile: '4s',
    hint: '嵌張待ちの立直(平和にならない形)',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 4), run('s', 7), run('m', 3)],
    pair: pairOf('z', 2),
    winningTile: '3m',
    hint: '嶺上開花(槓後のツモ和了)',
    common: { winType: 'tsumo', isRinshan: true, isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 4), run('s', 7), run('m', 3)],
    pair: pairOf('z', 3),
    winningTile: '5p',
    hint: '河底撈魚(最後の1枚でロン)',
    common: { winType: 'ron', isHoutei: true, isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 4), run('s', 7), run('m', 3)],
    pair: pairOf('z', 4),
    winningTile: '9s',
    hint: '海底摸月(最後の1枚でツモ)',
    common: { winType: 'tsumo', isHaitei: true, isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 4), run('s', 7), run('m', 3)],
    pair: pairOf('z', 2),
    winningTile: '2z',
    hint: '槍槓(他家の加槓を横取り)',
    common: { winType: 'ron', isChankan: true, seatWind: 3, roundWind: 1 },
  }),

  // ---- Tier3: 鳴きあり(副露)の手 ----
  mkProblem({
    sets: [run('m', 5), run('p', 7)],
    pair: pairOf('s', 5),
    winningTile: '5m',
    melds: [{ type: 'pon', tiles: tripletOf('z', 6) }, { type: 'chi', tiles: run('s', 1) }],
    hint: '副露あり・役牌(發)のポン',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('p', 4)],
    pair: pairOf('p', 8),
    winningTile: '2m',
    melds: [{ type: 'pon', tiles: tripletOf('z', 5) }, { type: 'chi', tiles: run('s', 7) }],
    hint: '副露あり・役牌(白)のポン',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('p', 4)],
    pair: pairOf('m', 5),
    winningTile: '3m',
    melds: [{ type: 'chi', tiles: run('s', 2) }, { type: 'chi', tiles: run('p', 6) }],
    hint: '副露あり・断幺九のみ(食いタン)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 1)],
    pair: pairOf('m', 9),
    winningTile: '1p',
    melds: [
      { type: 'chi', tiles: run('m', 1) },
      { type: 'chi', tiles: run('s', 1) },
      { type: 'pon', tiles: tripletOf('z', 1) },
    ],
    hint: '副露あり・混全帯幺九(食い下がり1翻)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 7)],
    pair: pairOf('m', 1),
    winningTile: '7p',
    melds: [
      { type: 'chi', tiles: run('m', 1) },
      { type: 'chi', tiles: run('s', 1) },
      { type: 'chi', tiles: run('s', 7) },
    ],
    hint: '副露あり・純全帯幺九(食い下がり2翻)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 1), tripletOf('p', 9)],
    pair: pairOf('z', 5),
    winningTile: '1p',
    melds: [{ type: 'chi', tiles: run('p', 4) }, { type: 'pon', tiles: tripletOf('z', 2) }],
    hint: '副露あり・混一色(食い下がり2翻)+役牌',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('p', 4), run('p', 7), tripletOf('p', 9)],
    pair: pairOf('p', 2),
    winningTile: '7p',
    melds: [{ type: 'chi', tiles: run('p', 1) }],
    hint: '副露あり・清一色(食い下がり5翻)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 4), run('s', 7)],
    pair: pairOf('m', 2),
    winningTile: '4m',
    melds: [{ type: 'minkan', tiles: quadOf('z', 5) }, { type: 'chi', tiles: run('p', 3) }],
    hint: '副露あり・明槓(白)を含む手',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('p', 4), tripletOf('z', 3)],
    pair: pairOf('s', 7),
    winningTile: '2m',
    melds: [{ type: 'ankan', tiles: quadOf('s', 3) }],
    hint: '副露あり・暗槓を含む手(暗槓は面前扱い)',
    common: { winType: 'tsumo', isRiichi: true, seatWind: 3, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('s', 1)],
    pair: pairOf('m', 5),
    winningTile: '1s',
    melds: [
      { type: 'pon', tiles: tripletOf('z', 3) },
      { type: 'pon', tiles: tripletOf('m', 2) },
      { type: 'chi', tiles: run('p', 7) },
    ],
    hint: '副露あり・役牌(自風=西)',
    common: { winType: 'ron', seatWind: 3, roundWind: 1 },
  }),

  // ---- Tier4: 七対子・複合役 ----
  mkChiitoiProblem({
    pairs: ['2m', '5p', '7s', '3p', '8m', '1z', '6s'],
    winningTile: '5p',
    hint: '七対子の基本形',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkChiitoiProblem({
    pairs: ['2m', '3p', '4s', '5m', '6p', '7s', '8m'],
    winningTile: '3p',
    hint: '七対子+断幺九',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkChiitoiProblem({
    pairs: ['1p', '3p', '5p', '7p', '9p', '2z', '4z'],
    winningTile: '5p',
    hint: '七対子+混一色',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkChiitoiProblem({
    pairs: ['1z', '2z', '3z', '4z', '5z', '6z', '7z'],
    winningTile: '4z',
    hint: '七対子形の字一色(役満)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 1), run('s', 1), run('m', 4)],
    pair: pairOf('z', 6),
    winningTile: '1p',
    hint: '三色同順(123)のみ',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('p', 1), tripletOf('s', 1), run('p', 4)],
    pair: pairOf('s', 8),
    winningTile: '1s',
    hint: '三色同刻(111)のみ',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('m', 3), tripletOf('p', 5), tripletOf('s', 7), tripletOf('m', 6)],
    pair: pairOf('z', 4),
    winningTile: '3m',
    hint: '対々和のみ',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('z', 5), tripletOf('z', 6), run('m', 2), run('p', 4)],
    pair: pairOf('z', 7),
    winningTile: '5z',
    hint: '小三元',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),

  // ---- Tier5: 役満 ----
  mkKokushiProblem({
    extraPairTile: '1m',
    winningTile: '9m',
    hint: '国士無双(シングル役満)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkKokushiProblem({
    extraPairTile: '5z',
    winningTile: '5z',
    hint: '国士無双十三面待ち(ダブル役満)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('p', 1), tripletOf('s', 1), tripletOf('z', 2)],
    pair: pairOf('m', 9),
    winningTile: '1s',
    hint: '四暗刻(シャンポンではなく暗刻内でツモ和了)',
    common: { winType: 'tsumo', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('p', 1), tripletOf('s', 1), tripletOf('z', 1)],
    pair: pairOf('z', 2),
    winningTile: '2z',
    hint: '四暗刻単騎(ダブル役満)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('z', 5), tripletOf('z', 6), tripletOf('z', 7), run('m', 1)],
    pair: pairOf('m', 9),
    winningTile: '7z',
    hint: '大三元',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('z', 1), tripletOf('z', 2), tripletOf('z', 3), run('p', 4)],
    pair: pairOf('z', 4),
    winningTile: '3z',
    hint: '小四喜',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('z', 1), tripletOf('z', 2), tripletOf('z', 3), tripletOf('z', 4)],
    pair: pairOf('m', 5),
    winningTile: '4z',
    hint: '大四喜(ダブル役満)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('z', 1), tripletOf('z', 2), tripletOf('z', 4), tripletOf('z', 5)],
    pair: pairOf('z', 6),
    winningTile: '5z',
    hint: '字一色(四喜・大三元とは別形)',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('s', 2), tripletOf('s', 3), tripletOf('s', 4), tripletOf('s', 6)],
    pair: pairOf('s', 8),
    winningTile: '4s',
    hint: '緑一色',
    common: { winType: 'tsumo', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('p', 1), tripletOf('p', 9), tripletOf('s', 1), tripletOf('s', 9)],
    pair: pairOf('m', 1),
    winningTile: '9s',
    hint: '清老頭',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('p', 1), run('p', 2), run('p', 6), tripletOf('p', 9)],
    pair: pairOf('p', 5),
    winningTile: '1p',
    hint: '九蓮宝燈',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [tripletOf('p', 1), run('p', 2), run('p', 6), tripletOf('p', 9)],
    pair: pairOf('p', 5),
    winningTile: '5p',
    hint: '純正九蓮宝燈(ダブル役満・9面待ち)',
    common: { winType: 'tsumo', seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [],
    pair: pairOf('z', 5),
    winningTile: '5z',
    melds: [
      { type: 'ankan', tiles: quadOf('p', 1) },
      { type: 'minkan', tiles: quadOf('p', 9) },
      { type: 'ankan', tiles: quadOf('s', 1) },
      { type: 'minkan', tiles: quadOf('s', 9) },
    ],
    hint: '四槓子',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
  }),

  // ---- 三麻ルール ----
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('m', 9), run('p', 1), run('s', 4)],
    pair: pairOf('z', 7),
    winningTile: '9m',
    hint: '三麻ルール: 萬子は1と9のみ使用可',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
    ruleset: 'sanma',
  }),
  mkProblem({
    sets: [run('p', 1), run('p', 7), tripletOf('m', 1), tripletOf('m', 9)],
    pair: pairOf('z', 3),
    winningTile: '9p',
    hint: '三麻ルール: 混全帯幺九',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
    ruleset: 'sanma',
  }),
  mkProblem({
    sets: [run('s', 1), run('s', 4), run('s', 7), tripletOf('m', 1)],
    pair: pairOf('m', 9),
    winningTile: '7s',
    hint: '三麻ルール: 一気通貫',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
    ruleset: 'sanma',
  }),
  mkProblem({
    sets: [run('p', 2), run('p', 3), run('p', 4), run('p', 5)],
    pair: pairOf('p', 8),
    winningTile: '6p',
    hint: '三麻ルール: 清一色',
    common: { winType: 'tsumo', isRiichi: true, seatWind: 2, roundWind: 1 },
    ruleset: 'sanma',
  }),
  mkProblem({
    sets: [tripletOf('m', 1), tripletOf('m', 9), tripletOf('z', 5), run('p', 4)],
    pair: pairOf('z', 6),
    winningTile: '5z',
    hint: '三麻ルール: 役牌+萬子の老頭牌のみ使用',
    common: { winType: 'ron', seatWind: 2, roundWind: 1 },
    ruleset: 'sanma',
  }),

  // ---- ドラ・赤ドラ・裏ドラを含む複合問題 ----
  mkProblem({
    sets: [run('m', 3), run('p', 2), run('s', 6), run('s', 2)],
    pair: pairOf('p', 8),
    winningTile: '3m',
    hint: '立直+裏ドラでドラ加算',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
    dora: ['1p'],
    ura: ['2m'],
  }),
  mkProblem({
    sets: [withRed(run('p', 5), 5, 'p'), run('m', 2), run('m', 5), run('s', 6)],
    pair: pairOf('s', 9),
    winningTile: '6p',
    hint: '赤ドラを含む手(0pは赤5筒)',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [withRed(run('m', 3), 5, 'm'), run('p', 4), run('s', 7), run('p', 1)],
    pair: pairOf('s', 9),
    winningTile: '3m',
    hint: '赤ドラ(0m)+平和+立直',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
  }),
  mkProblem({
    sets: [run('m', 2), run('m', 2), run('p', 2), run('s', 2)],
    pair: pairOf('z', 7),
    winningTile: '2m',
    hint: '三色同順+一盃口+リーチ+ドラで高得点',
    common: { winType: 'ron', isRiichi: true, seatWind: 2, roundWind: 1 },
    dora: ['1m', '1p'],
  }),
  mkProblem({
    sets: [run('m', 1), run('p', 4), run('s', 7), run('m', 3)],
    pair: pairOf('z', 2),
    winningTile: '3m',
    hint: '立直+ツモ+ドラ4で跳満級',
    common: { winType: 'tsumo', isRiichi: true, seatWind: 1, roundWind: 1 },
    dora: ['1m', '3p', '7s', '4m'],
  }),
];

export function getRandomProblem(exclude?: string): PracticeProblem {
  const pool = exclude ? PRACTICE_PROBLEMS.filter((p) => p.id !== exclude) : PRACTICE_PROBLEMS;
  const list = pool.length > 0 ? pool : PRACTICE_PROBLEMS;
  return list[Math.floor(Math.random() * list.length)];
}
