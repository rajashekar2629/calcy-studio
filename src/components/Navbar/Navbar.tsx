import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/navigation';

/** Fixed top bar with one link per calculator. NavLink adds .active and aria-current="page". */
export function Navbar() {
  return (
    <header className="navbar">
      <nav className="navbar__nav" aria-label="Calculators">
        {NAV_ITEMS.map(({ to, label, title, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="navbar__link" aria-label={title} title={title}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
