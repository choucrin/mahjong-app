// 牌の表現: "1m"~"9m" (萬子), "1p"~"9p" (筒子), "1s"~"9s" (索子), "1z"~"7z" (字牌)
// 赤ドラは "0m","0p","0s" (5m/5p/5sの赤牌)として区別する
export type Suit = 'm' | 'p' | 's' | 'z';

export const HONOR_NAMES: Record<number, string> = {
  1: '東',
  2: '南',
  3: '西',
  4: '北',
  5: '白',
  6: '發',
  7: '中',
};

export interface ParsedTile {
  code: string; // 元の牌コード ("0m"含む)
  suit: Suit;
  rank: number; // 1-9 (m/p/s), 1-7 (z)。赤5は5として扱う
  isRed: boolean;
}

export function parseTile(code: string): ParsedTile {
  const suit = code[1] as Suit;
  let rank = parseInt(code[0], 10);
  const isRed = rank === 0;
  if (isRed) rank = 5;
  return { code, suit, rank, isRed };
}

export function tileSortKey(code: string): number {
  const { suit, rank } = parseTile(code);
  const suitOrder = { m: 0, p: 1, s: 2, z: 3 }[suit];
  return suitOrder * 10 + rank;
}

export function sortTiles(codes: string[]): string[] {
  return [...codes].sort((a, b) => tileSortKey(a) - tileSortKey(b));
}

export function isTerminal(t: ParsedTile): boolean {
  return t.suit !== 'z' && (t.rank === 1 || t.rank === 9);
}

export function isHonor(t: ParsedTile): boolean {
  return t.suit === 'z';
}

export function isTerminalOrHonor(t: ParsedTile): boolean {
  return isTerminal(t) || isHonor(t);
}

export function isSimple(t: ParsedTile): boolean {
  return !isTerminalOrHonor(t);
}

export function isWindTile(t: ParsedTile): boolean {
  return t.suit === 'z' && t.rank >= 1 && t.rank <= 4;
}

export function isDragonTile(t: ParsedTile): boolean {
  return t.suit === 'z' && t.rank >= 5 && t.rank <= 7;
}

export function tileLabel(code: string): string {
  const { suit, rank, isRed } = parseTile(code);
  if (suit === 'z') return HONOR_NAMES[rank];
  const suitLabel = { m: '萬', p: '筒', s: '索' }[suit];
  return `${isRed ? '赤' : ''}${rank}${suitLabel}`;
}

// 三麻用: 2m~8mを除いた使用可能牌一覧
export function availableTiles(ruleset: 'yonma' | 'sanma'): string[] {
  const tiles: string[] = [];
  for (const suit of ['m', 'p', 's'] as Suit[]) {
    for (let rank = 1; rank <= 9; rank++) {
      if (ruleset === 'sanma' && suit === 'm' && rank >= 2 && rank <= 8) continue;
      tiles.push(`${rank}${suit}`);
      if (rank === 5) tiles.push(`0${suit}`); // 赤5
    }
  }
  for (let rank = 1; rank <= 7; rank++) {
    tiles.push(`${rank}z`);
  }
  return tiles;
}

// 牌の枚数上限 (赤5込みで通常5は4枚、うち赤は1枚という運用にする場合はUI側で管理)
export function maxCountForTile(): number {
  return 4;
}

const MAN_EMOJI = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'];
const SOU_EMOJI = ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'];
const PIN_EMOJI = ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];
const HONOR_EMOJI: Record<number, string> = { 1: '🀀', 2: '🀁', 3: '🀂', 4: '🀃', 5: '🀆', 6: '🀅', 7: '🀄' };

export function tileEmoji(code: string): string {
  const { suit, rank } = parseTile(code);
  if (suit === 'z') return HONOR_EMOJI[rank];
  if (suit === 'm') return MAN_EMOJI[rank - 1];
  if (suit === 'p') return PIN_EMOJI[rank - 1];
  return SOU_EMOJI[rank - 1];
}

export function normalizeForShape(code: string): string {
  // 赤5を通常5として扱う(形の判定用)
  const { suit, rank } = parseTile(code);
  return `${rank}${suit}`;
}

export function siblingRedVariant(code: string): string | null {
  const { suit, rank, isRed } = parseTile(code);
  if (rank !== 5 || suit === 'z') return null;
  return isRed ? `5${suit}` : `0${suit}`;
}

// 赤5と通常5をあわせて最大4枚までという制約のもと、指定した牌があと何枚選択可能か
export function remainingForTile(code: string, usage: Record<string, number>): number {
  const used = usage[code] ?? 0;
  const sibling = siblingRedVariant(code);
  const siblingUsed = sibling ? usage[sibling] ?? 0 : 0;
  return 4 - used - siblingUsed;
}

export function countUsage(tiles: string[]): Record<string, number> {
  const usage: Record<string, number> = {};
  for (const t of tiles) usage[t] = (usage[t] ?? 0) + 1;
  return usage;
}

// ポン・カンは同一牌のみで構成されるため、1枚選択したら残りは自動的に同じ牌で埋める。
// 5の牌は赤(0)が1枚しか存在しないため、赤を選んだ場合の残りは通常牌(5)で、
// 通常牌を選んだ場合の残りは通常牌を優先し、不足時のみ赤で補う。
export function autoFillIdenticalTiles(
  triggerCode: string,
  count: number,
  usageOutsideMeld: Record<string, number>
): string[] {
  const normalized = normalizeForShape(triggerCode);
  const sibling = siblingRedVariant(triggerCode);
  if (!sibling) {
    return Array(count).fill(triggerCode);
  }
  // triggerCodeが赤(0x)ならactualRedCode=triggerCode、通常(5x)ならactualRedCode=sibling
  const actualRedCode = parseTile(triggerCode).isRed ? triggerCode : sibling;
  const usedNormalOutside = usageOutsideMeld[normalized] ?? 0;
  const usedRedOutside = usageOutsideMeld[actualRedCode] ?? 0;
  const tiles: string[] = [triggerCode];
  let normalLeft = 3 - usedNormalOutside - (triggerCode === normalized ? 1 : 0);
  let redLeft = 1 - usedRedOutside - (triggerCode === actualRedCode ? 1 : 0);
  while (tiles.length < count) {
    if (normalLeft > 0) {
      tiles.push(normalized);
      normalLeft--;
    } else if (redLeft > 0) {
      tiles.push(actualRedCode);
      redLeft--;
    } else {
      break;
    }
  }
  return tiles;
}
