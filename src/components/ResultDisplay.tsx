import type { CalcError, ScoreBreakdown } from '../engine';

function isError(r: ScoreBreakdown | CalcError): r is CalcError {
  return (r as CalcError).message !== undefined;
}

interface ResultDisplayProps {
  result: ScoreBreakdown | CalcError | null;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result) return null;

  if (isError(result)) {
    return (
      <div className="result-display result-error">
        <div className="result-error-message">{result.message}</div>
      </div>
    );
  }

  return (
    <div className="result-display">
      <div className="result-headline">
        <div className="result-hanfu">
          {result.isYakuman ? (
            <span>役満</span>
          ) : (
            <span>
              {result.han}翻 {result.fu}符
            </span>
          )}
          {result.scoreName && <span className="result-score-name">{result.scoreName}</span>}
        </div>
        <div className="result-points">{result.totalPoints.toLocaleString()}点</div>
        <div className="result-payment-detail">{result.paymentDetail}</div>
      </div>

      <div className="result-section">
        <div className="result-section-title">成立役</div>
        <ul className="yaku-list">
          {result.yakuList.map((y, i) => (
            <li key={i} className={y.isYakuman ? 'yaku-item yakuman' : 'yaku-item'}>
              <span className="yaku-name">{y.name}</span>
              <span className="yaku-han">{y.isYakuman ? '役満' : `${y.han}翻`}</span>
            </li>
          ))}
        </ul>
      </div>

      {result.fuDetails.length > 0 && (
        <div className="result-section">
          <div className="result-section-title">符の内訳</div>
          <ul className="fu-list">
            {result.fuDetails.map((f, i) => (
              <li key={i} className="fu-item">
                <span className="fu-label">{f.label}</span>
                <span className="fu-value">{f.fu}符</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
