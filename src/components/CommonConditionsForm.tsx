import type { CommonConditions, Ruleset, Wind } from '../engine';
import { HONOR_NAMES } from '../engine';

interface CommonConditionsFormProps {
  value: CommonConditions;
  onChange: (value: CommonConditions) => void;
  allowRulesetChange?: boolean;
}

const WINDS: Wind[] = [1, 2, 3, 4];

export default function CommonConditionsForm({
  value,
  onChange,
  allowRulesetChange = true,
}: CommonConditionsFormProps) {
  const update = (patch: Partial<CommonConditions>) => onChange({ ...value, ...patch });

  const seatWindOptions = value.ruleset === 'sanma' ? WINDS.filter((w) => w !== 4) : WINDS;

  return (
    <div className="common-conditions">
      <div className="form-section-title">共通条件</div>

      {allowRulesetChange && (
        <div className="field-row">
          <label>ルール</label>
          <div className="segmented">
            <button
              type="button"
              className={value.ruleset === 'yonma' ? 'segmented-btn active' : 'segmented-btn'}
              onClick={() => update({ ruleset: 'yonma' as Ruleset, seatWind: value.seatWind })}
            >
              四麻
            </button>
            <button
              type="button"
              className={value.ruleset === 'sanma' ? 'segmented-btn active' : 'segmented-btn'}
              onClick={() =>
                update({
                  ruleset: 'sanma' as Ruleset,
                  seatWind: value.seatWind === 4 ? 1 : value.seatWind,
                })
              }
            >
              三麻
            </button>
          </div>
        </div>
      )}

      <div className="field-row">
        <label>和了方法</label>
        <div className="segmented">
          <button
            type="button"
            className={value.winType === 'ron' ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => update({ winType: 'ron', isHaitei: false })}
          >
            ロン
          </button>
          <button
            type="button"
            className={value.winType === 'tsumo' ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => update({ winType: 'tsumo', isHoutei: false, isChankan: false })}
          >
            ツモ
          </button>
        </div>
      </div>

      <div className="field-row">
        <label>立直</label>
        <div className="segmented">
          <button
            type="button"
            className={!value.isRiichi && !value.isDoubleRiichi ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => update({ isRiichi: false, isDoubleRiichi: false, isIppatsu: false })}
          >
            なし
          </button>
          <button
            type="button"
            className={value.isRiichi ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => update({ isRiichi: true, isDoubleRiichi: false })}
          >
            リーチ
          </button>
          <button
            type="button"
            className={value.isDoubleRiichi ? 'segmented-btn active' : 'segmented-btn'}
            onClick={() => update({ isDoubleRiichi: true, isRiichi: false })}
          >
            ダブルリーチ
          </button>
        </div>
      </div>

      <div className="field-row checkbox-row">
        <label className={!value.isRiichi && !value.isDoubleRiichi ? 'disabled-label' : ''}>
          <input
            type="checkbox"
            checked={value.isIppatsu}
            disabled={!value.isRiichi && !value.isDoubleRiichi}
            onChange={(e) => update({ isIppatsu: e.target.checked })}
          />
          一発
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.isRinshan}
            onChange={(e) => update({ isRinshan: e.target.checked })}
          />
          嶺上開花
        </label>
        <label className={value.winType !== 'tsumo' ? 'disabled-label' : ''}>
          <input
            type="checkbox"
            checked={value.isHaitei}
            disabled={value.winType !== 'tsumo'}
            onChange={(e) => update({ isHaitei: e.target.checked })}
          />
          海底摸月
        </label>
        <label className={value.winType !== 'ron' ? 'disabled-label' : ''}>
          <input
            type="checkbox"
            checked={value.isHoutei}
            disabled={value.winType !== 'ron'}
            onChange={(e) => update({ isHoutei: e.target.checked })}
          />
          河底撈魚
        </label>
        <label className={value.winType !== 'ron' ? 'disabled-label' : ''}>
          <input
            type="checkbox"
            checked={value.isChankan}
            disabled={value.winType !== 'ron'}
            onChange={(e) => update({ isChankan: e.target.checked })}
          />
          槍槓
        </label>
      </div>

      <div className="field-row checkbox-row">
        <label className={value.winType !== 'tsumo' ? 'disabled-label' : ''}>
          <input
            type="checkbox"
            checked={value.isTenho}
            disabled={value.winType !== 'tsumo'}
            onChange={(e) => update({ isTenho: e.target.checked, isChiho: false })}
          />
          天和(親の配牌ツモ和了)
        </label>
        <label className={value.winType !== 'tsumo' ? 'disabled-label' : ''}>
          <input
            type="checkbox"
            checked={value.isChiho}
            disabled={value.winType !== 'tsumo'}
            onChange={(e) => update({ isChiho: e.target.checked, isTenho: false })}
          />
          地和(子の第一ツモ和了)
        </label>
      </div>

      <div className="field-row">
        <label>自風</label>
        <select value={value.seatWind} onChange={(e) => update({ seatWind: Number(e.target.value) as Wind })}>
          {seatWindOptions.map((w) => (
            <option key={w} value={w}>
              {HONOR_NAMES[w]}
            </option>
          ))}
        </select>
        <label>場風</label>
        <select value={value.roundWind} onChange={(e) => update({ roundWind: Number(e.target.value) as Wind })}>
          {WINDS.filter((w) => w <= 3).map((w) => (
            <option key={w} value={w}>
              {HONOR_NAMES[w]}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>本場</label>
        <input
          type="number"
          min={0}
          className="number-input"
          value={value.honba}
          onChange={(e) => update({ honba: Math.max(0, Number(e.target.value)) })}
        />
        <label>供託(リーチ棒)</label>
        <input
          type="number"
          min={0}
          className="number-input"
          value={value.kyotaku}
          onChange={(e) => update({ kyotaku: Math.max(0, Number(e.target.value)) })}
        />
      </div>
    </div>
  );
}
