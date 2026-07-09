import { useMemo, useState } from 'react';
import ResultDisplay from '../components/ResultDisplay';
import { calculateScore, tileEmoji, tileLabel, sortTiles, meldTypeLabel, HONOR_NAMES } from '../engine';
import type { CalcError, ScoreBreakdown } from '../engine';
import { getRandomProblem, type PracticeProblem } from '../data/practiceProblems';

function isError(r: ScoreBreakdown | CalcError): r is CalcError {
  return (r as CalcError).message !== undefined;
}

function conditionSummary(p: PracticeProblem): string[] {
  const c = p.common;
  const lines: string[] = [];
  lines.push(c.ruleset === 'yonma' ? '四麻' : '三麻');
  lines.push(c.winType === 'ron' ? 'ロン' : 'ツモ');
  if (c.isDoubleRiichi) lines.push('ダブル立直');
  else if (c.isRiichi) lines.push('立直');
  if (c.isIppatsu) lines.push('一発');
  if (c.isRinshan) lines.push('嶺上開花');
  if (c.isChankan) lines.push('槍槓');
  if (c.isHaitei) lines.push('海底摸月');
  if (c.isHoutei) lines.push('河底撈魚');
  if (c.isTenho) lines.push('天和');
  if (c.isChiho) lines.push('地和');
  lines.push(`自風:${HONOR_NAMES[c.seatWind]}`);
  lines.push(`場風:${HONOR_NAMES[c.roundWind]}`);
  if (c.honba > 0) lines.push(`${c.honba}本場`);
  if (c.kyotaku > 0) lines.push(`供託${c.kyotaku}本`);
  return lines;
}

export default function PracticeMode() {
  const [problem, setProblem] = useState<PracticeProblem>(() => getRandomProblem());
  const [hanAnswer, setHanAnswer] = useState('');
  const [fuAnswer, setFuAnswer] = useState('');
  const [pointsAnswer, setPointsAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const answer = useMemo(() => calculateScore(problem), [problem]);
  const isYakuman = !isError(answer) && answer.isYakuman;

  const handleNext = () => {
    setProblem(getRandomProblem(problem.id));
    setHanAnswer('');
    setFuAnswer('');
    setPointsAnswer('');
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (isError(answer)) return;
    setSubmitted(true);
    setSolvedCount((n) => n + 1);
    const hanCorrect = Number(hanAnswer) === answer.han;
    const fuCorrect = isYakuman || Number(fuAnswer) === answer.fu;
    const pointsCorrect = Number(pointsAnswer) === answer.totalPoints;
    if (hanCorrect && fuCorrect && pointsCorrect) setCorrectCount((n) => n + 1);
  };

  const sortedConcealed = sortTiles(problem.concealedTiles);

  let hanCorrect = false;
  let fuCorrect = false;
  let pointsCorrect = false;
  if (submitted && !isError(answer)) {
    hanCorrect = Number(hanAnswer) === answer.han;
    fuCorrect = isYakuman || Number(fuAnswer) === answer.fu;
    pointsCorrect = Number(pointsAnswer) === answer.totalPoints;
  }

  return (
    <div className="mode-container">
      <h2>点数計算練習モード</h2>
      <p className="mode-description">
        表示された手牌の翻数・符数・点数を計算して回答してください。正解・不正解にかかわらず解説を表示します。
      </p>
      <div className="practice-score-tracker">
        正解数: {correctCount} / {solvedCount}
      </div>

      <div className="section practice-problem">
        <div className="condition-badges">
          {conditionSummary(problem).map((c, i) => (
            <span className="condition-badge" key={i}>
              {c}
            </span>
          ))}
        </div>

        {problem.melds.length > 0 && (
          <div className="meld-list">
            {problem.melds.map((m) => (
              <div className="meld-item" key={m.id}>
                <span className="meld-item-type">{meldTypeLabel(m.type)}</span>
                <span className="meld-item-tiles">
                  {m.tiles.map((t, i) => (
                    <span key={i}>{tileEmoji(t)}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="selected-tiles">
          <div className="selected-tiles-title">手牌</div>
          <div className="selected-tiles-list">
            {sortedConcealed.map((t, i) => (
              <span className="tile-chip static" key={i} title={tileLabel(t)}>
                {tileEmoji(t)}
              </span>
            ))}
            <span className="tile-chip static winning-tile" title={tileLabel(problem.winningTile)}>
              {tileEmoji(problem.winningTile)}
            </span>
          </div>
        </div>

        {problem.doraIndicators.length > 0 && (
          <div className="selected-tiles">
            <div className="selected-tiles-title">ドラ表示牌</div>
            <div className="selected-tiles-list">
              {problem.doraIndicators.map((t, i) => (
                <span className="tile-chip static" key={i}>
                  {tileEmoji(t)}
                </span>
              ))}
            </div>
          </div>
        )}
        {problem.uraDoraIndicators.length > 0 && (
          <div className="selected-tiles">
            <div className="selected-tiles-title">裏ドラ表示牌</div>
            <div className="selected-tiles-list">
              {problem.uraDoraIndicators.map((t, i) => (
                <span className="tile-chip static" key={i}>
                  {tileEmoji(t)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isError(answer) && (
        <div className="section">
          <div className="field-row">
            <label>翻数</label>
            <input
              type="number"
              className="number-input"
              value={hanAnswer}
              disabled={submitted}
              onChange={(e) => setHanAnswer(e.target.value)}
            />
            <label>翻</label>
            {submitted && (
              <span className={hanCorrect ? 'answer-correct' : 'answer-wrong'}>
                {hanCorrect ? '正解' : `不正解(正解: ${answer.han})`}
              </span>
            )}
          </div>
          {!isYakuman && (
            <div className="field-row">
              <label>符数</label>
              <input
                type="number"
                className="number-input"
                value={fuAnswer}
                disabled={submitted}
                onChange={(e) => setFuAnswer(e.target.value)}
              />
              <label>符</label>
              {submitted && <span className={fuCorrect ? 'answer-correct' : 'answer-wrong'}>{fuCorrect ? '正解' : `不正解(正解: ${answer.fu})`}</span>}
            </div>
          )}
          <div className="field-row">
            <label>点数</label>
            <input
              type="number"
              className="number-input"
              value={pointsAnswer}
              disabled={submitted}
              onChange={(e) => setPointsAnswer(e.target.value)}
            />
            <label>点</label>
            {submitted && (
              <span className={pointsCorrect ? 'answer-correct' : 'answer-wrong'}>
                {pointsCorrect ? '正解' : `不正解(正解: ${answer.totalPoints})`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="practice-actions">
        {!submitted ? (
          <button type="button" className="btn-primary btn-calculate" onClick={handleSubmit}>
            回答する
          </button>
        ) : (
          <button type="button" className="btn-primary btn-calculate" onClick={handleNext}>
            次の問題へ
          </button>
        )}
      </div>

      {submitted && (
        <>
          <div className="form-section-title">解説</div>
          <ResultDisplay result={answer} />
        </>
      )}
    </div>
  );
}
