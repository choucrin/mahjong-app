import { parseTile, normalizeForShape } from './tiles';
import type { Meld, MeldType } from './types';

export function validateMeld(type: MeldType, tiles: string[]): string | null {
  const expectedLength = type === 'chi' || type === 'pon' ? 3 : 4;
  if (tiles.length !== expectedLength) {
    return `${meldTypeLabel(type)}には${expectedLength}枚選択してください`;
  }
  const normalized = tiles.map(normalizeForShape);
  if (type === 'chi') {
    const parsed = normalized.map(parseTile).sort((a, b) => a.rank - b.rank);
    if (parsed[0].suit === 'z') return 'チーは数牌のみで構成できます';
    if (parsed.some((p) => p.suit !== parsed[0].suit)) return 'チーは同じ種類の牌で構成してください';
    if (parsed[1].rank !== parsed[0].rank + 1 || parsed[2].rank !== parsed[0].rank + 2) {
      return 'チーは連続した3枚を選択してください';
    }
    return null;
  }
  // pon / kan
  const first = normalized[0];
  if (normalized.some((t) => t !== first)) {
    return `${meldTypeLabel(type)}は同じ牌で構成してください`;
  }
  return null;
}

export function meldTypeLabel(type: MeldType): string {
  return { chi: 'チー', pon: 'ポン', minkan: '明槓', ankan: '暗槓' }[type];
}

export function createMeld(type: MeldType, tiles: string[]): Meld {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, tiles };
}
