import { PRACTICE_PROBLEMS } from '../src/data/practiceProblems';
import { calculateScore } from '../src/engine';
import type { CalcError, ScoreBreakdown } from '../src/engine';

function isError(r: ScoreBreakdown | CalcError): r is CalcError {
  return (r as CalcError).message !== undefined;
}

let errorCount = 0;
console.log(`合計問題数: ${PRACTICE_PROBLEMS.length}`);
console.log('---');

for (const p of PRACTICE_PROBLEMS) {
  const result = calculateScore(p);
  if (isError(result)) {
    errorCount++;
    console.log(`[NG] ${p.id} (${p.hint}): ${result.message}`);
    console.log(`     concealed=${p.concealedTiles.join(',')} win=${p.winningTile} melds=${JSON.stringify(p.melds)}`);
    continue;
  }
  const yakuNames = result.yakuList.map((y) => `${y.name}(${y.isYakuman ? '役満' : y.han + '翻'})`).join(' ');
  console.log(
    `[OK] ${p.id} (${p.hint}) [${p.common.ruleset}]: ${result.isYakuman ? '役満' : `${result.han}翻ろ${result.fu}符`} ${result.scoreName ?? ''} => ${result.totalPoints}点 | ${yakuNames}`
  );
}

console.log('---');
console.log(`エラー件数: ${errorCount} / ${PRACTICE_PROBLEMS.length}`);
if (errorCount > 0) process.exit(1);
