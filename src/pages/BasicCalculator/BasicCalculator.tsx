import { CalculatorButtons } from '../../components/CalculatorButtons/CalculatorButtons';
import { CalculatorDisplay } from '../../components/CalculatorDisplay/CalculatorDisplay';
import { HistoryPanel } from '../../components/HistoryPanel/HistoryPanel';
import { useCalculator } from '../../hooks/useCalculator';
import { useHistory } from '../../hooks/useHistory';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * Landing page. The calculator and history panel have fixed dimensions (see calculator.css), so
 * nothing moves or resizes when keys are pressed, results change or history grows.
 */
export function BasicCalculator() {
  usePageTitle('Basic Calculator');
  const { entries, clear } = useHistory();
  const { state, pressKey, reuseExpression, insertHistoryResult } = useCalculator();

  return (
    <div className="workspace">
      <section className="calc" aria-label="Basic calculator">
        <h1 className="sr-only">Basic Calculator</h1>
        <CalculatorDisplay
          expression={state.expression}
          result={state.result}
          error={state.error}
          final={state.justEvaluated}
        />
        <CalculatorButtons onPress={pressKey} />
      </section>

      <HistoryPanel
        entries={entries}
        onReuse={reuseExpression}
        onUseResult={insertHistoryResult}
        onClear={clear}
      />
    </div>
  );
}
