import { availableTiles, tileEmoji, tileLabel, remainingForTile, parseTile } from '../engine';
import type { Ruleset } from '../engine';

interface TilePaletteProps {
  ruleset: Ruleset;
  usage: Record<string, number>;
  onSelect: (code: string) => void;
  disabled?: boolean;
}

export default function TilePalette({ ruleset, usage, onSelect, disabled }: TilePaletteProps) {
  const tiles = availableTiles(ruleset);
  const rows: { label: string; codes: string[] }[] = [
    { label: '萬子', codes: tiles.filter((t) => parseTile(t).suit === 'm') },
    { label: '筒子', codes: tiles.filter((t) => parseTile(t).suit === 'p') },
    { label: '索子', codes: tiles.filter((t) => parseTile(t).suit === 's') },
    { label: '字牌', codes: tiles.filter((t) => parseTile(t).suit === 'z') },
  ];

  return (
    <div className="tile-palette">
      {rows.map(
        (row) =>
          row.codes.length > 0 && (
            <div className="tile-palette-row" key={row.label}>
              <span className="tile-palette-row-label">{row.label}</span>
              <div className="tile-palette-row-tiles">
                {row.codes.map((code) => {
                  const remaining = remainingForTile(code, usage);
                  const isRed = code[0] === '0';
                  return (
                    <button
                      type="button"
                      key={code}
                      className={`tile-btn${isRed ? ' tile-btn-red' : ''}`}
                      disabled={disabled || remaining <= 0}
                      onClick={() => onSelect(code)}
                      title={tileLabel(code)}
                    >
                      <span className="tile-glyph">{tileEmoji(code)}</span>
                      <span className="tile-remaining">{remaining}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}
