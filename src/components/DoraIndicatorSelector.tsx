import { useState } from 'react';
import TilePalette from './TilePalette';
import SelectedTiles from './SelectedTiles';
import { countUsage } from '../engine';
import type { Ruleset } from '../engine';

interface DoraIndicatorSelectorProps {
  ruleset: Ruleset;
  doraIndicators: string[];
  uraDoraIndicators: string[];
  showUra: boolean;
  onChangeDora: (tiles: string[]) => void;
  onChangeUra: (tiles: string[]) => void;
}

export default function DoraIndicatorSelector({
  ruleset,
  doraIndicators,
  uraDoraIndicators,
  showUra,
  onChangeDora,
  onChangeUra,
}: DoraIndicatorSelectorProps) {
  const [tab, setTab] = useState<'dora' | 'ura'>('dora');
  const activeTiles = tab === 'dora' ? doraIndicators : uraDoraIndicators;
  const usage = countUsage([...doraIndicators, ...uraDoraIndicators]);

  const add = (code: string) => {
    if (activeTiles.length >= 4) return;
    if (tab === 'dora') onChangeDora([...doraIndicators, code]);
    else onChangeUra([...uraDoraIndicators, code]);
  };
  const remove = (idx: number) => {
    if (tab === 'dora') onChangeDora(doraIndicators.filter((_, i) => i !== idx));
    else onChangeUra(uraDoraIndicators.filter((_, i) => i !== idx));
  };

  return (
    <div className="dora-selector">
      <div className="form-section-title">ドラ表示牌</div>
      {showUra && (
        <div className="segmented">
          <button
            type="button"
            className={tab === 'dora' ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => setTab('dora')}
          >
            ドラ表示牌
          </button>
          <button
            type="button"
            className={tab === 'ura' ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => setTab('ura')}
          >
            裏ドラ表示牌
          </button>
        </div>
      )}
      <SelectedTiles
        title={tab === 'dora' ? 'ドラ表示牌' : '裏ドラ表示牌'}
        tiles={activeTiles}
        sorted={false}
        onRemove={remove}
        emptyHint="表示牌なし"
      />
      <TilePalette ruleset={ruleset} usage={usage} onSelect={add} />
    </div>
  );
}
