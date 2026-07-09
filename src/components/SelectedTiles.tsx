import { tileEmoji, tileLabel, sortTiles } from '../engine';

interface SelectedTilesProps {
  title: string;
  tiles: string[];
  onRemove: (index: number) => void;
  sorted?: boolean;
  emptyHint?: string;
}

export default function SelectedTiles({ title, tiles, onRemove, sorted = true, emptyHint }: SelectedTilesProps) {
  const displayList = sorted ? sortTiles(tiles) : tiles;
  // ソートすると元のindexが分からなくなるため、除去は牌コード一致の最初の1件を消す方式にする
  const handleRemove = (code: string) => {
    const idx = tiles.indexOf(code);
    if (idx >= 0) onRemove(idx);
  };

  return (
    <div className="selected-tiles">
      <div className="selected-tiles-title">
        {title} ({tiles.length}枚)
      </div>
      <div className="selected-tiles-list">
        {displayList.length === 0 && <span className="hint-text">{emptyHint ?? '牌を選択してください'}</span>}
        {displayList.map((code, i) => (
          <button
            type="button"
            key={`${code}-${i}`}
            className={`tile-chip${code[0] === '0' ? ' tile-btn-red' : ''}`}
            onClick={() => handleRemove(code)}
            title={`${tileLabel(code)} (クリックで削除)`}
          >
            {tileEmoji(code)}
          </button>
        ))}
      </div>
    </div>
  );
}
