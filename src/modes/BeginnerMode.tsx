import { useMemo, useState } from 'react';
import TilePalette from '../components/TilePalette';
import SelectedTiles from '../components/SelectedTiles';
import MeldBuilder from '../components/MeldBuilder';
import CommonConditionsForm from '../components/CommonConditionsForm';
import DoraIndicatorSelector from '../components/DoraIndicatorSelector';
import ResultDisplay from '../components/ResultDisplay';
import { calculateScore, defaultCommonConditions, countUsage } from '../engine';
import type { CalcError, Meld, ScoreBreakdown } from '../engine';

export default function BeginnerMode() {
  const [common, setCommon] = useState(defaultCommonConditions('yonma'));
  const [concealedTiles, setConcealedTiles] = useState<string[]>([]);
  const [winningTile, setWinningTile] = useState<string | null>(null);
  const [melds, setMelds] = useState<Meld[]>([]);
  const [doraIndicators, setDoraIndicators] = useState<string[]>([]);
  const [uraDoraIndicators, setUraDoraIndicators] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreBreakdown | CalcError | null>(null);

  const requiredConcealed = 13 - 3 * melds.length;

  const meldTiles = useMemo(() => melds.flatMap((m) => m.tiles), [melds]);
  const usageForConcealed = useMemo(
    () => countUsage([...concealedTiles, ...(winningTile ? [winningTile] : []), ...meldTiles]),
    [concealedTiles, winningTile, meldTiles]
  );
  const usageForWinning = usageForConcealed;

  const addConcealed = (code: string) => {
    if (concealedTiles.length >= requiredConcealed) return;
    setConcealedTiles([...concealedTiles, code]);
  };

  const canCalculate = concealedTiles.length === requiredConcealed && winningTile !== null;

  const handleCalculate = () => {
    if (!winningTile) return;
    const r = calculateScore({
      concealedTiles,
      winningTile,
      melds,
      common,
      doraIndicators,
      uraDoraIndicators,
    });
    setResult(r);
  };

  return (
    <div className="mode-container">
      <h2>初心者用: 手牌から点数を計算</h2>
      <p className="mode-description">
        手牌13枚とアガリ牌(鳴きがある場合は鳴き牌も)をすべて選択すると、翻数・符数・成立する役・点数を自動的に計算します。
      </p>

      <CommonConditionsForm value={common} onChange={setCommon} />

      <MeldBuilder
        ruleset={common.ruleset}
        melds={melds}
        onChange={setMelds}
        otherUsedTiles={[...concealedTiles, ...(winningTile ? [winningTile] : [])]}
      />

      <div className="section">
        <div className="form-section-title">
          手牌 (面前部分、{requiredConcealed}枚選択してください)
        </div>
        <SelectedTiles
          title="選択した手牌"
          tiles={concealedTiles}
          onRemove={(idx) => setConcealedTiles(concealedTiles.filter((_, i) => i !== idx))}
        />
        <TilePalette ruleset={common.ruleset} usage={usageForConcealed} onSelect={addConcealed} />
      </div>

      <div className="section">
        <div className="form-section-title">アガリ牌</div>
        <SelectedTiles
          title="アガリ牌"
          tiles={winningTile ? [winningTile] : []}
          onRemove={() => setWinningTile(null)}
          emptyHint="アガリ牌を1枚選択してください"
        />
        <TilePalette ruleset={common.ruleset} usage={usageForWinning} onSelect={(c) => setWinningTile(c)} />
      </div>

      <DoraIndicatorSelector
        ruleset={common.ruleset}
        doraIndicators={doraIndicators}
        uraDoraIndicators={uraDoraIndicators}
        showUra={common.isRiichi || common.isDoubleRiichi}
        onChangeDora={setDoraIndicators}
        onChangeUra={setUraDoraIndicators}
      />

      <button type="button" className="btn-primary btn-calculate" disabled={!canCalculate} onClick={handleCalculate}>
        点数を計算する
      </button>

      <ResultDisplay result={result} />
    </div>
  );
}
