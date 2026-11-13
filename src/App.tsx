import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar/Navbar';
import { HistoryProvider } from './hooks/useHistory';
import { AgeCalculator } from './pages/AgeCalculator/AgeCalculator';
import { BasicCalculator } from './pages/BasicCalculator/BasicCalculator';
import { BMICalculator } from './pages/BMICalculator/BMICalculator';
import { InterestCalculator } from './pages/InterestCalculator/InterestCalculator';
import { UnitConverter } from './pages/UnitConverter/UnitConverter';

/** Pages fade in on navigation. Keyed by path so each route change replays the animation. */
function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<BasicCalculator />} />
        <Route path="/interest" element={<InterestCalculator />} />
        <Route path="/converter" element={<UnitConverter />} />
        <Route path="/bmi" element={<BMICalculator />} />
        <Route path="/age" element={<AgeCalculator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    // The history provider sits above the routes, so history survives switching pages.
    <HistoryProvider>
      <Navbar />
      <main className="main">
        <AnimatedRoutes />
      </main>
    </HistoryProvider>
  );
}
