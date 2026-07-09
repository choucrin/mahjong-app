import { useState } from 'react';
import CommonConditionsForm from '../components/CommonConditionsForm';
import ResultDisplay from '../components/ResultDisplay';
import { calculateScoreFromHanFu, defaultCommonConditions } from '../engine';
import type { ScoreBreakdown } from '../engine';

export default function AdvancedMode() {
  const [common, setCommon] = useState(defaultCommonConditions('yonma'));
  const [han, setHan] = useState(3);
  const [fu, setFu] = useState(30);
  const [isYakuman, setIsYakuman] = useState(false);
  const [yakumanMultiplier, setYakumanMultiplier] = useState(1);
  const [result, setResult] = useState<ScoreBreakdown | null>(null);

  const handleCalculate = () => {
    const r = calculateScoreFromHanFu(han, isYakuman ? 0 : fu, common, isYakuman, yakumanMultiplier);
    setResult(r);
  };

  return (
    <div className="mode-container">
      <h2>上級者用: 翻符を直接入力</h2>
      <p className="mode-description">翻数と符数をそれぞれ入力すると、最終的な点数を計算します。</p>

      <CommonConditionsForm value={common} onChange={setCommon} />

      <div className="section">
        <div className="form-section-title">翻符入力</div>
        <div className="field-row checkbox-row">
          <label>
            <input type="checkbox" checked={isYakuman} onChange={(e) => setIsYakuman(e.target.checked)} />
            役満
          </label>
        </div>
        {isYakuman ? (
          <div className="field-row">
            <label>役満倍率</label>
            <select value={yakumanMultiplier} onChange={(e) => setYakumanMultiplier(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? '役満' : n === 2 ? 'ダブル役満' : n === 3 ? 'トリプル役満' : `${n}倍役満`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="field-row">
              <label>翻数</label>
              <input
                type="number"
                min={1}
                max={12}
                className="number-input"
                value={han}
                onChange={(e) => setHan(Math.max(1, Number(e.target.value)))}
              />
              <label>翻</label>
            </div>
            <div className="field-row">
              <label>符数</label>
              <input
                type="number"
                min={20}
                step={10}
                className="number-input"
                value={fu}
                onChange={(e) => setFu(Math.max(20, Number(e.target.value)))}
              />
              <label>符</label>
            </div>
          </>
        )}
      </div>

      <button type="button" className="btn-primary btn-calculate" onClick={handleCalculate}>
        点数を計算する
      </button>

      <ResultDisplay result={result} />
    </div>
  );
}
