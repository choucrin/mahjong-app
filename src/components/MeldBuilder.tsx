import { useState } from 'react';
import TilePalette from './TilePalette';
import SelectedTiles from './SelectedTiles';
import { validateMeld, createMeld, meldTypeLabel, tileEmoji, countUsage, autoFillIdenticalTiles } from '../engine';
import type { Meld, MeldType, Ruleset } from '../engine';

interface MeldBuilderProps {
  ruleset: Ruleset;
  melds: Meld[];
  onChange: (melds: Meld[]) => void;
  otherUsedTiles: string[]; // 手牌・和了牌などですでに使われている牌(残り枚数計算用)
}

const MELD_TYPES: MeldType[] = ['chi', 'pon', 'minkan', 'ankan'];

export default function MeldBuilder({ ruleset, melds, onChange, otherUsedTiles }: MeldBuilderProps) {
  const [buildingType, setBuildingType] = useState<MeldType | null>(null);
  const [buildingTiles, setBuildingTiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const usage = countUsage([...otherUsedTiles, ...melds.flatMap((m) => m.tiles), ...buildingTiles]);

  const startBuilding = (type: MeldType) => {
    setBuildingType(type);
    setBuildingTiles([]);
    setError(null);
  };

  const addTileToBuilding = (code: string) => {
    const max = buildingType === 'chi' || buildingType === 'pon' ? 3 : 4;
    if (buildingTiles.length >= max) return;
    if (buildingType === 'pon' || buildingType === 'minkan' || buildingType === 'ankan') {
      // ポン・カンは同一牌のみで構成されるため、1枚選択したら残りは自動的に埋めてそのまま確定する
      const usageOutside = countUsage([...otherUsedTiles, ...melds.flatMap((m) => m.tiles)]);
      const filled = autoFillIdenticalTiles(code, max, usageOutside);
      const err = validateMeld(buildingType, filled);
      if (err) {
        setBuildingTiles(filled);
        setError(err);
        return;
      }
      onChange([...melds, createMeld(buildingType, filled)]);
      setBuildingType(null);
      setBuildingTiles([]);
      setError(null);
      return;
    }
    setBuildingTiles([...buildingTiles, code]);
  };

  const confirmMeld = () => {
    if (!buildingType) return;
    const err = validateMeld(buildingType, buildingTiles);
    if (err) {
      setError(err);
      return;
    }
    onChange([...melds, createMeld(buildingType, buildingTiles)]);
    setBuildingType(null);
    setBuildingTiles([]);
    setError(null);
  };

  const cancelBuilding = () => {
    setBuildingType(null);
    setBuildingTiles([]);
    setError(null);
  };

  const removeMeld = (id: string) => {
    onChange(melds.filter((m) => m.id !== id));
  };

  return (
    <div className="meld-builder">
      <div className="meld-builder-title">鳴き(チー・ポン・カン)</div>
      <div className="meld-list">
        {melds.length === 0 && <span className="hint-text">鳴きはありません</span>}
        {melds.map((m) => (
          <div className="meld-item" key={m.id}>
            <span className="meld-item-type">{meldTypeLabel(m.type)}</span>
            <span className="meld-item-tiles">
              {m.tiles.map((t, i) => (
                <span key={i}>{tileEmoji(t)}</span>
              ))}
            </span>
            <button type="button" className="btn-small" onClick={() => removeMeld(m.id)}>
              削除
            </button>
          </div>
        ))}
      </div>

      {buildingType === null ? (
        <div className="meld-add-buttons">
          {MELD_TYPES.map((t) => (
            <button type="button" key={t} className="btn-secondary" onClick={() => startBuilding(t)}>
              {meldTypeLabel(t)}を追加
            </button>
          ))}
        </div>
      ) : (
        <div className="meld-building">
          <div className="meld-building-header">
            {meldTypeLabel(buildingType)}を作成中 ({buildingTiles.length}/
            {buildingType === 'chi' || buildingType === 'pon' ? 3 : 4}枚)
            {buildingType !== 'chi' && <span className="hint-text"> ・牌を1枚選ぶと確定します</span>}
          </div>
          <SelectedTiles
            title="選択中の牌"
            tiles={buildingTiles}
            sorted={false}
            onRemove={(idx) => setBuildingTiles(buildingTiles.filter((_, i) => i !== idx))}
          />
          <TilePalette ruleset={ruleset} usage={usage} onSelect={addTileToBuilding} />
          {error && <div className="error-text">{error}</div>}
          <div className="meld-building-actions">
            {buildingType === 'chi' && (
              <button type="button" className="btn-primary" onClick={confirmMeld}>
                確定
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={cancelBuilding}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
