import { useState } from 'react';
import CommonConditionsForm from '../components/CommonConditionsForm';
import FuFactorForm from '../components/FuFactorForm';
import ResultDisplay from '../components/ResultDisplay';
import { calculateScoreFromHanFu, calculateFuFromFactors, defaultCommonConditions, defaultFuFactors } from '../engine';
import type { CommonConditions, ScoreBreakdown, YakuResult } from '../engine';
import { YAKU_TABLE, YAKUMAN_TABLE } from '../data/yakuTable';

function computeSituationalYaku(common: CommonConditions, isMenzen: boolean): YakuResult[] {
  const result: YakuResult[] = [];
  if (common.isDoubleRiichi) result.push({ name: 'ダブル立直', han: 2, isYakuman: false });
  else if (common.isRiichi) result.push({ name: '立直', han: 1, isYakuman: false });
  if (common.isIppatsu && (common.isRiichi || common.isDoubleRiichi))
    result.push({ name: '一発', han: 1, isYakuman: false });
  if (common.isRinshan) result.push({ name: '嶺上開花', han: 1, isYakuman: false });
  if (common.isChankan) result.push({ name: '槍槓', han: 1, isYakuman: false });
  if (common.isHaitei) result.push({ name: '海底摸月', han: 1, isYakuman: false });
  if (common.isHoutei) result.push({ name: '河底撈魚', han: 1, isYakuman: false });
  if (isMenzen && common.winType === 'tsumo') result.push({ name: '門前清自摸和', han: 1, isYakuman: false });
  return result;
}

