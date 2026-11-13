import { BMI_THRESHOLDS, categorize, formatBmi, scalePercent } from '../../calculations/bmi';

const LEGEND = [
  { cls: 'under', name: 'Underweight', range: 'Below 18.5' },
  { cls: 'normal', name: 'Normal weight', range: '18.5 to 24.9' },
  { cls: 'over', name: 'Overweight', range: '25 to 29.9' },
  { cls: 'obese', name: 'Obesity', range: '30 and above' },
] as const;

const TICKS = [
  { value: 18.5, text: '18.5' },
  { value: 25, text: '25' },
  { value: 30, text: '30' },
] as const;

/** Flat four-band scale from BMI 15 to 40 with a marker at the calculated value. */
export function BmiScale({ bmi }: { bmi: number }) {
  const under = scalePercent(BMI_THRESHOLDS.underweight);
  const over = scalePercent(BMI_THRESHOLDS.overweight);
  const obese = scalePercent(BMI_THRESHOLDS.obesity);
  const text = formatBmi(bmi);

  return (
    <div className="bmi-scale">
      <div
        className="bmi-scale__track"
        role="img"
        aria-label={`BMI ${text} on a scale from 15 to 40, in the ${categorize(bmi)} range`}
      >
        <div className="bmi-scale__bar">
          <span className="bmi-scale__seg bmi-scale__seg--under" style={{ width: `${under}%` }} />
          <span className="bmi-scale__seg bmi-scale__seg--normal" style={{ width: `${over - under}%` }} />
          <span className="bmi-scale__seg bmi-scale__seg--over" style={{ width: `${obese - over}%` }} />
          <span className="bmi-scale__seg bmi-scale__seg--obese" style={{ width: `${100 - obese}%` }} />
        </div>
        <div className="bmi-scale__marker" style={{ left: `${scalePercent(bmi)}%` }}>
          <span className="bmi-scale__bubble">{text}</span>
        </div>
        <span className="bmi-scale__tick" style={{ left: '0%' }}>
          15
        </span>
        {TICKS.map((tick) => (
          <span key={tick.text} className="bmi-scale__tick" style={{ left: `${scalePercent(tick.value)}%` }}>
            {tick.text}
          </span>
        ))}
        <span className="bmi-scale__tick" style={{ left: '100%' }}>
          40
        </span>
      </div>

      <ul className="bmi-scale__legend">
        {LEGEND.map((item) => (
          <li key={item.cls}>
            <span className={`bmi-scale__dot bmi-scale__seg--${item.cls}`} aria-hidden="true" />
            <span>
              <strong>{item.name}</strong> {item.range}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
