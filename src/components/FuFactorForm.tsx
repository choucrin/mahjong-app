import type { FuFactors } from '../engine';

interface FuFactorFormProps {
  value: FuFactors;
  onChange: (value: FuFactors) => void;
}

const COUNT_FIELDS: Array<{ key: keyof FuFactors; label: string }> = [
  { key: 'simpleOpenTriplet', label: '明刻(中張牌 2〜8)' },
  { key: 'simpleClosedTriplet', label: '暗刻(中張牌 2〜8)' },
  { key: 'terminalOpenTriplet', label: '明刻(么九牌 1・9・字牌)' },
  { key: 'terminalClosedTriplet', label: '暗刻(么九牌 1・9・字牌)' },
  { key: 'simpleOpenQuad', label: '明槓(中張牌 2〜8)' },
  { key: 'simpleClosedQuad', label: '暗槓(中張牌 2〜8)' },
  { key: 'terminalOpenQuad', label: '明槓(么九牌 1・9・字牌)' },
  { key: 'terminalClosedQuad', label: '暗槓(么九牌 1・9・字牌)' },
];

export default function FuFactorForm({ value, onChange }: FuFactorFormProps) {
  const update = (patch: Partial<FuFactors>) => onChange({ ...value, ...patch });
  const disabled = value.isPinfu || value.isChiitoitsu;

  const totalSets =
    value.simpleOpenTriplet +
    value.simpleClosedTriplet +
    value.terminalOpenTriplet +
    value.terminalClosedTriplet +
    value.simpleOpenQuad +
    value.simpleClosedQuad +
    value.terminalOpenQuad +
    value.terminalClosedQuad;

  return (
    <div className="fu-factor-form">
      <div className="form-section-title">符の構成要素</div>

      <div className="field-row checkbox-row">
        <label>
          <input
            type="checkbox"
            checked={value.isPinfu}
            onChange={(e) => update({ isPinfu: e.target.checked, isChiitoitsu: false })}
          />
          平和(20符/30符固定)
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.isChiitoitsu}
            onChange={(e) => update({ isChiitoitsu: e.target.checked, isPinfu: false })}
          />
          七対子(25符固定)
        </label>
      </div>

      {!disabled && (
        <>
          <div className="fu-factor-grid">
            {COUNT_FIELDS.map((f) => (
              <div className="field-row" key={f.key}>
                <label>{f.label}</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  className="number-input"
                  value={value[f.key] as number}
                  onChange={(e) => update({ [f.key]: Math.max(0, Number(e.target.value)) } as Partial<FuFactors>)}
                />
                <span>個</span>
              </div>
            ))}
          </div>
          <div className={`hint-text${totalSets > 4 ? ' error-text' : ''}`}>
            刻子・槓子の合計: {totalSets} / 4 (残りは順子または雀頭)
          </div>

          <div className="field-row">
            <label>雀頭</label>
            <select
              value={value.pairFuType}
              onChange={(e) => update({ pairFuType: e.target.value as FuFactors['pairFuType'] })}
            >
              <option value="none">役牌ではない(0符)</option>
              <option value="yakuhai_single">役牌(2符)</option>
              <option value="yakuhai_double">連風牌(自風=場風、4符)</option>
            </select>
          </div>

          <div className="field-row">
            <label>待ちの形</label>
            <select
              value={value.waitType}
              onChange={(e) => update({ waitType: e.target.value as FuFactors['waitType'] })}
            >
              <option value="ryanmen">両面待ち(0符)</option>
              <option value="shanpon">シャンポン待ち(0符)</option>
              <option value="kanchan">嵌張待ち(2符)</option>
              <option value="penchan">辺張待ち(2符)</option>
              <option value="tanki">単騎待ち(2符)</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
