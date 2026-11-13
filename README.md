# Five-in-One Calculator

A small, fast, frontend-only calculator website with five sections:

| Route | Section |
|---|---|
| `/` | Basic calculator (landing page) with temporary history |
| `/interest` | Simple interest, rate per ₹100 per month |
| `/converter` | Length, weight and volume converter |
| `/bmi` | BMI calculator |
| `/age` | Age / time-difference calculator, 10,000 BCE to 10,000 CE |

Stack: React 18, Vite, TypeScript, React Router, Lucide icons, plain CSS, Vitest. No backend, database or
browser storage.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Test

```bash
npm test           # runs every suite once (Vitest)
npm run test:watch # re-runs on change
npm run typecheck  # TypeScript, no emit
```

The tests live in `src/tests/` and cover all five calculators (parser and precedence, interest months and days,
every unit pair, BMI categories, BCE/CE age edge cases).

## Production build

```bash
npm run build      # type-checks, then builds to dist/
npm run preview    # serves dist/ locally to check the build
```

## Deploy to Vercel

`vercel.json` is already included. It sets the Vite build and rewrites every path to `index.html`, so deep
links such as `/bmi` and a browser refresh work.

**Option A: from Git (recommended)**

1. Push this folder to a GitHub, GitLab or Bitbucket repository.
2. In Vercel choose **Add New... > Project** and import the repository.
3. Leave the detected settings (Framework: Vite, Build command: `npm run build`, Output: `dist`) and click
   **Deploy**. Every push to the main branch then redeploys automatically.

**Option B: Vercel CLI**

```bash
npm install -g vercel
vercel          # first run: log in and answer the prompts; creates a preview deployment
vercel --prod   # deploys to production
```

## Project structure

```
src/
  calculations/   pure TypeScript, no React: basic/, interest/, conversion/, bmi/, age/
  utils/          shared helpers: calendar (leap years, day counts), parsing, formatting
  components/     Navbar, CalculatorDisplay, CalculatorButtons, HistoryPanel, InputField,
                  ResultCard, DateSelector, UnitSelector, ...
  pages/          one component per route
  hooks/          useCalculator, useHistory (in-memory), useOutcome, useCopy
  constants/      navigation items and unit tables
  types/          shared types
  styles/         design tokens and CSS
  tests/          Vitest suites
```

Pages only read inputs, call a function from `calculations/` and render the result. Interest and age share
the calendar helpers in `utils/calendar.ts`, so nothing is duplicated.

## How the calculations work

**Basic calculator.** A tokenizer and recursive-descent parser (no `eval`, no `Function`). Operator
precedence, unary minus and decimals are supported; division by zero is reported as an error. Results are
rounded to 15 significant digits so `0.1 + 0.2` shows `0.3`. `%` is a postfix divide-by-100:
`50%` = 0.5 and `200+10%` = 200.1 (it is not the phone-style "10% of the left value" rule).
History lives in React state above the router, so it survives switching pages and is gone after a reload.

**Interest (traditional method).** The rate is rupees per ₹100 per month: a rate of 2 means ₹2 on every
₹100, every month, so ₹1,000 earns ₹20 a month. For the interest a month is always 30 days (February too) and
a year is 12 months.

- Monthly interest = principal ÷ 100 × rate. Daily interest = monthly ÷ 30. Yearly interest = monthly × 12.
- **Main calculation (always shown):** count the whole calendar months from the first date to the last date,
  then the days left over. Interest = months × monthly interest + leftover days × daily interest.
  Example: ₹10,000 at 2, 1 Jan 2025 to 15 Mar 2026 = 14 months and 14 days (438 days in all) =
  14 × ₹200 + 14 × ₹6.6667 = ₹2,893.33, final amount ₹12,893.33.
- **Exact calculation (behind "Show exact calculation"):** every real day from the first date to the last date
  earns the daily interest, so a 31-day month earns more than a 30-day month. The result lists the months
  grouped by real length (31, 30, 29 and 28 days, the last two being February) with the interest per month for
  each group, then any extra days. The same example gives 438 × ₹6.6667 = ₹2,920.00.
- A whole month is counted on the same day-of-month (10 Jan to 10 Feb); if that day does not exist (31 Jan to
  February) it is the last day of that month. The last date is not counted as a day taken.
- Amounts keep full precision and are rounded to two decimals only for display (the daily figure shows four
  decimals so it can be checked by hand).

**Converter.** Each unit has an exact factor to a base unit (m, kg, L); `value x from / to`. Factors are the
exact definitions (inch 0.0254 m, pound 0.45359237 kg, US gallon 3.785411784 L, US fluid ounce
29.5735295625 ml). Very large or small outputs switch to exponent notation. Gallons and fluid ounces are US
customary, not imperial.

**BMI.** Height and weight are converted to metric exactly, then `kg / m^2`. Categories use the unrounded
value: below 18.5, below 25, below 30, otherwise obesity, so there are no gaps between bands.

**Age.** Years are held internally as astronomical years (1 BCE = 0, 2 BCE = -1, ...) while the interface
only ever shows 1-10,000 with a CE/BCE toggle, so there is no year-zero error: 31 Dec 1 BCE to 1 Jan 1 CE is
one day. Day counts use a days-from-civil algorithm on the proleptic Gregorian calendar (leap years by the
Gregorian rule applied to astronomical years, so 1 BCE is a leap year). The calendar duration finds the
largest whole number of months that fits and expresses the remainder as days, hours, minutes and seconds;
a start day that does not exist in the target month (31 Jan + 1 month) clamps to that month's last day.
Totals are exact integers. Invalid dates, year 0, out-of-range years and an up-to date before the from date
are rejected with a message, never silently corrected.

The date arithmetic is written by hand (about 60 lines of integer math) instead of using a Temporal
polyfill. That keeps the bundle small and avoids any dependency's handling of years far outside the usual
range.

## Things to know

- Dates before 1582 are **mathematical** proleptic Gregorian calculations, not reconstructions of the
  calendars actually used then.
- Times in the age calculator are plain clock values: no time zones, daylight saving or leap seconds.
- BMI categories are the standard adult ones. BMI is a screening measure, not a diagnosis.