export default function IntermediateMode() {
  const [common, setCommon] = useState(defaultCommonConditions('yonma'));
  const [fuFactors, setFuFactors] = useState(defaultFuFactors());
  const [hanInputMethod, setHanInputMethod] = useState<'checklist' | 'manual'>('manual');
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());
  const [manualHan, setManualHan] = useState(1);
  const [doraCount, setDoraCount] = useState(0);
  const [isYakumanMode, setIsYakumanMode] = useState(false);
  const [selectedYakuman, setSelectedYakuman] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreBreakdown | null>(null);

  const toggleYaku = (key: string) => {
    const next = new Set(selectedYaku);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedYaku(next);
  };

  const handleCalculate = () => {
    if (common.isTenho || common.isChiho) {
      const name = common.isTenho ? '天和' : '地和';
      setResult(calculateScoreFromHanFu(13, 0, common, true, 1, [{ name, han: 13, isYakuman: true }]));
      return;
    }

    if (isYakumanMode) {
      const entry = YAKUMAN_TABLE.find((y) => y.key === selectedYakuman);
      if (!entry) return;
      setResult(
        calculateScoreFromHanFu(entry.multiplier * 13, 0, common, true, entry.multiplier, [
          { name: entry.name, han: entry.multiplier * 13, isYakuman: true },
        ])
      );
      return;
    }

    const situational = computeSituationalYaku(common, fuFactors.isMenzen);

    let shapeYaku: YakuResult[];
    if (hanInputMethod === 'checklist') {
      shapeYaku = YAKU_TABLE.filter((y) => selectedYaku.has(y.key) && !(y.menzenOnly && !fuFactors.isMenzen)).map(
        (y) => ({
          name: y.name,
          han: fuFactors.isMenzen ? y.hanClosed : y.hanOpen,
          isYakuman: false,
        })
      );
    } else {
      shapeYaku = manualHan > 0 ? [{ name: '選択役(合計)', han: manualHan, isYakuman: false }] : [];
    }

    const doraYaku: YakuResult[] = doraCount > 0 ? [{ name: 'ドラ', han: doraCount, isYakuman: false }] : [];

    const allYaku = [...situational, ...shapeYaku, ...doraYaku];
    const realYakuHan = situational.reduce((s, y) => s + y.han, 0) + shapeYaku.reduce((s, y) => s + y.han, 0);
    if (realYakuHan === 0) {
      setResult(null);
      alert('役が選択されていません(ドラのみでは和了できません)');
      return;
    }

    const totalHan = allYaku.reduce((s, y) => s + y.han, 0);
    const { fu, details } = calculateFuFromFactors(fuFactors, common.winType);
    setResult(calculateScoreFromHanFu(totalHan, fu, common, false, 1, allYaku, details));
  };

  return (
    <div className="mode-container">
      <h2>中級者用: 翻数と符の要素から計算</h2>
      <p className="mode-description">
        翻数は役一覧からの選択(または直接入力)、符数は面前・ロン・自摸・面子の種類などの要素から算出します。
      </p>

      <CommonConditionsForm value={common} onChange={setCommon} />

      <div className="section">
        <div className="field-row checkbox-row">
          <label>
            <input type="checkbox" checked={isYakumanMode} onChange={(e) => setIsYakumanMode(e.target.checked)} />
            役満を選択する
          </label>
        </div>
        {isYakumanMode && (
          <div className="field-row">
            <label>役満の種類</label>
            <select value={selectedYakuman ?? ''} onChange={(e) => setSelectedYakuman(e.target.value)}>
              <option value="" disabled>
                選択してください
              </option>
              {YAKUMAN_TABLE.map((y) => (
                <option key={y.key} value={y.key}>
                  {y.name}
                  {y.multiplier === 2 ? '(ダブル役満)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!isYakumanMode && (
        <>
          <div className="section">
            <div className="form-section-title">面前・副露</div>
            <div className="segmented">
              <button
                type="button"
                className={fuFactors.isMenzen ? 'segmented-btn active' : 'segmented-btn'}
                onClick={() => setFuFactors({ ...fuFactors, isMenzen: true })}
              >
                面前(鳴きなし)
              </button>
              <button
                type="button"
                className={!fuFactors.isMenzen ? 'segmented-btn active' : 'segmented-btn'}
                onClick={() => setFuFactors({ ...fuFactors, isMenzen: false, isPinfu: false })}
              >
                副露あり(鳴きあり)
              </button>
            </div>
            <div className="hint-text">
              副露(チー・ポン・明槓)がある場合は「副露あり」を選択してください。下の役一覧の翻数は食い下がりを反映して自動的に切り替わります。
            </div>
          </div>

          <div className="section">
            <div className="form-section-title">翻数の入力方法</div>
            <div className="segmented">
              <button
                type="button"
                className={hanInputMethod === 'manual' ? 'segmented-btn active' : 'segmented-btn'}
                onClick={() => setHanInputMethod('manual')}
              >
                翻数を直接入力
              </button>
              <button
                type="button"
                className={hanInputMethod === 'checklist' ? 'segmented-btn active' : 'segmented-btn'}
                onClick={() => setHanInputMethod('checklist')}
              >
                役一覧から選択
              </button>
            </div>

            {hanInputMethod === 'manual' ? (
              <div className="field-row">
                <label>役の翻数合計(立直・ツモ等を除く)</label>
                <input
                  type="number"
                  min={0}
                  className="number-input"
                  value={manualHan}
                  onChange={(e) => setManualHan(Math.max(0, Number(e.target.value)))}
                />
                <label>翻</label>
              </div>
            ) : (
              <div className="yaku-checklist">
                {YAKU_TABLE.map((y) => (
                  <label key={y.key} className="yaku-checklist-item">
                    <input type="checkbox" checked={selectedYaku.has(y.key)} onChange={() => toggleYaku(y.key)} />
                    {y.name}
                    <span className="yaku-checklist-han">
                      {fuFactors.isMenzen ? y.hanClosed : y.hanOpen}翻
                      {y.menzenOnly && !fuFactors.isMenzen ? '(面前限定・無効)' : ''}
                    </span>
                  </label>
                ))}
                <div className="hint-text">
                  ※ 立直・一発・自摸・海底摸月・河底撈魚・嶺上開花・槍槓は上の共通条件から自動計算されます
                </div>
              </div>
            )}
          </div>

          <div className="field-row">
            <label>ドラ枚数(赤ドラ・裏ドラ含む合計)</label>
            <input
              type="number"
              min={0}
              className="number-input"
              value={doraCount}
              onChange={(e) => setDoraCount(Math.max(0, Number(e.target.value)))}
            />
            <label>枚</label>
          </div>

          <FuFactorForm value={fuFactors} onChange={setFuFactors} />
        </>
      )}

      <button type="button" className="btn-primary btn-calculate" onClick={handleCalculate}>
        点数を計算する
      </button>

      <ResultDisplay result={result} />
    </div>
  );
}
